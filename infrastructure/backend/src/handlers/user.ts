import { GetCommand, UpdateCommand, DeleteCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../lib/dynamo';
import { ok, err } from '../lib/response';

export const handler = async (event: any) => {
  const path = event.path;
  const userId = event.requestContext?.authorizer?.claims?.sub || 'guest';

  try {
    if (path.endsWith('/profile')) return await getProfile(userId, event);
    if (path.endsWith('/preferences')) return await updatePreferences(event, userId);
    if (path.endsWith('/account') && event.httpMethod === 'DELETE') return await deleteAccount(userId);
    return err(404, 'Not found');
  } catch (e: any) {
    console.error(e);
    return err(500, e.message);
  }
};

async function getProfile(userId: string, event: any) {
  const claims = event.requestContext?.authorizer?.claims || {};
  
  const result = await db.send(new GetCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'METADATA' }
  }));
  const meta = result.Item || {};

  return ok({
    id: userId,
    email: claims.email,
    name: claims.name || claims['custom:fullname'] || 'Developer',
    joinedAt: claims.auth_time,
    language: meta.language,
    level: meta.level,
    avatar: meta.avatar,
    theme: meta.theme,
    notifications: meta.notifications
  });
}

async function updatePreferences(event: any, userId: string) {
  const { theme, language, level, notifications, avatar } = JSON.parse(event.body || '{}');
  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: 'METADATA' },
    UpdateExpression: 'set theme = :t, #lang = :l, #lvl = :lvl, notifications = :n, avatar = :a, updatedAt = :u',
    ExpressionAttributeNames: {
      '#lvl': 'level',
      '#lang': 'language'
    },
    ExpressionAttributeValues: {
      ':t': theme || 'dark',
      ':l': language || 'en',
      ':lvl': level || 'beginner',
      ':n': notifications || { email: true, push: false },
      ':a': avatar || null,
      ':u': new Date().toISOString()
    }
  }));
  return ok({ updated: true });
}

async function deleteAccount(userId: string) {
  // Delete all items for this user
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `USER#${userId}` }
  }));
  
  const items = result.Items || [];
  for (const item of items) {
    await db.send(new DeleteCommand({
      TableName: TABLE,
      Key: { PK: item.PK, SK: item.SK }
    }));
  }
  
  return ok({ deleted: true });
}
