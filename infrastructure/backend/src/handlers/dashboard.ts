import { PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { db, TABLE } from '../lib/dynamo';
import { ok, err } from '../lib/response';

export const handler = async (event: any) => {
  const path = event.path;
  const userId = event.requestContext?.authorizer?.claims?.sub || 'guest';

  try {
    const p = (event.path || '').toLowerCase();
    
    if (p.includes('activity-all')) return await getAllActivity(userId);
    if (p.includes('activity-feed')) return await getActivityFeed(userId, event);
    if (p.includes('activity')) return await getActivity(userId);
    
    if (p.includes('stats')) return await getStats(userId);
    if (p.includes('recent')) return await getRecentTopics(userId);
    if (p.includes('progress')) return await getProgress(event, userId);
    if (p.includes('export')) return await exportData(userId);

    // NOTES CRUD
    const isNotes = p.includes('/notes');
    if (event.httpMethod === 'GET' && isNotes && !event.pathParameters?.id) return await getNotes(userId, event);
    if (event.httpMethod === 'GET' && isNotes && event.pathParameters?.id) return await getNote(event, userId);
    if (event.httpMethod === 'POST' && isNotes) return await saveNote(event, userId);
    if (event.httpMethod === 'PUT' && isNotes) return await updateNote(event, userId);
    if (event.httpMethod === 'DELETE' && isNotes) return await deleteNote(event, userId);
    
    if (p.includes('/quiz/history')) return await getQuizHistory(userId);

    return err(404, `Route not found: ${p}`);
  } catch (e: any) {
    console.error(e);
    return err(500, e.message);
  }
};

async function getAllActivity(userId: string) {
  const items = await getAllUserItems(userId);
  return ok(items.sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt || a.completedAt || 0).getTime();
    const timeB = new Date(b.createdAt || b.completedAt || 0).getTime();
    return timeB - timeA;
  }));
}

async function getAllUserItems(userId: string) {
  let items: any[] = [];
  let lastKey: any = undefined;
  do {
    const result: any = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: { ':pk': `USER#${userId}` },
      ExclusiveStartKey: lastKey,
      ScanIndexForward: false
    }));
    items = items.concat(result.Items || []);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return items;
}

async function exportData(userId: string) {
  const items = await getAllUserItems(userId);
  return ok({ export: items });
}

async function getStats(userId: string) {
  const items = await getAllUserItems(userId);
  
  const topics = items.filter(i => i.type === 'TOPIC');
  const quizzes = items.filter(i => i.type === 'QUIZ');
  const notes = items.filter(i => i.type === 'NOTE');
  const docs = items.filter(i => i.type === 'DOC');
  
  const totalScore = quizzes.reduce((sum, q) => {
    const s = Number(q.score);
    return sum + (isNaN(s) ? 0 : s);
  }, 0);
  const avgScore = quizzes.length > 0 ? Math.round(totalScore / quizzes.length) : 0;
  
  const activityDates = [...new Set(items.map(i => (i.createdAt || i.completedAt || '').split('T')[0]))]
    .filter(d => d)
    .sort();
    
  let streak = 0;
  const today = new Date().toISOString().split('T')[0];
  let checkDate = today;
  for (let i = activityDates.length - 1; i >= 0; i--) {
    if (activityDates[i] === checkDate) {
      streak++;
      const d = new Date(checkDate);
      d.setDate(d.getDate() - 1);
      checkDate = d.toISOString().split('T')[0];
    } else break;
  }
  
  return ok({ 
    topicsLearned: topics.length,
    quizzesCompleted: quizzes.length,
    averageScore: (typeof avgScore === 'number' && !isNaN(avgScore)) ? avgScore : 0,
    notesSaved: notes.length,
    docsAnalyzed: docs.length,
    streak: (typeof streak === 'number' && !isNaN(streak)) ? streak : 0,
  });
}

async function getActivity(userId: string) {
  const items = await getAllUserItems(userId);
  
  const counts: Record<string, number> = {};
  const last30 = Array.from({length: 30}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();
  
  last30.forEach(date => counts[date] = 0);
  items.forEach(item => {
    const date = (item.createdAt || item.completedAt || '').split('T')[0];
    if (date && counts[date] !== undefined) counts[date]++;
  });
  
  return ok(last30.map(date => ({ 
    day: date.split('-').slice(1).reverse().join('/'), // Format as DD/MM
    hours: counts[date] 
  })));
}

async function getActivityFeed(userId: string, event?: any) {
  // Use the same helper as stats to guarantee 100% consistency
  const allRawItems = await getAllUserItems(userId);
  
  const items = allRawItems.map(item => {
    const sk = item.SK || '';
    const skParts = sk.split('#');
    const skTimestamp = skParts.length > 1 ? parseInt(skParts[1]) : null;
    
    // Determine type from SK if missing
    let type = item.type;
    if (!type) {
      if (sk.startsWith('QUIZ#')) type = 'QUIZ';
      else if (sk.startsWith('TOPIC#')) type = 'TOPIC';
      else if (sk.startsWith('NOTE#')) type = 'NOTE';
      else if (sk.startsWith('DOC#')) type = 'DOC';
      else type = 'TOPIC';
    }

    let createdAt = item.createdAt || item.completedAt;
    if (!createdAt && skTimestamp && !isNaN(skTimestamp)) {
      createdAt = new Date(skTimestamp).toISOString();
    }
    if (!createdAt) createdAt = new Date().toISOString();
    
    return {
      ...item,
      type,
      text: item.text || (
        type === 'TOPIC' ? `Learned about ${item.topic || 'a topic'}`
        : type === 'QUIZ' ? `Completed quiz on ${item.topic || 'a topic'} — ${item.score || 0}%`
        : type === 'NOTE' ? `Saved notes on ${item.topic || 'a topic'}`
        : `Uploaded ${item.filename || 'a document'}`
      ),
      createdAt,
    };
  });

  return ok(items.sort((a: any, b: any) => {
    const timeA = new Date(a.createdAt).getTime();
    const timeB = new Date(b.createdAt).getTime();
    return timeB - timeA;
  }));
}

async function getRecentTopics(userId: string) {
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'TOPIC#' },
    ScanIndexForward: false, Limit: 5,
  }));
  return ok(result.Items || []);
}

async function getProgress(event: any, userId: string) {
  // Helper for pagination
  const fetchAll = async (skPrefix: string, scanIndexForward: boolean) => {
    let items: any[] = [];
    let lastKey: any = undefined;
    do {
      const result: any = await db.send(new QueryCommand({
        TableName: TABLE,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': skPrefix },
        ScanIndexForward: scanIndexForward,
        ExclusiveStartKey: lastKey
      }));
      items = items.concat(result.Items || []);
      lastKey = result.LastEvaluatedKey;
    } while (lastKey);
    return items;
  };

  const [rawQuizzes, topicsResult] = await Promise.all([
    fetchAll('QUIZ#', false),
    fetchAll('TOPIC#', true)
  ]);
  // rawQuizzes is already an array from fetchAll
  
  const quizzes = rawQuizzes.map((q: any) => {
    let time = q.createdAt || q.completedAt;
    if (!time && q.SK) {
      const parts = q.SK.split('#');
      if (parts.length > 1) {
        time = new Date(parseInt(parts[1])).toISOString();
      }
    }
    if (!time) time = new Date().toISOString();
    return { ...q, time } as any;
  });

  const topicMap: Record<string, any> = {};
  quizzes.forEach((q: any) => {
    if (typeof q.score !== 'number') return;
    if (!topicMap[q.topic]) topicMap[q.topic] = { scores: [], count: 0 };
    topicMap[q.topic].scores.push(q.score);
    topicMap[q.topic].count++;
  });
  
  const topicBreakdown = Object.entries(topicMap).map(([topic, data]: any) => ({
    topic,
    timesPracticed: data.count,
    bestScore: Math.max(...data.scores),
    latestScore: data.scores[data.scores.length - 1],
    trend: data.scores[data.scores.length-1] > data.scores[0] ? 'up' : 'down',
  }));

  const totalTopics = topicBreakdown.length || 0;
  
  // Improvement Calculation
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
  
  const recentQuizzes = quizzes.filter((q: any) => q.time >= thirtyDaysAgo && typeof q.score === 'number');
  const olderQuizzes = quizzes.filter((q: any) => q.time >= sixtyDaysAgo && q.time < thirtyDaysAgo && typeof q.score === 'number');
  
  const recentAvg = recentQuizzes.length > 0 ? recentQuizzes.reduce((s, q) => s + q.score, 0) / recentQuizzes.length : 0;
  const olderAvg = olderQuizzes.length > 0 ? olderQuizzes.reduce((s, q) => s + q.score, 0) / olderQuizzes.length : 0;
  
  let improvement = 0;
  if (olderAvg > 0) {
    improvement = Math.round(recentAvg - olderAvg);
  } else if (recentAvg > 0) {
    improvement = Math.round(recentAvg); // +% if they had 0 before
  }

  const sortedTopics = [...topicBreakdown].sort((a, b) => a.latestScore - b.latestScore);
  const weakestArea = sortedTopics.length > 0 ? sortedTopics[0].topic : 'None';
  const weakestAreaScore = sortedTopics.length > 0 ? sortedTopics[0].latestScore : 0;

  // Calculate performance data (last 7 days average)
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  const performanceData = last7Days.map(date => {
    const dayQuizzes = quizzes.filter(q => q.time.startsWith(date));
    const avg = dayQuizzes.length > 0 
      ? Math.round(dayQuizzes.reduce((sum, q) => sum + q.score, 0) / dayQuizzes.length)
      : 0;
    return { 
      day: format(new Date(date), 'EEE'), 
      score: avg, 
      target: 80 
    };
  });

  const dynamicRecommendations = [];
  
  if (sortedTopics.length > 0) {
    // 1. Critical: Weakest area (lowest latest score)
    const weakest = sortedTopics[0];
    dynamicRecommendations.push({
      id: '1',
      title: 'Master Your Weakest Area',
      description: `Focus on ${weakest.topic}. Your latest score was ${weakest.latestScore}%.`,
      type: 'CRITICAL',
      topicId: weakest.topic
    });

    // 2. Reinforcement: Something that dropped in score or second weakest
    const downwardTrend = sortedTopics.find((t: any) => t.trend === 'down' && t.topic !== weakest.topic);
    if (downwardTrend) {
      dynamicRecommendations.push({
        id: '2',
        title: 'Review Recent Topics',
        description: `Your performance in ${downwardTrend.topic} has decreased recently.`,
        type: 'REINFORCEMENT',
        topicId: downwardTrend.topic
      });
    } else if (sortedTopics.length > 1) {
      const secondWeakest = sortedTopics[1];
      dynamicRecommendations.push({
        id: '2',
        title: 'Needs Reinforcement',
        description: `Practice ${secondWeakest.topic} to improve your score of ${secondWeakest.latestScore}%.`,
        type: 'REINFORCEMENT',
        topicId: secondWeakest.topic
      });
    } else {
      dynamicRecommendations.push({
        id: '2',
        title: 'Expand Your Knowledge',
        description: 'Try exploring a new topic to broaden your skill set.',
        type: 'REINFORCEMENT',
        topicId: 'EXPLORE-NEW'
      });
    }

    // 3. Advanced/Explore: Strongest area
    const strongest = sortedTopics[sortedTopics.length - 1];
    if (strongest.latestScore >= 80 && strongest.topic !== weakest.topic) {
      dynamicRecommendations.push({
        id: '3',
        title: 'Ready for a Challenge?',
        description: `You're doing great in ${strongest.topic} (${strongest.latestScore}%). Try an advanced quiz.`,
        type: 'ADVANCED',
        topicId: strongest.topic
      });
    } else {
      dynamicRecommendations.push({
        id: '3',
        title: 'Set a New Goal',
        description: 'Aim to score 80% or higher on your next quiz to unlock advanced challenges.',
        type: 'ADVANCED',
        topicId: 'GOAL-80'
      });
    }
  } else {
    dynamicRecommendations.push({
      id: '1',
      title: 'Get Started',
      description: 'Complete more quizzes to get personalized recommendations.',
      type: 'CRITICAL',
      topicId: 'AUTO-101'
    });
    dynamicRecommendations.push({
      id: '2',
      title: 'Explore Topics',
      description: 'Browse our library of topics to find something interesting.',
      type: 'REINFORCEMENT',
      topicId: 'EXPLORE-ALL'
    });
    dynamicRecommendations.push({
      id: '3',
      title: 'Track Your Progress',
      description: 'Once you take quizzes, your performance will be tracked here.',
      type: 'ADVANCED',
      topicId: 'TRACKING-101'
    });
  }

  return ok({
    stats: {
      topicsMastered: topicBreakdown.filter(t => t.bestScore >= 80).length,
      totalTopics: totalTopics,
      improvement,
      improvementPeriod: 'month',
      weakestArea,
      weakestAreaScore
    },
    performanceData,
    topicBreakdown,
    recommendations: dynamicRecommendations
  });
}

// Helper to format date for performance chart
function format(date: Date, fmt: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
}

async function getNotes(userId: string, event: any) {
  const filter = event.queryStringParameters?.filter;
  const search = event.queryStringParameters?.search?.toLowerCase();

  let notes: any[] = [];
  let lastKey: any = undefined;
  do {
    const result: any = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'NOTE#' },
      ScanIndexForward: false,
      ExclusiveStartKey: lastKey
    }));
    notes = notes.concat(result.Items || []);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);

  // Filter by category
  if (filter === 'ai') {
    notes = notes.filter(n => n.isAI === true);
  } else if (filter === 'mine') {
    notes = notes.filter(n => n.isAI !== true);
  } else if (filter === 'bookmarked') {
    notes = notes.filter(n => n.isBookmarked === true);
  }

  // Filter by search query
  if (search) {
    notes = notes.filter(n => 
      n.title?.toLowerCase().includes(search) || 
      n.content?.toLowerCase().includes(search) ||
      n.topic?.toLowerCase().includes(search)
    );
  }

  return ok(notes);
}

async function getNote(event: any, userId: string) {
  const noteId = event.pathParameters?.id;
  const result = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    FilterExpression: 'id = :id',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':id': noteId }
  }));
  
  if (!result.Items?.[0]) return err(404, 'Note not found');
  return ok(result.Items[0]);
}

async function saveNote(event: any, userId: string) {
  const { title, content, topic, tags, isAI } = JSON.parse(event.body || '{}');
  const timestamp = Date.now();
  const id = `note_${timestamp}`;
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`, SK: `NOTE#${timestamp}`,
      id, userId, title, content, topic: topic || title,
      tags: tags || [], isAI: isAI || false,
      wordCount: content?.split(' ').length || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      type: 'NOTE',
    }
  }));

  // Also create a TOPIC entry to update learning stats when a note is saved
  await db.send(new PutCommand({
    TableName: TABLE,
    Item: {
      PK: `USER#${userId}`,
      SK: `TOPIC#${timestamp}`,
      id: `topic_${timestamp}`,
      userId,
      topic: topic || title,
      noteId: id,
      type: 'TOPIC',
      createdAt: new Date().toISOString(),
      source: 'notes'
    }
  }));

  return ok({ id, created: true });
}

async function updateNote(event: any, userId: string) {
  const noteId = event.pathParameters?.id;
  const { title, content, isBookmarked } = JSON.parse(event.body || '{}');
  
  // First find the note to get its full SK
  const existing = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    FilterExpression: 'id = :id',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':id': noteId }
  }));
  
  if (!existing.Items?.[0]) return err(404, 'Note not found');
  
  // Create update expression dynamically based on what's provided
  let UpdateExpression = 'set updatedAt = :u';
  let ExpressionAttributeValues: Record<string, any> = { ':u': new Date().toISOString() };

  if (title !== undefined) {
    UpdateExpression += ', title = :t';
    ExpressionAttributeValues[':t'] = title;
  }
  if (content !== undefined) {
    UpdateExpression += ', content = :c';
    ExpressionAttributeValues[':c'] = content;
  }
  if (isBookmarked !== undefined) {
    UpdateExpression += ', isBookmarked = :b';
    ExpressionAttributeValues[':b'] = isBookmarked;
  }

  await db.send(new UpdateCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: existing.Items[0].SK },
    UpdateExpression,
    ExpressionAttributeValues
  }));
  return ok({ updated: true });
}

async function deleteNote(event: any, userId: string) {
  const noteId = event.pathParameters?.id;
  const existing = await db.send(new QueryCommand({
    TableName: TABLE,
    KeyConditionExpression: 'PK = :pk',
    FilterExpression: 'id = :id',
    ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':id': noteId }
  }));
  
  if (!existing.Items?.[0]) return err(404, 'Note not found');
  
  await db.send(new DeleteCommand({
    TableName: TABLE,
    Key: { PK: `USER#${userId}`, SK: existing.Items[0].SK }
  }));
  return ok({ deleted: true });
}

async function getQuizHistory(userId: string) {
  let quizzes: any[] = [];
  let lastKey: any = undefined;
  do {
    const result: any = await db.send(new QueryCommand({
      TableName: TABLE,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
      ExpressionAttributeValues: { ':pk': `USER#${userId}`, ':sk': 'QUIZ#' },
      ScanIndexForward: false,
      ExclusiveStartKey: lastKey
    }));
    quizzes = quizzes.concat(result.Items || []);
    lastKey = result.LastEvaluatedKey;
  } while (lastKey);
  return ok(quizzes);
}
