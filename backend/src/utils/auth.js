

export const getUserId = (event) => {
  
  const claims = event?.requestContext?.authorizer?.claims;
  if (claims) {
    return claims.sub || claims['cognito:username'] || claims.username;
  }

  
  if (event?.requestContext?.authorizer?.userId) {
    return event.requestContext.authorizer.userId;
  }

  
  const headerUserId = event?.headers?.['x-user-id'] || event?.headers?.['X-User-Id'];
  if (headerUserId) {
    return headerUserId;
  }

  
  if (event?.queryStringParameters?.userId && process.env.ENVIRONMENT === 'dev') {
    return event.queryStringParameters.userId;
  }

  
  if (process.env.DEFAULT_TEST_USER_ID) {
    return process.env.DEFAULT_TEST_USER_ID;
  }

  
  return 'demo-user-1';
};
