export class RedisConfigurationError extends Error {
  code = 'REDIS_URL_MISSING'

  constructor(message = 'REDIS_URL is required before OneDrive auth tokens can be read or stored.') {
    super(message)
    this.name = 'RedisConfigurationError'
  }
}
