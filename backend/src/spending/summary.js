/**
 * Spending - Summary Lambda Function
 * GET /spending/summary
 * Computes monthly totals, category breakdowns for donut chart, MoM trends, and budget tracking
 */

import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { docClient, TABLE_NAME } from '../utils/db.js';
import { getUserId } from '../utils/auth.js';
import { successResponse, errorResponse } from '../utils/response.js';

const getPreviousMonthStr = (yearMonthStr) => {
  const [year, month] = yearMonthStr.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = String(prevDate.getMonth() + 1).padStart(2, '0');
  return `${prevYear}-${prevMonth}`;
};

export const handler = async (event) => {
  console.log('SpendingSummaryFunction invoked with event:', JSON.stringify(event, null, 2));

  try {
    const userId = getUserId(event);
    if (!userId) {
      return errorResponse(401, 'Unauthorized: User identity could not be resolved.');
    }

    const queryParams = event.queryStringParameters || {};
    const today = new Date();
    const currentYearMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    const selectedMonth = queryParams.month || currentYearMonth;
    const previousMonth = getPreviousMonthStr(selectedMonth);

    // Soft monthly budget (default 50,000 INR or customizable via query param)
    const softMonthlyBudget = queryParams.budget ? Number(queryParams.budget) : 50000;

    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `USER#${userId}`,
        ':skPrefix': 'SPEND#',
      },
    });

    const result = await docClient.send(command);
    const allExpenses = result.Items || [];

    // Track available unique months across data
    const monthSet = new Set();
    monthSet.add(currentYearMonth);

    let currentMonthTotal = 0;
    let lastMonthTotal = 0;
    const categoryTotals = {
      food: 0,
      transport: 0,
      bills: 0,
      health: 0,
      entertainment: 0,
      other: 0,
    };
    const categoryCounts = {
      food: 0,
      transport: 0,
      bills: 0,
      health: 0,
      entertainment: 0,
      other: 0,
    };

    const currentMonthExpenses = [];

    allExpenses.forEach((item) => {
      const itemDate = item.date || '';
      const itemMonth = itemDate.slice(0, 7);
      if (itemMonth) {
        monthSet.add(itemMonth);
      }

      if (itemMonth === selectedMonth) {
        currentMonthTotal += item.amount || 0;
        currentMonthExpenses.push(item);
        if (categoryTotals[item.category] !== undefined) {
          categoryTotals[item.category] += item.amount || 0;
          categoryCounts[item.category] += 1;
        } else {
          categoryTotals.other += item.amount || 0;
          categoryCounts.other += 1;
        }
      } else if (itemMonth === previousMonth) {
        lastMonthTotal += item.amount || 0;
      }
    });

    // Format category breakdown for Donut Chart
    const categories = Object.keys(categoryTotals).map((cat) => {
      const amount = Math.round(categoryTotals[cat] * 100) / 100;
      const count = categoryCounts[cat];
      const percentage = currentMonthTotal > 0 ? Math.round((amount / currentMonthTotal) * 1000) / 10 : 0;
      return {
        category: cat,
        amount,
        count,
        percentage,
      };
    });

    // Month-over-month calculation
    const monthOverMonthDiff = Math.round((currentMonthTotal - lastMonthTotal) * 100) / 100;
    let monthOverMonthPctChange = 0;
    if (lastMonthTotal > 0) {
      monthOverMonthPctChange = Math.round(((currentMonthTotal - lastMonthTotal) / lastMonthTotal) * 1000) / 10;
    }

    // Budget tracking
    const budgetRemaining = Math.round((softMonthlyBudget - currentMonthTotal) * 100) / 100;
    const budgetConsumedPercentage = Math.round((currentMonthTotal / softMonthlyBudget) * 100);

    // Sort available months descending
    const availableMonths = Array.from(monthSet).sort().reverse();

    const summary = {
      selectedMonth,
      previousMonth,
      currentMonthTotal: Math.round(currentMonthTotal * 100) / 100,
      lastMonthTotal: Math.round(lastMonthTotal * 100) / 100,
      monthOverMonthDiff,
      monthOverMonthPctChange,
      softMonthlyBudget,
      budgetRemaining,
      budgetConsumedPercentage,
      byCategory: categories,
      availableMonths,
      totalExpensesCount: currentMonthExpenses.length,
    };

    console.log(`Generated spending summary for user ${userId} for month ${selectedMonth}`);
    return successResponse(200, { summary });
  } catch (error) {
    console.error('Error in SpendingSummaryFunction:', error);
    return errorResponse(500, 'Internal Server Error while computing spending summary.', error.message);
  }
};
