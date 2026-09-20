import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const REGION = 'ap-southeast-2';
const docClient = DynamoDBDocumentClient.from(new DynamoDBClient({ region: REGION }));

async function run() {
  const userId = '794e2438-50a1-705c-c248-37994f8d2d28';
  const TABLE_NAME = 'LifeDashboard';
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const queryCommand = new QueryCommand({
    TableName: TABLE_NAME,
    KeyConditionExpression: 'PK = :pk',
    ExpressionAttributeValues: { ':pk': `USER#${userId}` },
  });

  const queryResult = await docClient.send(queryCommand);
  const items = queryResult.Items || [];

  const incompleteTasks = items
    .filter((it) => it.SK.startsWith('TASK#') && !it.isCompleted)
    .filter((it) => !it.dueDate || it.dueDate <= todayStr)
    .map((it) => ({
      title: it.title,
      dueDate: it.dueDate,
      priority: it.priority,
    }));

  console.log('Total items:', items.length);
  console.log('Incomplete tasks:', incompleteTasks.length);
  
  const unpaidBills = items.filter((it) => it.SK.startsWith('BILL#') && !it.isPaid);
  console.log('Unpaid bills:', unpaidBills.length);
}
run();
