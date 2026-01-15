import { getCurrentInvoke } from '@codegenie/serverless-express'
import { APIGatewayProxyEvent } from 'aws-lambda'

const getRequestEvent = () => {
  const { event } = getCurrentInvoke()
  return event as APIGatewayProxyEvent
}

export default getRequestEvent
