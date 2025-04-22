// DynamoDB Migration Script: Copy 'startTime' or 'date' to 'time' for all tracker entries where 'time' is missing.
// Usage: node scripts/migrate_starttime_date_to_time.js

require('dotenv').config({ path: __dirname + '/.env' });
const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-2' }); // Updated region

const docClient = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TRACKER_ENTRIES_TABLE_NAME || 'aio-tracker-entries';

async function migrate() {
  let ExclusiveStartKey = undefined;
  let updated = 0;
  let scanned = 0;
  do {
    const scanParams = {
      TableName: TABLE_NAME,
      FilterExpression: 'attribute_not_exists(#tm) and (attribute_exists(startTime) or attribute_exists(#dt))',
      ExpressionAttributeNames: {
        '#tm': 'time',
        '#dt': 'date',
      },
      ExclusiveStartKey,
    };
    const result = await docClient.scan(scanParams).promise();
    for (const item of result.Items) {
      scanned++;
      let newTime = item.startTime || item.date;
      if (!newTime) continue;
      const updateParams = {
        TableName: TABLE_NAME,
        Key: {
          babyId: item.babyId,
          entryId: item.entryId,
        },
        UpdateExpression: 'set #tm = :t',
        ExpressionAttributeNames: {
          '#tm': 'time',
        },
        ExpressionAttributeValues: {
          ':t': newTime,
        },
      };

      await docClient.update(updateParams).promise();
      updated++;
      console.log(`Migrated entryId=${item.entryId}: set time=${newTime}`);
    }
    ExclusiveStartKey = result.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  console.log(`Migration complete. Scanned: ${scanned}, Updated: ${updated}`);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
