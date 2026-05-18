import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { callAI, parseJSON, getPrompt } from '../lib/bedrock';

const dynamo = new DynamoDBClient({ region: process.env.AWS_REGION });
const db = DynamoDBDocumentClient.from(dynamo);
const TABLE = process.env.DYNAMODB_TABLE!;

const ok = (data: any) => ({
  statusCode: 200,
  headers: { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
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
  const method = event.httpMethod || '';
  const userId = event.requestContext?.authorizer?.claims?.sub || 'test-user';
  
  try {
    const body = event.body ? JSON.parse(event.body) : {};

    if (path.includes('/explain')) 
      return await explainTopic(body, userId);
    
    if (path.includes('/quiz/generate')) 
      return await generateQuiz(body, userId);
    
    if (path.includes('/quiz/evaluate')) 
      return await evaluateQuiz(body, userId);
    
    if (path.includes('/quiz/save')) 
      return await saveQuizResult(body, userId);
    
    if (path.includes('/notes/generate')) 
      return await generateNotes(body, userId);

    if (path.includes('/followup')) 
      return await handleFollowUp(body, userId);

    return err(404, 'Route not found');
  } catch (e: any) {
    console.error('Tutor handler error:', e);
    return err(500, e.message || 'Internal server error');
  }
};

async function explainTopic(body: any, userId: string) {
  const { topic, language = 'en', module = 'General' } = body;
  const timestamp = Date.now();
  
  if (!topic) return err(400, 'Topic is required');
  if (topic.length > 500) return err(400, 'Topic exceeds 500 character limit');

  const isHindi = language === 'hi';
  const isGeneral = !module || module === 'General' || module === 'Common';

  const langInstruction = isHindi 
    ? "IMPORTANT: Write the entire response (explanation and realLifeExample) in HINDI (using Devanagari script). Keep the technical topic name and subtopics in English but explain them in Hindi." 
    : "Write the response in clear English.";

  const moduleInstruction = isGeneral ? "" : `You are acting as an expert AI tutor for the "${module}" module. Please explain the requested Topic ("${topic}") comprehensively and clearly.`;

  const defaultPrompt = `Explain the following technical topic to a developer.
Topic: {{TOPIC}}
Language: {{LANGUAGE}}
Module: {{MODULE}}
{{LANG_INSTRUCTION}}
{{MODULE_INSTRUCTION}}
  
  {
    "topic": "{{TOPIC}}",
    "isUnrelatedModule": false,
    "explanation": "Provide a comprehensive, highly detailed, and beautifully structured explanation. If the user asks a multi-part or long question (e.g., asking what it is, how it works, pros/cons, advantages), you MUST answer every single part explicitly and thoroughly. Structure your response like a professional AI assistant: 1. Start with a clear Short Answer / Definition. 2. Provide a Detailed Version explaining exactly How it Works step-by-step. 3. Include dedicated sections for Advantages, Disadvantages, or Pros & Cons using bullet points. Use markdown headings (e.g. '### What is it', '### How it Works', '### Pros & Cons') and bullet points ('- '). IMPORTANT: Separate all sections, paragraphs, and bulleted lists with '\\n\\n'.",
    "codeExample": "Write complete working code with inline comments explaining each line",
    "codeLanguage": "Choose the most relevant language for this topic (e.g. javascript, python, java, c++, sql).",
    "realLifeExample": "Write an Indian daily life analogy that makes this concept very clear",
    "subtopics": ["related concept 1", "related concept 2", "related concept 3"],
    "keyTakeaway": "Write the single most important thing to remember in one sentence"
  }`;

  const promptTemplate = await getPrompt('tutor/explain.txt', defaultPrompt);
  let prompt = promptTemplate
    .replace(/{{TOPIC}}/g, topic)
    .replace(/{{LANGUAGE}}/g, isHindi ? 'Hindi' : 'English')
    .replace(/{{MODULE}}/g, module)
    .replace(/{{LANG_INSTRUCTION}}/g, langInstruction)
    .replace(/{{MODULE_INSTRUCTION}}/g, moduleInstruction);

  if (!isGeneral && !promptTemplate.includes('{{MODULE_INSTRUCTION}}')) {
    prompt += `\n\n${moduleInstruction}`;
  }

  const raw = await callAI(prompt, 1500);
  let parsed = parseJSON(raw);
  
  // Force isUnrelatedModule to false so the AI never rejects a topic regardless of folder
  parsed.isUnrelatedModule = false;
  
  // Validation & Defaults to prevent frontend crashes
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('AI response is not a valid object');
  }

  // Ensure explanation is a string (Nova Lite sometimes returns an object)
  if (typeof parsed.explanation === 'object' && parsed.explanation !== null) {
    parsed.explanation = Object.values(parsed.explanation).join('\n\n');
  } else {
    parsed.explanation = parsed.explanation || 'No explanation generated.';
  }

  // Ensure mandatory fields exist
  parsed.topic = parsed.topic || topic;
  parsed.realLifeExample = parsed.realLifeExample || 'No example generated.';
  parsed.keyTakeaway = parsed.keyTakeaway || 'Remember to keep learning!';
  
  // CRITICAL: Ensure subtopics is an array
  if (!Array.isArray(parsed.subtopics)) {
    if (typeof parsed.subtopics === 'string') {
      parsed.subtopics = parsed.subtopics.split(',').map((s: string) => s.trim());
    } else {
      parsed.subtopics = ['Related concepts', 'Key principles', 'Best practices'];
    }
  }

  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `TOPIC#${timestamp}`,
      GSI1PK: `TOPIC#${topic.toLowerCase()}`,
      GSI1SK: new Date().toISOString(),
      id: `topic_${timestamp}`,
      userId,
      ...parsed,
      language,
      createdAt: new Date().toISOString(),
      type: 'TOPIC',
    }
  }));

  return ok({ ...parsed, id: `topic_${timestamp}`, createdAt: new Date().toISOString() });
}

async function generateQuiz(body: any, userId: string) {
  const { topic, explanation = '', count = 7 } = body;
  const questionCount = Math.min(Math.max(count, 5), 10);
  
  const defaultPrompt = `You are a quiz generator for DevSaathi AI, an Indian developer learning platform.

Generate exactly {{COUNT}} multiple choice questions about: "{{TOPIC}}"
Context: {{CONTEXT}}

IMPORTANT: Respond with ONLY valid JSON. No text before or after.

{
  "questions": [
    {
      "id": "q1",
      "question": "Question text here?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 2,
      "explanation": "Why this answer is correct in simple terms"
    }
  ]
}

Rules:
- First 2 questions: easy (basic definition)
- Middle 3 questions: medium (understanding)
- Last 2 questions: hard (application)
- All 4 options must be plausible
- No trick questions
- correctIndex is 0-based (0, 1, 2, or 3)`;

  const promptTemplate = await getPrompt('tutor/quiz.txt', defaultPrompt);
  const prompt = promptTemplate
    .replace(/{{COUNT}}/g, questionCount.toString())
    .replace(/{{TOPIC}}/g, topic)
    .replace(/{{CONTEXT}}/g, explanation.substring(0, 500));

  const raw = await callAI(prompt, 2000);
  return ok(parseJSON(raw));
}

async function evaluateQuiz(body: any, userId: string) {
  const { answers = [], timeTaken = 0 } = body;
  const correct = answers.filter((a: any) => a.correct === true).length;
  const score = answers.length > 0 
    ? Math.round((correct / answers.length) * 100) 
    : 0;
  
  return ok({ 
    score, 
    correct, 
    total: answers.length, 
    timeTaken 
  });
}

async function saveQuizResult(body: any, userId: string) {
  const { topicId, topic, score, answers, totalQuestions, timeTaken } = body;
  const timestamp = Date.now();
  
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `QUIZ#${timestamp}`,
      GSI1PK: `QUIZ#${topic}`,
      GSI1SK: new Date().toISOString(),
      id: `quiz_${timestamp}`,
      userId, topicId, topic, score,
      answers: answers || [],
      totalQuestions: totalQuestions || 0,
      timeTaken: timeTaken || 0,
      completedAt: new Date().toISOString(),
      type: 'QUIZ',
    }
  }));
  
  return ok({ saved: true });
}

async function generateNotes(body: any, userId: string) {
  const { topic, explanation = '' } = body;
  
  const defaultPrompt = `You are DevSaathi AI. Generate structured study notes.

Topic: "{{TOPIC}}"
Based on: "{{CONTEXT}}"

IMPORTANT: Respond with ONLY valid JSON. No text before or after.

{
  "title": "Notes: {{TOPIC}}",
  "content": "<h2>Key Concepts</h2><p>Main explanation here</p><ul><li><strong>Point 1:</strong> description</li><li><strong>Point 2:</strong> description</li><li><strong>Point 3:</strong> description</li></ul><h2>Code Example</h2><pre>code here with comments</pre><h2>Remember</h2><p>Key takeaway here</p>",
  "tags": ["tag1", "tag2", "tag3"],
  "wordCount": 150
}`;

  const promptTemplate = await getPrompt('tutor/notes.txt', defaultPrompt);
  const prompt = promptTemplate
    .replace(/{{TOPIC}}/g, topic)
    .replace(/{{CONTEXT}}/g, explanation.substring(0, 800));

  const raw = await callAI(prompt, 1000);
  const parsed = parseJSON(raw);
  const timestamp = Date.now();
  
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `NOTE#${timestamp}`,
      id: `note_${timestamp}`,
      userId,
      ...parsed,
      topic,
      isAI: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'NOTE',
    }
  }));
  
  return ok({ 
    ...parsed, 
    id: `note_${timestamp}`, 
    isAI: true, 
    createdAt: new Date().toISOString() 
  });
}

async function handleFollowUp(body: any, userId: string) {
  const { topic, explanation, question, context, language = 'en' } = body;

  const isHindi = language === 'hi';
  const langInstruction = isHindi 
    ? "IMPORTANT: Write the entire response (answer and realLifeExample) in HINDI (using Devanagari script)." 
    : "Write the response in English.";

  const prompt = `A user has a follow-up question about a topic.
Topic: ${topic}
Previous Explanation Context: ${explanation.substring(0, 500)}
Question: ${question}
${langInstruction}

IMPORTANT: Respond with ONLY valid JSON.
{
  "answer": "Write the detailed answer to the follow-up question here. IMPORTANT: Use '\\n\\n' between paragraphs for readability.",
  "codeExample": "Optionally provide code ONLY if relevant to the follow-up question, otherwise null",
  "realLifeExample": "Optionally provide a quick analogy ONLY if it helps clarify the follow-up, otherwise null"
} `;

  const raw = await callAI(prompt, 1200);
  const parsed = parseJSON(raw);
  
  return ok({
    ...parsed,
    answer: parsed.answer || 'I couldn\'t generate a specific answer. Could you rephrase?',
  });
}
