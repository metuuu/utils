import { APIGatewayProxyEvent } from 'aws-lambda'

/**
 * Get Cognito sub from the user that called this lambda function with credentials
 */
function getAuthenticatedUserSub(event: APIGatewayProxyEvent) {
  return event.requestContext?.identity?.cognitoAuthenticationProvider?.split(':')?.slice(-1)?.[0]
}

export default getAuthenticatedUserSub
