/**
 * Returns URL to AWS Log groups from which you can view the logs for the request
 */
function getLambdaLogStreamUrl(props: { logGroup: string; logStream: string }) {
  const { logGroup, logStream } = props

  // https://stackoverflow.com/questions/60796991/is-there-a-way-to-generate-the-aws-console-urls-for-cloudwatch-log-group-filters
  const convertValueForUrl = (input: string) => {
    const replaceToUrl: [RegExp, string][] = [
      [/\//g, '$252F'],
      [/\[/g, '$255B'],
      [/\]/g, '$255D'],
      [/_/g, '$252F'],
    ]
    return replaceToUrl.reduce(
      (value, [pattern, replacement]) => value.replace(pattern, replacement),
      input,
    )
  }

  return `https://${process.env.AWS_REGION}.console.aws.amazon.com/cloudwatch/home?region=${
    process.env.AWS_REGION
  }#logsV2:log-groups/log-group/${convertValueForUrl(logGroup)}/log-events/${convertValueForUrl(
    logStream,
  )}`
}

export default getLambdaLogStreamUrl
