import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { callAI, parseJSON, getPrompt } from '../lib/bedrock';
import { db, TABLE } from '../lib/dynamo';
import { ok, err } from '../lib/response';

const s3 = new S3Client({ region: process.env.AWS_REGION || 'ap-south-1' });

export const handler = async (event: any) => {
  const path = event.path;
  const userId = event.requestContext?.authorizer?.claims?.sub || 'guest';

  try {
    if (path.endsWith('/upload-url')) {
      const { filename, size, contentType } = JSON.parse(event.body || '{}');
      if (size > 10 * 1024 * 1024) return err(400, 'File exceeds 10MB limit');
      
      const s3Key = `uploads/${userId}/${Date.now()}_${filename}`;
      const command = new PutObjectCommand({ 
        Bucket: process.env.S3_UPLOADS_BUCKET!, 
        Key: s3Key,
        ContentType: contentType || 'application/octet-stream'
      });
      const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
      return ok({ uploadUrl, s3Key });
    }

    if (path.endsWith('/summarize')) {
      const { s3Key, filename, language = 'en', docId: providedDocId } = JSON.parse(event.body || '{}');
      
      const isHindi = language === 'hi';
      const langInstruction = isHindi 
        ? "IMPORTANT: Write the entire response (title, sections, keyPoints, and warnings) in HINDI (using Devanagari script)." 
        : "Write the response in English.";
      
      // Get file from S3
      const obj = await s3.send(new GetObjectCommand({ 
        Bucket: process.env.S3_UPLOADS_BUCKET!, Key: s3Key 
      }));
      let text = await obj.Body?.transformToString() || '';
      
      // Chunk if too long (Bedrock has token limits)
      const wordCount = text.split(' ').length;
      text = text.substring(0, 12000); // Trim for now
      
      const defaultPrompt = `You are an expert technical analyst for DevSaathi AI. 
Your goal is to provide a comprehensive, in-depth technical summary of the provided document titled "{{FILENAME}}".
Language: {{LANGUAGE}}
{{LANG_INSTRUCTION}}

Instructions:
1. Divide the document into logical technical sections (e.g., Architecture, Configuration, API Usage, Security).
2. For each section, write a detailed explanation (2-3 paragraphs) that covers technical nuances and implementation details. Do NOT be brief.
3. Identify 5-8 key technical insights as "keyPoints".
4. Highlight any critical warnings or technical requirements in the "warnings" array.

IMPORTANT: Respond with ONLY valid JSON.
{
  "title": "Clear Technical Title",
  "sections": [
    {
      "heading": "Section Heading",
      "content": "Deep technical explanation of this section. Explain how it works and why it matters."
    }
  ],
  "keyPoints": ["Detailed technical insight 1", "Detailed technical insight 2"],
  "warnings": [{"label": "CRITICAL", "description": "Detailed warning description"}],
  "readTime": 5,
  "pageCount": {{PAGE_COUNT}}
}

Document Content:
{{TEXT}}`;

      const promptTemplate = await getPrompt('docs/summarize.txt', defaultPrompt);
      const prompt = promptTemplate
        .replace(/{{FILENAME}}/g, filename)
        .replace(/{{LANGUAGE}}/g, isHindi ? 'Hindi' : 'English')
        .replace(/{{LANG_INSTRUCTION}}/g, langInstruction)
        .replace(/{{PAGE_COUNT}}/g, Math.ceil(wordCount / 250).toString())
        .replace(/{{TEXT}}/g, text);
      
      const response = await callAI(prompt, 2500);
      const summary = parseJSON(response);
      
      let docId = providedDocId || `doc_${Date.now()}`;
      let targetSK = `DOC#${Date.now()}`;

      // If we have a providedDocId, find its existing SK to overwrite it
      if (providedDocId) {
        const existing = await db.send(new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: 'PK = :pk',
          FilterExpression: 'id = :id',
          ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':id': providedDocId },
        }));
        if (existing.Items?.[0]) {
          targetSK = existing.Items[0].SK;
          docId = existing.Items[0].id;
        }
      }
      
      const createdAt = new Date().toISOString();

      // Save or Update the detailed document summary
      await db.send(new PutCommand({
        TableName: TABLE,
        Item: {
          PK: `USER#${userId}`,
          SK: targetSK,
          id: docId, userId, filename, s3Key, ...summary,
          fileSize: obj.ContentLength || 0,
          createdAt,
          type: 'DOC',
        }
      }));

      return ok({ ...summary, docId });
    }

    if (path.endsWith('/upload')) {
      const { filename, fileData, contentType } = JSON.parse(event.body || '{}');
      if (!fileData) return err(400, 'No file data provided');
      
      const buffer = Buffer.from(fileData, 'base64');
      if (buffer.length > 6 * 1024 * 1024) return err(400, 'File too large for direct upload (max 6MB)');

      const s3Key = `uploads/${userId}/${Date.now()}_${filename}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_UPLOADS_BUCKET!,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType || 'application/octet-stream'
      }));

      return ok({ s3Key, filename });
    }

    if (path.endsWith('/history')) {
      let docs: any[] = [];
      let lastKey: any = undefined;
      do {
        const result: any = await db.send(new QueryCommand({
          TableName: TABLE,
          KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
          ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'DOC#' },
          ScanIndexForward: false,
          ExclusiveStartKey: lastKey
        }));
        docs = docs.concat(result.Items || []);
        lastKey = result.LastEvaluatedKey;
      } while (lastKey);
      return ok(docs);
    }

    const docId = event.pathParameters?.docId;
    if (docId) {
      const result = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk',
        FilterExpression: 'id = :id',
        ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':id': docId },
      }));
      return result.Items?.[0] ? ok(result.Items[0]) : err(404, 'Document not found');
    }

    return err(404, 'Not found');
  } catch (e: any) {
    console.error(e);
    return err(500, e.message);
  }
};
