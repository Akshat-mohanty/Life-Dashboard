

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const handler = async (event) => {
  console.log('BillsListFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'BILL#',
      },
    });

    const result = await docClient.send(command);
    const rawItems = result.Items || [];

    const todayStr = new Date().toISOString().split('T')[0];
    const threeDaysDate = new Date();
    threeDaysDate.setDate(threeDaysDate.getDate() + 3);
    const threeDaysStr = threeDaysDate.toISOString().split('T')[0];

    let totalUnpaidAmount = 0;
    let totalPaidAmount = 0;
    let totalOverdueAmount = 0;
    let unpaidCount = 0;
    let overdueCount = 0;

    const items = rawItems.map((bill) => {
      let status = 'upcoming';

      if (bill.isPaid) {
        status = 'paid';
        totalPaidAmount += bill.amount || 0;
      } else {
        totalUnpaidAmount += bill.amount || 0;
        unpaidCount += 1;

        if (bill.dueDate < todayStr) {
          status = 'overdue';
          totalOverdueAmount += bill.amount || 0;
          overdueCount += 1;
        } else if (bill.dueDate <= threeDaysStr) {
          status = 'due_soon';
        } else {
          status = 'upcoming';
        }
      }

      return {
        ...bill,
        status, 
      };
    });

    
    const priorityMap = { overdue: 1, due_soon: 2, upcoming: 3, paid: 4 };
    items.sort((a, b) => {
      if (priorityMap[a.status] !== priorityMap[b.status]) {
        return priorityMap[a.status] - priorityMap[b.status];
      }
      return a.dueDate.localeCompare(b.dueDate);
    });

    const summary = {
      totalUnpaidAmount: Math.round(totalUnpaidAmount * 100) / 100,
      totalPaidAmount: Math.round(totalPaidAmount * 100) / 100,
      totalOverdueAmount: Math.round(totalOverdueAmount * 100) / 100,
      unpaidCount,
      overdueCount,
      totalCount: items.length,
    };

    console.log(`Retrieved ${items.length} bills for user ${userId}`);
    return successResponse(200, { items, summary });
  } catch (error) {
    console.error('Error in BillsListFunction:', error);
    return errorResponse(500, 'Internal Server Error while listing bills.', error.message);
  }
};
