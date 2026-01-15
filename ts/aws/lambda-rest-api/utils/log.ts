import getAuthenticatedUserSub from "./getAuthenticatedUserSub";
import getLambdaLogStreamUrl from "./getLambdaLogStreamUrl";
import getLambdaLogsInsightsUrl from "./getLambdaLogsInsightsUrl";
import { APIGatewayProxyEvent, Context } from "aws-lambda";
import { LambdaLog } from "lambda-log";
// import postingManager from './postingManager'

let dynamicErrorMetadata = {};

const log = new LambdaLog({
  debug: process.env.ENV === "develop",
  dynamicMeta: (message) => {
    if (message.level === "error") return dynamicErrorMetadata;
  },
});

export default log as LambdaLog & {
  addDynamicErrorMetadata: typeof addDynamicErrorMetadata;
  clearDynamicErrorMetadata: typeof clearDynamicErrorMetadata;
};

/**
 * Added metadata will be included only in error logs
 */
function addDynamicErrorMetadata(metadata: object) {
  dynamicErrorMetadata = {
    ...dynamicErrorMetadata,
    ...metadata,
  };
}
log.addDynamicErrorMetadata = addDynamicErrorMetadata;

function clearDynamicErrorMetadata() {
  dynamicErrorMetadata = {};
}
log.clearDynamicErrorMetadata = clearDynamicErrorMetadata;

/**
 * Initialize lambda logger
 *
 * @param {import('express').Request} req
 */
function initializeLogging(event: APIGatewayProxyEvent, context: Context) {
  // Clear log configuration at start so no data is left from previous lambda invocation to the log instance
  log.options.meta = {};
  log.clearDynamicErrorMetadata();
  // // Clear additional slack and teams post debug fields at start so no fields are left from previous lambda invocation
  // postingManager.clearAdditionalDebugFields()

  const xRayTraceId = process.env._X_AMZN_TRACE_ID?.split(";").reduce(
    (prev, current) => ({
      ...prev,
      [current.split("=")[0]]: current.split("=")[1],
    }),
    {} as Record<string, string>
  )?.["Root"];
  // const xRayTraceUrl = `https://${process.env.AWS_REGION}.console.aws.amazon.com/xray/home?region=${process.env.AWS_REGION}#/traces/${xRayTraceId}`;

  const userId = getAuthenticatedUserSub(event);

  log.options.meta = {
    requestContext: {
      awsRequestId: context.awsRequestId,
      requestId: event.requestContext.requestId,
      xRayTraceId,
      httpMethod: event.requestContext.httpMethod,
      path: event.requestContext.path,
      resourcePath: event.requestContext.resourcePath,
      identity: {
        userId,
        caller: event.requestContext.identity.caller,
        userAgent: event.requestContext.identity.userAgent,
      },
    },
    context: {
      env: process.env.ENV,
    },
  };

  // // Add additional debug fields that will be added to Slack post invocation to this new lambda invocation
  // postingManager.addAdditionalDebugFields({
  //   method: { value: event.requestContext.httpMethod, short: true },
  //   path: { value: event.requestContext.path, short: true },
  //   ...(!!userId && { userId }),
  //   ...(!!event.requestContext.identity.userAgent && {
  //     userAgent: event.requestContext.identity.userAgent,
  //   }),
  //   awsRequestId: context.awsRequestId,
  //   requestId: event.requestContext.requestId,
  //   xRayTraceId: `<${xRayTraceUrl}|${xRayTraceId}>`,
  // });

  // // Log stream and log insights links are added to Slack alert from which you can view the logs for the failed request
  // // Note that it takes some time before logs show up in the Logs Insights
  // const logsInsightsUrl = getLambdaLogsInsightsUrl({
  //   logGroup: context.logGroupName,
  //   requestId: context.awsRequestId,
  //   timestamp: Date.now(),
  // });
  // const logStreamUrl = getLambdaLogStreamUrl({
  //   logGroup: context.logGroupName,
  //   logStream: context.logStreamName,
  // });
  // postingManager.addAdditionalDebugFields({
  //   awsLogStream: `<${logStreamUrl}|${context.logStreamName}>`, // Link to request specific AWS Log stream
  //   awsLogsInsights: `<${logsInsightsUrl}|AWS Logs Insights>`, // Link to AWS Logs Insights with filtering
  // });
}

export { initializeLogging };
