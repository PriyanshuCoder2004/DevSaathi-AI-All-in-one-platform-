const { DynamoDBClient, ScanCommand } = require('@aws-sdk/client-dynamodb');
const { unmarshall } = require('@aws-sdk/util-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });

async function check() {
  try {
    const res = await client.send(new ScanCommand({
      TableName: 'devsaathi-main',
    }));
    
    const items = res.Items.map(i => unmarshall(i));
    
    // Sort by createdAt desc
    items.sort((a, b) => {
      const ta = new Date(a.createdAt || a.completedAt || 0).getTime();
      const tb = new Date(b.createdAt || b.completedAt || 0).getTime();
      return tb - ta;
    });

    console.log(`Total items: ${items.length}`);
    const recentItems = items.filter(i => {
      const d = i.createdAt || i.completedAt || '';
      return d >= '2026-05-11';
    });
    console.log(`Items since May 11: ${recentItems.length}`);
    if (recentItems.length > 0) {
      console.log('Most recent 5 items:');
      recentItems.slice(0, 5).forEach(i => console.log(`${i.PK} - ${i.SK} - ${i.createdAt || i.completedAt} - ${i.type}`));
    }
  } catch(e) {
    console.error('Error:', e);
  }
}
check();
