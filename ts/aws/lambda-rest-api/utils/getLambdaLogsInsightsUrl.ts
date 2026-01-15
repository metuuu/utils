/**
 * Returns URL to AWS Logs Insights from which you can view the logs for the request
 * Note that it takes some time before logs show up in the Logs Insights.
 */
function getLambdaLogsInsightsUrl(props: {
  logGroup: string
  timestamp: Date | number | string
  requestId?: string
}) {
  const { logGroup, timestamp, requestId } = props

  // Log insights url has encoding where special characters are converted to hex values
  const convertValueForUrl = (input: string) => {
    const replaceToUrl: [RegExp, string][] = [
      [/:/g, '*3a'],
      [/ /g, '*20'],
      [/@/g, '*40'],
      [/,/g, '*2c'],
      [/\|/g, '*7c'],
      [/=/g, '*3d'],
      [/"/g, '*22'],
      [/\//g, '*2f'],
      [/\n/g, '*0d'],
    ]
    return replaceToUrl.reduce(
      (value, [pattern, replacement]) => value.replace(pattern, replacement),
      input,
    )
  }

  const fromDate = new Date(new Date(timestamp).getTime() - 30000).toISOString()
  const toDate = new Date(new Date(timestamp).getTime() + 30000).toISOString()

  let filterPattern = 'fields @timestamp, @message, @logStream | sort @timestamp asc'
  if (requestId) filterPattern += ` | filter @requestId="${requestId}"`

  const logsInsightsUrl = `https://${
    process.env.AWS_REGION
  }.console.aws.amazon.com/cloudwatch/home?region=${
    process.env.AWS_REGION
  }#logsV2:logs-insights$3FqueryDetail$3D$257E$2528end$257E$2527${convertValueForUrl(
    toDate,
  )}$257Estart$257E$2527${convertValueForUrl(
    fromDate,
  )}$257EtimeType$257E$2527ABSOLUTE$257Etz$257E$2527Local$257EeditorString$257E$2527${convertValueForUrl(
    filterPattern,
  )}$257Esource$257E$2528$257E$2527${convertValueForUrl(logGroup)}$2529$2529`

  return logsInsightsUrl
}

export default getLambdaLogsInsightsUrl
