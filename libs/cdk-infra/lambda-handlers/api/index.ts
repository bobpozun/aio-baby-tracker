import { Handler, APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto';

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);

const babiesTable = process.env.BABIES_TABLE_NAME;
const trackerEntriesTable = process.env.TRACKER_ENTRIES_TABLE_NAME;
const checklistStatusTable = process.env.CHECKLIST_STATUS_TABLE_NAME;

console.log('ENV VAR - babiesTable:', babiesTable);
console.log('ENV VAR - trackerEntriesTable:', trackerEntriesTable);
console.log('ENV VAR - checklistStatusTable:', checklistStatusTable);

const createApiResponse = (statusCode: number, body: any): APIGatewayProxyResult => {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
    },
    body: JSON.stringify(body),
  };
};

function formatDateMMDDYYYY_HHMMSS(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}${pad(d.getDate())}${d.getFullYear()} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`;
}

function extractAndFormatTime(entry: any): string {
  // Always prefer startDateTime, then createdAt
  const raw = entry.startDateTime || entry.createdAt || entry.startTime || entry.date;
  if (!raw) return '';
  const d = new Date(raw);
  return formatDateMMDDYYYY_HHMMSS(d);
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  if (event.httpMethod === 'OPTIONS') {
    return createApiResponse(200, {});
  }
  console.log('EVENT:', JSON.stringify(event, null, 2));

  console.log('DEBUG: event.requestContext:', JSON.stringify(event.requestContext, null, 2));
  if (event.requestContext && event.requestContext.authorizer) {
    console.log('DEBUG: event.requestContext.authorizer:', JSON.stringify(event.requestContext.authorizer, null, 2));
  } else {
    console.log('DEBUG: event.requestContext.authorizer is missing');
  }

  const httpMethod = event.httpMethod;
  const path = event.resource || event.path;
  let normalizedPath = path;
  const stageMatch = normalizedPath.match(/^\/(prod|dev|staging)(\/|$)/);
  if (stageMatch) {
    normalizedPath = normalizedPath.replace(/^\/(prod|dev|staging)(\/|$)/, '/');
  }

  if (normalizedPath.length > 1 && normalizedPath.endsWith('/')) {
    normalizedPath = normalizedPath.slice(0, -1);
  }
  console.log('DEBUG: normalizedPath:', normalizedPath, 'httpMethod:', httpMethod);
  const pathParameters = event.pathParameters;
  const body = event.body ? JSON.parse(event.body) : null;

  console.log('DEBUG: authorizer.claims:', JSON.stringify(event.requestContext.authorizer?.claims, null, 2));
  const userId = event.requestContext.authorizer?.claims?.sub;

  const debugPath = event.resource || event.path;
  console.log(
    'DEBUG: path:',
    debugPath,
    'event.path:',
    event.path,
    'event.resource:',
    event.resource,
    'event.httpMethod:',
    event.httpMethod
  );

  if (!userId) {
    console.error('User ID not found in authorizer claims.');
    return createApiResponse(401, {
      message: 'Unauthorized: User identifier missing.',
    });
  }

  console.log(`Authenticated User ID (sub): ${userId}`);

  if (!babiesTable || !trackerEntriesTable || !checklistStatusTable) {
    console.error('CRITICAL: One or more DynamoDB table names are missing from environment variables!');
    return createApiResponse(500, {
      message: 'Internal Server Error: Configuration missing.',
    });
  }

  try {
    if (normalizedPath === '/profiles' && httpMethod === 'GET') {
      console.log(`ROUTE: GET /profiles for user ${userId}`);
      const command = new QueryCommand({
        TableName: babiesTable,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      });
      const result = await docClient.send(command);

      const profiles = (result.Items || []).map((item) => ({
        id: item.babyId,
        name: item.name,
        birthday: item.birthday,
      }));
      console.log(`Returning ${profiles.length} mapped profiles.`);
      return createApiResponse(200, profiles);
    } else if (normalizedPath === '/profiles' && httpMethod === 'POST') {
      console.log(`ROUTE: POST /profiles for user ${userId}`);
      if (!body || !body.name || !body.birthday) {
        return createApiResponse(400, {
          message: 'Missing required fields: name, birthday',
        });
      }
      const babyId = `baby_${randomUUID()}`;
      const newItem = {
        userId: userId,
        babyId: babyId,
        name: body.name,
        birthday: body.birthday,
        createdAt: new Date().toISOString(),
      };
      const command = new PutCommand({
        TableName: babiesTable,
        Item: newItem,
      });
      await docClient.send(command);
      return createApiResponse(201, {
        id: babyId,
        name: newItem.name,
        birthday: newItem.birthday,
      });
    } else if (normalizedPath === '/profiles/{profileId}' && httpMethod === 'PUT') {
      const profileId = pathParameters?.profileId;
      console.log(`ROUTE: PUT /profiles/${profileId} for user ${userId}`);
      if (!profileId || !body || !body.name || !body.birthday) {
        return createApiResponse(400, {
          message: 'Missing profileId or required fields: name, birthday',
        });
      }
      const command = new UpdateCommand({
        TableName: babiesTable,
        Key: { userId: userId, babyId: profileId },
        UpdateExpression: 'set #nm = :n, birthday = :b, updatedAt = :ua',
        ExpressionAttributeNames: { '#nm': 'name' },
        ExpressionAttributeValues: {
          ':n': body.name,
          ':b': body.birthday,
          ':ua': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      });
      const result = await docClient.send(command);

      return createApiResponse(200, { id: profileId, ...result.Attributes });
    } else if (normalizedPath === '/profiles/{profileId}' && httpMethod === 'DELETE') {
      const profileId = pathParameters?.profileId;
      if (!profileId) {
        return createApiResponse(400, { message: 'Missing profileId' });
      }
      console.log(`ROUTE: DELETE /profiles/${profileId} for user ${userId}`);

      let trackerEntries;
      try {
        const queryResult = await docClient.send(
          new QueryCommand({
            TableName: trackerEntriesTable,
            KeyConditionExpression: 'babyId = :bid',
            ExpressionAttributeValues: { ':bid': profileId },
          })
        );
        trackerEntries = queryResult.Items || [];
        console.log(`Found ${trackerEntries.length} tracker entries for profile ${profileId}`);
      } catch (err) {
        console.error('Error querying tracker entries for profile:', err);
        return createApiResponse(500, {
          message: 'Failed to query tracker entries for profile.',
        });
      }

      const BATCH_SIZE = 25;
      for (let i = 0; i < trackerEntries.length; i += BATCH_SIZE) {
        const batch = trackerEntries.slice(i, i + BATCH_SIZE);
        const deleteRequests = batch.map((entry: any) => ({
          DeleteRequest: {
            Key: { babyId: entry.babyId, entryId: entry.entryId },
          },
        }));
        const batchParams = {
          RequestItems: {
            [trackerEntriesTable as string]: deleteRequests,
          },
        };
        try {
          const { BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
          await docClient.send(new BatchWriteCommand(batchParams));
          console.log(`Deleted batch of ${deleteRequests.length} tracker entries for profile ${profileId}`);
        } catch (err) {
          try {
            console.error('Error deleting tracker entries batch:', err);
            console.error('Full error object:', JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
          } catch (logErr) {
            console.error('Error stringifying error:', logErr);
            console.error('Raw error:', err);
          }
          return createApiResponse(500, {
            message: 'Failed to delete tracker entries for profile.',
          });
        }
      }
      const command = new DeleteCommand({
        TableName: babiesTable,
        Key: { userId: userId, babyId: profileId },
      });
      await docClient.send(command);
      return createApiResponse(200, {
        message: `Profile ${profileId} and all related tracker entries deleted successfully`,
      });
    } else if (normalizedPath === '/profiles/{profileId}/trackers/{trackerType}' && httpMethod === 'GET') {
      const babyId = pathParameters?.profileId;
      const trackerType = pathParameters?.trackerType;
      console.log(`ROUTE: GET /profiles/${babyId}/trackers/${trackerType}`);
      if (!babyId || !trackerType) {
        return createApiResponse(400, {
          message: 'Missing profileId or trackerType',
        });
      }

      try {
        const getProfileCommand = new GetCommand({
          TableName: babiesTable,
          Key: { userId: userId, babyId: babyId },
        });
        const profileResult = await docClient.send(getProfileCommand);
        if (!profileResult.Item) {
          console.warn(`User ${userId} does not own profile ${babyId} or it does not exist.`);
          return createApiResponse(404, {
            message: 'Profile not found or access denied.',
          });
        }
        console.log(`User ${userId} verified ownership of profile ${babyId}.`);
      } catch (verifyError: any) {
        console.error(`Error verifying profile ownership for ${babyId}:`, verifyError);
        return createApiResponse(500, {
          message: 'Internal Server Error during ownership verification.',
        });
      }

      const command = new QueryCommand({
        TableName: trackerEntriesTable,
        KeyConditionExpression: 'babyId = :bid',
        FilterExpression: 'trackerType = :tt',
        ExpressionAttributeValues: {
          ':bid': babyId,
          ':tt': trackerType,
        },
        ScanIndexForward: false,
      });
      const result = await docClient.send(command);
      // Remove 'time' field from all entries before returning
      const items = (result.Items || []).map((entry) => {
        
        return entry;
      });
      return createApiResponse(200, items);
    } else if (normalizedPath === '/profiles/{profileId}/trackers/{trackerType}' && httpMethod === 'POST') {
      const babyId = pathParameters?.profileId;
      const trackerType = pathParameters?.trackerType;
      console.log(`ROUTE: POST /profiles/${babyId}/trackers/${trackerType}`);
      if (!babyId || !trackerType || !body) {
        return createApiResponse(400, {
          message: 'Missing profileId, trackerType, or request body',
        });
      }

      const entryId = `${trackerType}_${Date.now()}_${randomUUID().substring(0, 8)}`;
      const newItem = {
        babyId: babyId,
        entryId: entryId,
        trackerType: trackerType,
        ...body,
        createdAt: new Date().toISOString(),
      };
      const command = new PutCommand({
        TableName: trackerEntriesTable,
        Item: newItem,
      });
      await docClient.send(command);
      return createApiResponse(201, newItem);
    } else if (normalizedPath === '/profiles/{profileId}/trackers/{trackerType}/{entryId}' && httpMethod === 'DELETE') {
      const babyId = pathParameters?.profileId;
      const trackerType = pathParameters?.trackerType;
      const entryId = pathParameters?.entryId;
      console.log(`ROUTE: DELETE /profiles/${babyId}/trackers/${trackerType}/${entryId}`);

      if (!babyId || !trackerType || !entryId) {
        return createApiResponse(400, { message: 'Missing parameters' });
      }

      try {
        const getProfileCommand = new GetCommand({
          TableName: babiesTable,
          Key: { userId: userId, babyId: babyId },
        });
        const profileResult = await docClient.send(getProfileCommand);
        if (!profileResult.Item) {
          console.warn(`User ${userId} does not own profile ${babyId} or it does not exist.`);
          return createApiResponse(404, {
            message: 'Profile not found or access denied.',
          });
        }
        console.log(`User ${userId} verified ownership of profile ${babyId}.`);
      } catch (verifyError: any) {
        console.error(`Error verifying profile ownership for ${babyId}:`, verifyError);
        return createApiResponse(500, {
          message: 'Internal Server Error during ownership verification.',
        });
      }

      const command = new DeleteCommand({
        TableName: trackerEntriesTable,
        Key: { babyId: babyId, entryId: entryId },
      });
      await docClient.send(command);
      return createApiResponse(200, { message: 'Tracker entry deleted' });
    } else if (normalizedPath === '/reports' && httpMethod === 'GET') {
      const { profileId, trackers, timeRange } = event.queryStringParameters || {};
      if (!profileId || !trackers || !timeRange) {
        return createApiResponse(400, {
          message: 'Missing required query parameters: profileId, trackers, timeRange',
        });
      }

      const trackersArr = trackers
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);

      let fromDate: Date;
      const now = new Date();
      if (timeRange === 'last24hours') {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (timeRange === 'last7days') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'last30days') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      const command = new QueryCommand({
        TableName: trackerEntriesTable,
        KeyConditionExpression: 'babyId = :bid',
        ExpressionAttributeValues: {
          ':bid': profileId,
        },
        ScanIndexForward: false,
      });
      const result = await docClient.send(command);
      const allEntries = (result.Items || []).filter((entry: any) => {
        if (!trackersArr.includes(entry.trackerType)) return false;

        const entryDateStr = entry.startDateTime || entry.createdAt || entry.startTime;
        if (!entryDateStr) return false;
        const entryTime = new Date(entryDateStr);
        return entryTime >= fromDate && entryTime <= now;
      });
      console.log('DEBUG: allEntries after filter:', JSON.stringify(allEntries, null, 2));

      const report: any = {};
      for (const tracker of trackersArr) {
        const entries = allEntries.filter((e: any) => e.trackerType === tracker);
        console.log(`DEBUG: entries for tracker ${tracker}:`, JSON.stringify(entries, null, 2));
        if (tracker === 'sleep') {
           // Calculate duration in hours from startDateTime and endDateTime
           const getDurationHours = (e: any) => {
             const start = e.startDateTime ? new Date(e.startDateTime) : null;
             const end = e.endDateTime ? new Date(e.endDateTime) : null;
             if (start && end && !isNaN(start.getTime()) && !isNaN(end.getTime())) {
               return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
             }
             return 0;
           };
           const totalHours = entries.reduce((sum: number, e: any) => sum + getDurationHours(e), 0);
           const avgDuration = entries.length ? totalHours / entries.length : 0;
           const chartData = entries.map((e: any) => ({
             date: e.startDateTime || e.createdAt || e.startTime,
             startDateTime: e.startDateTime || e.createdAt || e.startTime,
             hours: getDurationHours(e),
           }));
           report.sleepSummary = { totalHours, avgDuration, chartData };
        } else if (tracker === 'nursing') {
          let chartData: Array<{
            date: string;
            side: string;
            duration: number;
            startDateTime?: string;
          }> = [];
          let allDurations: number[] = [];

          entries.forEach((e: any) => {
            if (e.durationLeft && e.durationLeft > 0) {
              chartData.push({
                date: e.startTime,
                startDateTime: e.startTime,
                side: 'left',
                duration: e.durationLeft,
              });
              allDurations.push(e.durationLeft);
            }
            if (e.durationRight && e.durationRight > 0) {
              chartData.push({
                date: e.startTime,
                startDateTime: e.startTime,
                side: 'right',
                duration: e.durationRight,
              });
              allDurations.push(e.durationRight);
            }
          });

          const totalSessions = allDurations.length;
          const avgDuration = totalSessions ? allDurations.reduce((sum, d) => sum + d, 0) / totalSessions : 0;
          report.nursingSummary = {
            totalSessions,
            avgDuration,
            chartData,
          };
        } else if (tracker === 'bottle') {
          const totalBottles = entries.length;
          const avgAmount = entries.length
            ? entries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) / entries.length
            : 0;
          const chartData = entries.map((e: any) => ({
            date: e.startDateTime || e.createdAt || e.startTime,
            startDateTime: e.startDateTime || e.createdAt || e.startTime,
            amount: e.amount || 0,
          }));
          report.bottleSummary = { totalBottles, avgAmount, chartData };
        } else if (tracker === 'diaper') {
          const wetCount = entries.filter((e: any) => e.type === 'wet').length;
          const dirtyCount = entries.filter((e: any) => e.type === 'dirty').length;
          const chartData = entries.map((e: any) => {
            const time = extractAndFormatTime(e);
            return {
              date: time,
              startDateTime: time,
              type: e.type,
            };
          });
          report.diaperSummary = { wetCount, dirtyCount, chartData };
        } else if (tracker === 'solids') {
          const totalFeedings = entries.length;
          const avgAmount = entries.length
            ? entries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) / entries.length
            : 0;
          const chartData = entries.map((e: any) => ({
            date: e.startDateTime || e.createdAt || e.startTime,
            startDateTime: e.startDateTime || e.createdAt || e.startTime,
            amount: e.amount || 0,
          }));
          report.solidsSummary = { totalFeedings, avgAmount, chartData };
        } else if (tracker === 'medicine') {
          // Only use entries with a valid date
          const validEntries = entries.filter((e: any) => e.startDateTime || e.createdAt || e.startTime);
          const totalDoses = validEntries.length;
          const medicinesGiven = Array.from(new Set(validEntries.map((e: any) => e.medicineName).filter(Boolean)));
          const chartData = validEntries.map((e: any) => ({
            date: e.startDateTime || e.createdAt || e.startTime,
            startDateTime: e.startDateTime || e.createdAt || e.startTime,
            medicineName: e.medicineName || '',
            trackerType: e.trackerType,
          }));
          report.medicineSummary = { totalDoses, medicinesGiven, chartData };
        } else if (tracker === 'growth') {
          // Only use entries with a valid date
          const validEntries = entries.filter((e: any) => e.startDateTime || e.createdAt || e.startTime);
          // Sort by valid date descending
          const sorted = validEntries.sort((a: any, b: any) => {
            const dateA = new Date(a.startDateTime || a.createdAt || a.startTime).getTime();
            const dateB = new Date(b.startDateTime || b.createdAt || b.startTime).getTime();
            return dateB - dateA;
          });
          const latest = sorted[0] || {};
          const chartData = validEntries.map((e: any) => ({
            date: e.startDateTime || e.createdAt || e.startTime,
            startDateTime: e.startDateTime || e.createdAt || e.startTime,
            weight: e.weight,
            height: e.height,
            trackerType: e.trackerType,
          }));
          report.growthSummary = {
            latestWeight: latest.weight,
            latestHeight: latest.height,
            chartData,
          };
        } else if (tracker === 'potty') {
          // Only use entries with a valid date
          const validEntries = entries.filter((e: any) => e.startDateTime || e.createdAt || e.startTime);
          const peeCount = validEntries.filter((e: any) => e.type === 'pee').length;
          const poopCount = validEntries.filter((e: any) => e.type === 'poop').length;
          const chartData = validEntries.map((e: any) => {
            const dateStr = e.startDateTime || e.createdAt || e.startTime;
            return {
              date: dateStr,
              startDateTime: dateStr,
              type: e.type,
              trackerType: e.trackerType,
            };
          });
          report.pottySummary = { peeCount, poopCount, chartData };
        } else if (tracker === 'temperature') {
          // Only use entries with a valid date
          const validEntries = entries.filter((e: any) => e.startDateTime || e.createdAt || e.startTime);
          const readingsCount = validEntries.length;
          const avgTemp = readingsCount
            ? validEntries.reduce((sum: number, e: any) => sum + (e.temperature || 0), 0) / readingsCount
            : 0;
          const chartData = validEntries.map((e: any) => {
            const dateStr = e.startDateTime || e.createdAt || e.startTime;
            return {
              date: dateStr,
              startDateTime: dateStr,
              temperature: e.temperature || 0,
              trackerType: e.trackerType,
            };
          });
          report.temperatureSummary = { readingsCount, avgTemp, chartData };
        }
      }
      return createApiResponse(200, report);
    } else if (normalizedPath === '/notes' && httpMethod === 'GET') {
      const { profileId } = event.queryStringParameters || {};
      if (!profileId) {
        return createApiResponse(400, {
          message: 'Missing required query parameter: profileId',
        });
      }
      const command = new QueryCommand({
        TableName: trackerEntriesTable,
        KeyConditionExpression: 'babyId = :bid',
        ExpressionAttributeValues: {
          ':bid': profileId,
        },
        ScanIndexForward: false,
      });
      const result = await docClient.send(command);
      const notesEntries = (result.Items || [])
        .filter((entry: any) => entry.notes && entry.notes.trim() !== '')
        .map((entry: any) => ({
          id: entry.entryId,
          trackerType: entry.trackerType,
          notes: entry.notes,
          profileId: entry.babyId,
          createdAt: entry.createdAt,
          startDateTime: entry.startDateTime,
          startTime: entry.startTime,
        }));
      notesEntries.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return createApiResponse(200, notesEntries);
    } else if (normalizedPath === '/checklist' && httpMethod === 'GET') {
      // GET all custom checklist items for a user and profile
      // Table schema: partitionKey = userId, sortKey = itemId
      const { profileId } = event.queryStringParameters || {};
      if (!profileId) {
        return createApiResponse(400, { message: 'Missing required query parameter: profileId' });
      }
      // Query for all custom items for this user (itemId starts with 'custom_'), filter by profileId
      const command = new QueryCommand({
        TableName: checklistStatusTable,
        KeyConditionExpression: 'userId = :uid AND begins_with(itemId, :custom)',
        FilterExpression: 'profileId = :pid', // Only non-key attribute in FilterExpression
        ExpressionAttributeValues: {
          ':uid': userId,
          ':custom': 'custom_',
          ':pid': profileId,
        },
      });
      const result = await docClient.send(command);
      const customChecklistItems = (result.Items || []).map((item: any) => ({
        itemId: item.itemId,
        completed: !!item.completed,
        text: item.text,
        week: item.week,
        profileId: item.profileId,
        createdAt: item.createdAt,
        isCustom: true,
      }));
      return createApiResponse(200, customChecklistItems);
    } else if (normalizedPath === '/checklist/status' && httpMethod === 'GET') {
      // GET all checklist item statuses for a user and profile
      const { profileId } = event.queryStringParameters || {};
      if (!profileId) {
        return createApiResponse(400, { message: 'Missing required query parameter: profileId' });
      }
      // Query all checklist items for this user/profile
      const command = new QueryCommand({
        TableName: checklistStatusTable,
        KeyConditionExpression: 'userId = :uid',
        FilterExpression: 'profileId = :pid',
        ExpressionAttributeValues: {
          ':uid': userId,
          ':pid': profileId,
        },
      });
      const result = await docClient.send(command);
      // Return only relevant fields for frontend
      const checklistStatuses = (result.Items || []).map((item: any) => ({
        itemId: item.itemId,
        completed: !!item.completed,
        text: item.text,
        week: item.week,
        profileId: item.profileId,
        createdAt: item.createdAt,
      }));
      return createApiResponse(200, checklistStatuses);
    } else if (normalizedPath === '/checklist' && httpMethod === 'POST') {
      // Add a custom checklist item
      console.log(`ROUTE: POST /checklist for user ${userId}`);
      if (!body || !body.text || typeof body.week !== 'number' || !body.profileId) {
        return createApiResponse(400, {
          message: 'Missing required fields: text, week, profileId',
        });
      }
      const checklistItemId = `custom_${Date.now()}_${randomUUID().substring(0, 8)}`;
      const checklistItem = {
        userId: userId,
        itemId: checklistItemId,
        text: body.text,
        week: body.week,
        profileId: body.profileId,
        completed: !!body.completed,
        createdAt: new Date().toISOString(),
      };
      const command = new PutCommand({
        TableName: checklistStatusTable,
        Item: checklistItem,
      });
      await docClient.send(command);
      return createApiResponse(201, checklistItem);
    } else if (normalizedPath === '/checklist/status/{itemId}' && httpMethod === 'PUT') {
      // Update completion status for a checklist item
      const checklistItemId = pathParameters?.itemId;
      console.log(`ROUTE: PUT /checklist/status/${checklistItemId} for user ${userId}`);
      if (!checklistItemId || body === null || typeof body.completed !== 'boolean') {
        return createApiResponse(400, {
          message: 'Missing itemId or invalid body (expected { completed: boolean })',
        });
      }
      const command = new UpdateCommand({
        TableName: checklistStatusTable,
        Key: { userId: userId, itemId: checklistItemId },
        UpdateExpression: 'set completed = :c, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':c': body.completed,
          ':ua': new Date().toISOString(),
        },
        ReturnValues: 'UPDATED_NEW',
      });
      await docClient.send(command);
      return createApiResponse(200, { success: true });
    } else {
      console.log(`ROUTE: Not Found - ${httpMethod} ${path}`);
      return createApiResponse(404, {
        message: `Not Found: ${httpMethod} ${event.path}`,
      });
    }
  } catch (error: any) {
    console.error('Error processing request:', error);
    return createApiResponse(500, {
      message: 'Internal Server Error',
      error: error.message,
    });
  }
};
