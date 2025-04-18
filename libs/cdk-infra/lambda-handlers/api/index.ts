import {
  Handler,
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
} from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { randomUUID } from 'crypto'; // For generating unique IDs

const dbClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dbClient);

// Get table names from environment variables set by CDK
const babiesTable = process.env.BABIES_TABLE_NAME;
const trackerEntriesTable = process.env.TRACKER_ENTRIES_TABLE_NAME;
const checklistStatusTable = process.env.CHECKLIST_STATUS_TABLE_NAME;

// --- Sanity Check: Log environment variables on cold start ---
console.log('ENV VAR - babiesTable:', babiesTable);
console.log('ENV VAR - trackerEntriesTable:', trackerEntriesTable);
console.log('ENV VAR - checklistStatusTable:', checklistStatusTable);
// --- End Sanity Check ---


// Helper function to create standard API responses
const createApiResponse = (
  statusCode: number,
  body: any
): APIGatewayProxyResult => {
  return {
    statusCode: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // TODO: Restrict in production
      'Access-Control-Allow-Headers':
        'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT,DELETE',
    },
    body: JSON.stringify(body),
  };
};

export const handler: Handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return createApiResponse(200, {});
  }
  console.log('EVENT:', JSON.stringify(event, null, 2));

  const httpMethod = event.httpMethod;
  const path = event.resource || event.path; // Use resource path defined in API Gateway
  const pathParameters = event.pathParameters;
  const body = event.body ? JSON.parse(event.body) : null;

  // Extract user ID (sub) from Cognito authorizer context
  // This relies on the Cognito authorizer being correctly configured in API Gateway
  const userId = event.requestContext.authorizer?.claims?.sub;

  if (!userId) {
    console.error('User ID not found in authorizer claims.');
    return createApiResponse(401, {
      message: 'Unauthorized: User identifier missing.',
    });
  }

  console.log(`Authenticated User ID (sub): ${userId}`);

  // --- Check if table names are loaded ---
  if (!babiesTable || !trackerEntriesTable || !checklistStatusTable) {
      console.error('CRITICAL: One or more DynamoDB table names are missing from environment variables!');
      return createApiResponse(500, { message: 'Internal Server Error: Configuration missing.' });
  }
  // --- End Check ---


  try {
    // --- Profile Routes (Using BabiesTable) ---
    if (path === '/profiles' && httpMethod === 'GET') {
      console.log(`ROUTE: GET /profiles for user ${userId}`);
      const command = new QueryCommand({
        TableName: babiesTable,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      });
      const result = await docClient.send(command);
      // Map DynamoDB items to the frontend BabyProfile structure
      const profiles = (result.Items || []).map(item => ({
          id: item.babyId, // Map babyId to id
          name: item.name,
          birthday: item.birthday,
          // Include other fields if the frontend interface expects them later
      }));
      console.log(`Returning ${profiles.length} mapped profiles.`);
      return createApiResponse(200, profiles); // Return the mapped array
    } else if (path === '/profiles' && httpMethod === 'POST') {
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
        birthday: body.birthday, // Assuming this holds due date or actual birthday
        createdAt: new Date().toISOString(),
      };
      const command = new PutCommand({
        TableName: babiesTable,
        Item: newItem,
      });
      await docClient.send(command);
      // Return the created item (adjust based on BabyProfile interface)
      return createApiResponse(201, {
        id: babyId,
        name: newItem.name,
        birthday: newItem.birthday,
      });
    } else if (path === '/profiles/{profileId}' && httpMethod === 'PUT') {
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
        ExpressionAttributeNames: { '#nm': 'name' }, // 'name' is a reserved word
        ExpressionAttributeValues: {
          ':n': body.name,
          ':b': body.birthday,
          ':ua': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW', // Return the updated item
      });
      const result = await docClient.send(command);
      // Return the updated item (adjust based on BabyProfile interface)
      return createApiResponse(200, { id: profileId, ...result.Attributes });
    } else if (path === '/profiles/{profileId}' && httpMethod === 'DELETE') {
      const profileId = pathParameters?.profileId;
      console.log(`ROUTE: DELETE /profiles/${profileId} for user ${userId}`);
      if (!profileId) {
        return createApiResponse(400, { message: 'Missing profileId' });
      }
      const command = new DeleteCommand({
        TableName: babiesTable,
        Key: { userId: userId, babyId: profileId },
      });
      await docClient.send(command);
      return createApiResponse(200, {
        message: `Profile ${profileId} deleted successfully`,
      });
    }

    // --- Tracker Routes ---
    else if (
      path === '/profiles/{profileId}/trackers/{trackerType}' &&
      httpMethod === 'GET'
    ) {
      const babyId = pathParameters?.profileId;
      const trackerType = pathParameters?.trackerType; // e.g., 'nursing', 'bottle'
      console.log(`ROUTE: GET /profiles/${babyId}/trackers/${trackerType}`);
      if (!babyId || !trackerType) {
        return createApiResponse(400, {
          message: 'Missing profileId or trackerType',
        });
      }

      // --- Verify Ownership ---
      try {
        const getProfileCommand = new GetCommand({
          TableName: babiesTable,
          Key: { userId: userId, babyId: babyId },
        });
        const profileResult = await docClient.send(getProfileCommand);
        if (!profileResult.Item) {
          console.warn(`User ${userId} does not own profile ${babyId} or it does not exist.`);
          return createApiResponse(404, { message: 'Profile not found or access denied.' });
        }
         console.log(`User ${userId} verified ownership of profile ${babyId}.`);
      } catch (verifyError: any) {
         console.error(`Error verifying profile ownership for ${babyId}:`, verifyError);
         return createApiResponse(500, { message: 'Internal Server Error during ownership verification.' });
      }
      // --- End Ownership Verification ---

      // Now proceed with querying tracker entries for the verified babyId
      const command = new QueryCommand({
        TableName: trackerEntriesTable,
        KeyConditionExpression: 'babyId = :bid',
        FilterExpression: 'trackerType = :tt',
        ExpressionAttributeValues: {
          ':bid': babyId,
          ':tt': trackerType
        },
        ScanIndexForward: false, // Sort by entryId (timestamp based) descending
      });
      const result = await docClient.send(command);
      return createApiResponse(200, result.Items || []);
    } else if (
      path === '/profiles/{profileId}/trackers/{trackerType}' &&
      httpMethod === 'POST'
    ) {
      const babyId = pathParameters?.profileId;
      const trackerType = pathParameters?.trackerType;
      console.log(`ROUTE: POST /profiles/${babyId}/trackers/${trackerType}`);
      if (!babyId || !trackerType || !body) {
        return createApiResponse(400, {
          message: 'Missing profileId, trackerType, or request body',
        });
      }
      // TODO: Verify user owns this babyId
      const entryId = `${trackerType}_${Date.now()}_${randomUUID().substring(
        0,
        8
      )}`; // Example entry ID
      const newItem = {
        babyId: babyId,
        entryId: entryId,
        trackerType: trackerType, // Store the type if using one table
        ...body, // Spread the data from the request body
        createdAt: new Date().toISOString(),
      };
      const command = new PutCommand({
        TableName: trackerEntriesTable,
        Item: newItem,
      });
      await docClient.send(command);
      return createApiResponse(201, newItem); // Return the created entry
    } else if (
      path === '/profiles/{profileId}/trackers/{trackerType}/{entryId}' &&
      httpMethod === 'DELETE'
    ) {
      const babyId = pathParameters?.profileId;
      const trackerType = pathParameters?.trackerType;
      const entryId = pathParameters?.entryId;
      console.log(`ROUTE: DELETE /profiles/${babyId}/trackers/${trackerType}/${entryId}`);

      if (!babyId || !trackerType || !entryId) {
        return createApiResponse(400, { message: 'Missing parameters' });
      }

      // --- Verify Ownership (same as GET) ---
      try {
        const getProfileCommand = new GetCommand({
          TableName: babiesTable,
          Key: { userId: userId, babyId: babyId },
        });
        const profileResult = await docClient.send(getProfileCommand);
        if (!profileResult.Item) {
          console.warn(`User ${userId} does not own profile ${babyId} or it does not exist.`);
          return createApiResponse(404, { message: 'Profile not found or access denied.' });
        }
        console.log(`User ${userId} verified ownership of profile ${babyId}.`);
      } catch (verifyError: any) {
        console.error(`Error verifying profile ownership for ${babyId}:`, verifyError);
        return createApiResponse(500, { message: 'Internal Server Error during ownership verification.' });
      }
      // --- End Ownership Verification ---

      const command = new DeleteCommand({
        TableName: trackerEntriesTable,
        Key: { babyId: babyId, entryId: entryId },
      });
      await docClient.send(command);
      return createApiResponse(200, { message: 'Tracker entry deleted' });
    }

    // --- Reports Route ---
    else if (path === '/reports' && httpMethod === 'GET') {
      // GET /reports?profileId=...&trackers=...&timeRange=...
      const { profileId, trackers, timeRange } = event.queryStringParameters || {};
      if (!profileId || !trackers || !timeRange) {
        return createApiResponse(400, { message: 'Missing required query parameters: profileId, trackers, timeRange' });
      }
      // Parse trackers as array
      const trackersArr = trackers.split(',').map((t: string) => t.trim()).filter(Boolean);

      // Determine time window
      let fromDate: Date;
      const now = new Date();
      if (timeRange === 'last24hours') {
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      } else if (timeRange === 'last7days') {
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (timeRange === 'last30days') {
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      } else {
        // Default to last 7 days
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }

      // Query all entries for this profileId (babyId) in time window
      const command = new QueryCommand({
        TableName: trackerEntriesTable,
        KeyConditionExpression: 'babyId = :bid',
        ExpressionAttributeValues: {
          ':bid': profileId,
        },
        ScanIndexForward: false, // newest first
      });
      const result = await docClient.send(command);
      const allEntries = (result.Items || []).filter((entry: any) => {
        // Filter by trackerType and time
        if (!trackersArr.includes(entry.trackerType)) return false;
        // Accept either time or startTime
        const entryDateStr = entry.time || entry.startTime;
        if (!entryDateStr) return false;
        const entryTime = new Date(entryDateStr);
        return entryTime >= fromDate && entryTime <= now;
      });

      // Aggregate data by trackerType
      const report: any = {};
      for (const tracker of trackersArr) {
        const entries = allEntries.filter((e: any) => e.trackerType === tracker);
        if (tracker === 'sleep') {
  const totalHours = entries.reduce((sum: number, e: any) => sum + (e.durationHours || 0), 0);
  const avgDuration = entries.length ? totalHours / entries.length : 0;
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.startTime || e.time, hours: e.durationHours || 0 }));
  report.sleepSummary = { totalHours, avgDuration, chartData };
} else if (tracker === 'nursing') {
  // Nursing entries may have durationLeft and durationRight
  let chartData: Array<{ date: string, side: string, duration: number, volume: number | null }> = [];
  let allDurations: number[] = [];

  entries.forEach((e: any) => {
    if (e.durationLeft && e.durationLeft > 0) {
      chartData.push({
        date: e.startTime,
        startDateTime: e.startTime,
        side: 'left',
        duration: e.durationLeft,
        volume: 0
      });
      allDurations.push(e.durationLeft);
    }
    if (e.durationRight && e.durationRight > 0) {
      chartData.push({
        date: e.startTime,
        startDateTime: e.startTime,
        side: 'right',
        duration: e.durationRight,
        volume: 0
      });
      allDurations.push(e.durationRight);
    }
  });

  const totalSessions = allDurations.length;
  const avgDuration = totalSessions ? (allDurations.reduce((sum, d) => sum + d, 0) / totalSessions) : 0;
  const avgVolume = 0; // No volume data in current nursing entries
  report.nursingSummary = { totalSessions, avgDuration, avgVolume, chartData };

} else if (tracker === 'bottle') {
  const totalBottles = entries.length;
  const avgVolume = entries.length ? (entries.reduce((sum: number, e: any) => sum + (e.volume || 0), 0) / entries.length) : 0;
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, volume: e.volume || 0 }));
  report.bottleSummary = { totalBottles, avgVolume, chartData };
} else if (tracker === 'diaper') {
  const wetCount = entries.filter((e: any) => e.type === 'wet').length;
  const dirtyCount = entries.filter((e: any) => e.type === 'dirty').length;
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, type: e.type }));
  report.diaperSummary = { wetCount, dirtyCount, chartData };
} else if (tracker === 'solids') {
  const totalFeedings = entries.length;
  const avgAmount = entries.length ? (entries.reduce((sum: number, e: any) => sum + (e.amount || 0), 0) / entries.length) : 0;
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, amount: e.amount || 0 }));
  report.solidsSummary = { totalFeedings, avgAmount, chartData };
} else if (tracker === 'medicine') {
  const totalDoses = entries.length;
  const medicinesGiven = Array.from(new Set(entries.map((e: any) => e.medicineName).filter(Boolean)));
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, medicineName: e.medicineName || '' }));
  report.medicineSummary = { totalDoses, medicinesGiven, chartData };
} else if (tracker === 'growth') {
  // Only latest entry matters
  const sorted = entries.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
  const latest = sorted[0] || {};
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, weight: e.weight, height: e.height }));
  report.growthSummary = { latestWeight: latest.weight, latestHeight: latest.height, chartData };
} else if (tracker === 'potty') {
  const peeCount = entries.filter((e: any) => e.type === 'pee').length;
  const poopCount = entries.filter((e: any) => e.type === 'poop').length;
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, type: e.type }));
  report.pottySummary = { peeCount, poopCount, chartData };
} else if (tracker === 'temperature') {
  const readingsCount = entries.length;
  const avgTemp = entries.length ? (entries.reduce((sum: number, e: any) => sum + (e.temperature || 0), 0) / entries.length) : 0;
  const chartData = entries.map((e: any) => ({ date: e.time, startDateTime: e.time, temperature: e.temperature || 0 }));
  report.temperatureSummary = { readingsCount, avgTemp, chartData };
}

      }
      return createApiResponse(200, report);
    }
    else if (path === '/reports' && httpMethod === 'OPTIONS') {
      // CORS preflight handler for /reports
      return createApiResponse(200, {});
    }
    // --- Notes Route ---
    else if (path === '/notes' && httpMethod === 'GET') {
      // GET /notes?profileId=...
      const { profileId } = event.queryStringParameters || {};
      if (!profileId) {
        return createApiResponse(400, { message: 'Missing required query parameter: profileId' });
      }
      // Query all tracker entries for this babyId (profileId)
      const command = new QueryCommand({
        TableName: trackerEntriesTable,
        KeyConditionExpression: 'babyId = :bid',
        ExpressionAttributeValues: {
          ':bid': profileId,
        },
        ScanIndexForward: false, // newest first
      });
      const result = await docClient.send(command);
      // Only keep entries that have a non-empty notes field
      // Always include 'time' in the response. If missing, set to null to avoid 'Invalid Date' in UI.
      const notesEntries = (result.Items || [])
        .filter((entry: any) => entry.notes && entry.notes.trim() !== '')
        .map((entry: any) => ({
          id: entry.entryId,
          trackerType: entry.trackerType,
          time: entry.time !== undefined ? entry.time : null,
          notes: entry.notes,
          profileId: entry.babyId,
        }));
      // Sort by time descending
      notesEntries.sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime());
      return createApiResponse(200, notesEntries);
    }
    else if (path === '/notes' && httpMethod === 'OPTIONS') {
      // CORS preflight handler for /notes
      return createApiResponse(200, {});
    }
    // --- Checklist Routes ---
    else if (path === '/checklist' && httpMethod === 'GET') {
      // Fetch ONLY the user's checklist items (custom + completion)
      const command = new QueryCommand({
        TableName: checklistStatusTable,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      });
      const result = await docClient.send(command);
      const userChecklist = result.Items || [];
      return createApiResponse(200, userChecklist);
    }
    else if (path === '/checklist' && httpMethod === 'POST') {
      // Create a new custom checklist item for the user
      console.log(`ROUTE: POST /checklist for user ${userId}`);
      if (!body || !body.text || typeof body.week !== 'number' || !body.profileId) {
        return createApiResponse(400, {
          message: 'Missing required fields: text, week, profileId',
        });
      }
      // Generate a unique itemId for the custom item
      const itemId = `custom_${Date.now()}_${randomUUID().substring(0, 8)}`;
      const newItem = {
        userId: userId,
        itemId: itemId,
        text: body.text,
        week: body.week,
        profileId: body.profileId,
        completed: !!body.completed, // Default to false if not provided
        createdAt: new Date().toISOString(),
      };
      const command = new PutCommand({
        TableName: checklistStatusTable,
        Item: newItem,
      });
      await docClient.send(command);
      return createApiResponse(201, newItem);
    }
    else if (path === '/checklist' && httpMethod === 'OPTIONS') {
      // CORS preflight handler for /checklist
      return createApiResponse(200, {});
    }
    else if (path === '/checklist/status' && httpMethod === 'GET') {
      console.log(`ROUTE: GET /checklist/status for user ${userId}`);
      const command = new QueryCommand({
        TableName: checklistStatusTable,
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
      });
      const result = await docClient.send(command);
      // Map result to expected frontend format if needed
      const statuses = (result.Items || []).map((item) => ({
        itemId: item.itemId,
        completed: item.completed,
      }));
      return createApiResponse(200, statuses);
    } else if (path === '/checklist/status/{itemId}' && httpMethod === 'PUT') {
      const itemId = pathParameters?.itemId;
      console.log(`ROUTE: PUT /checklist/status/${itemId} for user ${userId}`);
      if (!itemId || body === null || typeof body.completed !== 'boolean') {
        return createApiResponse(400, {
          message:
            'Missing itemId or invalid body (expected { completed: boolean })',
        });
      }
      const command = new UpdateCommand({
        TableName: checklistStatusTable,
        Key: { userId: userId, itemId: itemId },
        UpdateExpression: 'set completed = :c, updatedAt = :ua',
        ExpressionAttributeValues: {
          ':c': body.completed,
          ':ua': new Date().toISOString(),
        },
        ReturnValues: 'UPDATED_NEW',
      });
      await docClient.send(command);
      return createApiResponse(200, { success: true });
    }

    // --- Default Not Found ---
    else {
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
