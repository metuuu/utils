import { SSM } from '@aws-sdk/client-ssm'

const ssm = new SSM()

export default class SecretsManager<T extends Record<string, string>> {
  secrets: T
  secretValues: { [key in keyof typeof this.secrets]?: string } = {}

  /**
   * @param secrets
   * Parameter version can be configured to the end of the name separated by colon. <name:version>\
   * If version is not defined latest version is fetched\
   * Example: const secretsToLoad = { TEST_SECRET: 'TEST_SECRET:3' }
   */
  constructor(secrets: T) {
    this.secrets = secrets
  }

  async preloadSecrets(options?: { ignoreCache: boolean }) {
    // console.info('Preloading secrets')

    // Check if secrets have already been loaded
    if (
      !options?.ignoreCache &&
      !Object.values(this.secrets).find((key) => this.secretValues[key as keyof T] === undefined)
    ) {
      // console.info('All secrets already exist in cache')
      return
    }

    const secrets = await SecretsManager.loadSecrets(Object.values(this.secrets))
    Object.entries(secrets).map(([key, val]) => (this.secretValues[key as keyof T] = val as any))

    // console.info('Secrets were preloaded')
  }

  getSecret(secret: keyof typeof this.secrets) {
    if (this.secretValues[secret] === undefined)
      throw new Error(`Secret "${secret.toString()}" doesn't exist or secrets aren't loaded yet.`)
    return this.secretValues[secret]
  }

  async loadSecret(secret: keyof typeof this.secrets) {
    // Load the secret if it hasn't been loaded yet
    if (this.secretValues[secret] === undefined) {
      const secrets = await SecretsManager.loadSecrets([secret as string])
      this.secretValues[secret] = secrets[secret as string]
    }
    return this.secretValues[secret]
  }

  // STATIC
  static async loadSecrets<T extends string>(secretsToLoad: T[]) {
    const secrets: { [key in (typeof secretsToLoad)[number]]?: string | undefined } = {}

    const { Parameters: params } = await ssm.getParameters({
      Names: secretsToLoad.map((secretName) => process.env[secretName]!),
      WithDecryption: true,
    })

    params!.forEach(({ Name: name, Value: value }) => {
      for (const secret of secretsToLoad) {
        if (name === process.env[secret]) {
          secrets[secret] = value
          break
        }
      }
    })

    return secrets
  }
}
