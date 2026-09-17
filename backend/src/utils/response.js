/**
 * Standardized HTTP API Gateway Response Helpers
 */

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export const successResponse = (statusCode = 200, data = {}) => ({
  statusCode,
  headers: CORS_HEADERS,
  body: JSON.stringify(data),
});

export const errorResponse = (statusCode = 500, message = 'Internal Server Error', details = null) => {
  const payload = {
    error: {
      message,
      statusCode,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
    },
  };
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(payload),
  };
};
