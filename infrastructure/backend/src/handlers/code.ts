import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';
import { callAI, parseJSON } from '../lib/bedrock';

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(dynamo);
const TABLE = process.env.DYNAMODB_TABLE!;

const ok = (data: any) => ({
  statusCode: 200,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify(data),
});

const err = (status: number, message: string) => ({
  statusCode: status,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*' 
  },
  body: JSON.stringify({ error: message }),
});

export const handler = async (event: any) => {
  const path = event.path || '';
  const userId = event.requestContext?.authorizer?.claims?.sub || 'test-user';
  
  try {
    const { code, language = 'en' } = JSON.parse(event.body || '{}');
    
    if (!code) return err(400, 'Code is required');
    
    const lineCount = code.split('\n').length;
    if (lineCount > 5000) return err(400, 'Code exceeds 5000 line limit');

    if (path.includes('/explain')) 
      return await explainCode(code, userId, language);
    
    if (path.includes('/debug'))   
      return await debugCode(code, userId, language);
    
    if (path.includes('/improve')) 
      return await improveCode(code, userId, language);

    return err(404, 'Route not found');
  } catch (e: any) {
    console.error('Code handler error:', e);
    return err(500, e.message || 'Internal server error');
  }
};

async function explainCode(code: string, userId: string, language: string = 'en') {
  const isHindi = language === 'hi';
  const langInstruction = isHindi 
    ? "IMPORTANT: Write the entire response (explanation and descriptions) in HINDI (using Devanagari script)." 
    : "Write the response in English.";

  const prompt = `You are a senior software engineer explaining code to a junior developer.
Language: ${isHindi ? 'Hindi' : 'English'}
${langInstruction}

Analyze this code:
\`\`\`
${code.substring(0, 3000)}
\`\`\`

IMPORTANT: Respond with ONLY valid JSON. No text before or after.

{
  "detectedLanguage": "javascript",
  "explanation": "2-3 sentence plain English description of what this code does overall",
  "keyConcepts": [
    {"name": "Concept Name", "description": "Simple one-line explanation"}
  ],
  "logicFlow": [
    {"step": 1, "title": "Step Name", "description": "What happens in this step"}
  ],
}`;

  const raw = await callAI(prompt, 1500);
  const parsed = parseJSON(raw);
  
  // Validation
  parsed.detectedLanguage = parsed.detectedLanguage || 'javascript';
  parsed.explanation = parsed.explanation || 'No explanation generated.';
  parsed.keyConcepts = Array.isArray(parsed.keyConcepts) ? parsed.keyConcepts : [];
  parsed.logicFlow = Array.isArray(parsed.logicFlow) ? parsed.logicFlow : [];
  parsed.isValid = typeof parsed.isValid === 'boolean' ? parsed.isValid : true;

  return ok(parsed);
}

async function debugCode(code: string, userId: string, language: string = 'en') {
  const isHindi = language === 'hi';
  const langInstruction = isHindi 
    ? "IMPORTANT: Write the entire response (bug descriptions and summary) in HINDI (using Devanagari script)." 
    : "Write the response in English.";

  const prompt = `You are an expert debugger. Find ALL bugs in this code.
Language: ${isHindi ? 'Hindi' : 'English'}
${langInstruction}

Code to analyze:
\`\`\`
${code.substring(0, 3000)}
\`\`\`

IMPORTANT: Respond with ONLY valid JSON. No text before or after.

If bugs found:
{
  "detectedLanguage": "javascript",
  "bugs": [
    {
      "severity": "critical",
      "title": "Short descriptive bug title",
      "description": "Why this is a problem and what can go wrong",
      "lineNumbers": [5, 12],
      "fix": "// Corrected code snippet here"
    }
  ],
  "summary": "Overall assessment of code quality"
}

If NO bugs:
{
  "detectedLanguage": "javascript",
  "bugs": [],
  "summary": "Code looks clean and ready for deployment!"
}

Severity levels: critical (crashes app), moderate (wrong output), minor (style issue)`;

  const raw = await callAI(prompt, 2000);
  const parsed = parseJSON(raw);
  
  // Validation
  parsed.detectedLanguage = parsed.detectedLanguage || 'javascript';
  parsed.bugs = Array.isArray(parsed.bugs) ? parsed.bugs : [];
  parsed.summary = parsed.summary || 'No summary generated.';

  return ok(parsed);
}

async function improveCode(code: string, userId: string, language: string = 'en') {
  const isHindi = language === 'hi';
  const langInstruction = isHindi 
    ? "IMPORTANT: Write the entire response (suggestions and benefits) in HINDI (using Devanagari script)." 
    : "Write the response in English.";

  const prompt = `You are a code review expert. Suggest the top 5 improvements.
Language: ${isHindi ? 'Hindi' : 'English'}
${langInstruction}

Code to review:
\`\`\`
${code.substring(0, 3000)}
\`\`\`

IMPORTANT: Respond with ONLY valid JSON. No text before or after.

{
  "detectedLanguage": "javascript",
  "improvements": [
    {
      "category": "Performance",
      "suggestion": "What to change and exactly how to change it",
      "benefit": "Why this makes the code better",
      "priority": "high"
    }
  ]
}

Categories: Performance, Readability, Best Practice, Security
Priority: high, medium, low
Give maximum 5 most impactful improvements only.`;

  const raw = await callAI(prompt, 1500);
  const parsed = parseJSON(raw);
  
  // Validation
  parsed.detectedLanguage = parsed.detectedLanguage || 'javascript';
  parsed.improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];

  return ok(parsed);
}
