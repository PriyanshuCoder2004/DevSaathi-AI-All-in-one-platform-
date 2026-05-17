import { 
  BedrockRuntimeClient, 
  InvokeModelCommand 
} from '@aws-sdk/client-bedrock-runtime';

const client = new BedrockRuntimeClient({ 
  region: process.env.BEDROCK_REGION || 'us-east-1'
});

const MODEL_ID = 'amazon.nova-lite-v1:0';

import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

export async function getPrompt(key: string, defaultPrompt: string): Promise<string> {
  if (!process.env.S3_PROMPTS_BUCKET) return defaultPrompt;
  try {
    const file = await s3.send(new GetObjectCommand({
      Bucket: process.env.S3_PROMPTS_BUCKET,
      Key: key
    }));
    if (file.Body) {
      const content = await file.Body.transformToString();
      console.log(`[S3 Prompts] 📂 Successfully fetched prompt template '${key}' from S3`);
      return content;
    }
  } catch (error) {
    console.log(`[S3 Prompts] ⚠️ Failed to fetch prompt '${key}' from S3, falling back to default.`);
  }
  return defaultPrompt;
}

export async function callAI(
  prompt: string, 
  maxTokens: number = 1500
): Promise<string> {
  try {
    console.log(`[Bedrock AI] 🚀 Invoking Model: ${MODEL_ID}`);
    console.log(`[Bedrock AI] 📦 Prompt Preview: "${prompt.substring(0, 120)}..."`);
    const startTime = Date.now();

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        messages: [{
          role: 'user',
          content: [{ text: prompt }]
        }],
        inferenceConfig: {
          max_new_tokens: maxTokens,
          temperature: 0.7,
          top_p: 0.9,
        }
      }),
    });

    const response = await client.send(command);
    const duration = Date.now() - startTime;
    console.log(`[Bedrock AI] ✅ Response received in ${duration}ms`);
    
    if (!response.body) {
      throw new Error('Empty response from Bedrock');
    }

    const result = JSON.parse(
      new TextDecoder().decode(response.body)
    );

    // Extract text from Nova Lite response format
    const text = result?.output?.message?.content?.[0]?.text;
    
    if (!text) {
      console.error('Unexpected Bedrock Response:', JSON.stringify(result));
      throw new Error('AI failed to generate a response');
    }

    return text;
  } catch (error: any) {
    console.error('Bedrock Call Error:', error);
    throw error;
  }
}

/**
 * Robust JSON parser that finds and extracts JSON from AI response strings
 */
export function parseJSON(text: string): any {
  if (!text) throw new Error('Cannot parse empty AI response');

  try {
    // Strategy 1: Look for JSON code blocks
    const codeBlockMatch = text.match(/```json\n?([\s\S]*?)\n?```/i);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim());
    }

    // Strategy 2: Look for balanced braces (most robust for objects)
    let braceCount = 0;
    let start = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '{') {
        if (start === -1) start = i;
        braceCount++;
      } else if (text[i] === '}') {
        braceCount--;
        if (braceCount === 0 && start !== -1) {
          const possibleJson = text.substring(start, i + 1);
          try {
            return JSON.parse(possibleJson);
          } catch (innerE) { /* continue */ }
        }
      }
    }

    // Strategy 3: Look for balanced brackets (for arrays)
    let bracketCount = 0;
    let bracketStart = -1;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === '[') {
        if (bracketStart === -1) bracketStart = i;
        bracketCount++;
      } else if (text[i] === ']') {
        bracketCount--;
        if (bracketCount === 0 && bracketStart !== -1) {
          const possibleJson = text.substring(bracketStart, i + 1);
          try {
            return JSON.parse(possibleJson);
          } catch (innerE) { /* continue */ }
        }
      }
    }

    // Strategy 4: Try parsing the whole thing (if it's just raw JSON)
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error('JSON Parse Error. Raw Text:', text);
    throw new Error(`Failed to parse AI response: ${error.message}`);
  }
}
