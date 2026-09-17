/**
 * User Identity & Cognito Authorizer Claims Extraction
 */

export const getUserId = (event) => {
  // 1. Production Cognito Authorizer Claims
  const claims = event?.requestContext?.authorizer?.claims;
  if (claims) {
    return claims.sub || claims['cognito:username'] || claims.username;
  }

  // 2. Custom Authorizer context (e.g., Lambda Authorizer)
  if (event?.requestContext?.authorizer?.userId) {
    return event.requestContext.authorizer.userId;
  }

  // 3. Fallback Header (useful during SAM local or integration tests)
  const headerUserId = event?.headers?.['x-user-id'] || event?.headers?.['X-User-Id'];
  if (headerUserId) {
    return headerUserId;
  }

  // 4. Query string override for local testing if explicitly provided
  if (event?.queryStringParameters?.userId && process.env.ENVIRONMENT === 'dev') {
    return event.queryStringParameters.userId;
  }

  // 5. Default local dev fallback
  if (process.env.DEFAULT_TEST_USER_ID) {
    return process.env.DEFAULT_TEST_USER_ID;
  }

  // Default demo user ID
  return 'demo-user-1';
};
