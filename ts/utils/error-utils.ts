import { getReasonPhrase } from 'http-status-codes'

export const errorToMessage = (error: any) => {
  if (!error) return ''
  if (typeof error === 'string') return error

  // Axios error
  if (error.isAxiosError) {
    if (!error.response) return error.message
    if (error.response.data) {
      if (error.response.data.detail) return error.response.data.detail
      if (error.response.data.title) return error.response.data.title
    }
    return `${error.response.status} ${getReasonPhrase(error.response.status)}`
  }

  return error.message
}

export const parseError = (error: any): { title?: string, message?: string } => {
  if (!error) return {}
  if (typeof error === 'string') return { title: error }

  // Axios error
  if (error.isAxiosError) {
    if (!error.response) return { message: error.message }
    if (error.response.data) return { title: error.response.data.title, message: error.response.data.detail }
    return { title: `${error.response.status} ${getReasonPhrase(error.response.status)}` }
  }

  return { message: error.message }
}

export const isNetworkError = (error: any) => {
  if (error instanceof Error) return error.message.toLowerCase() === 'network error'
  return false
}

export const isApiClientError = (error: any) => {
  if (error.isAxiosError && error.response) return error.response.status.toString()[0] === '4'
  return false
}

export const isApiServerError = (error: any) => {
  if (error.isAxiosError && error.response) return error.response.status.toString()[0] === '5'
  return false
}

export const isApiError = (error: any, statusCode?: number) => {
  if (error?.isAxiosError && error?.response) {
    if (statusCode) return error.response.status === statusCode
    return true
  }
  return false
}

export const isRetryableApiError = (error: any) => {
  const statusesToRetry: number[] = [
    408, // Request Timeout
    425, // Too Early
    429, // Too Many Requests
    500, // Internal Server Error
    502, // Bad Gateway
    503, // Service Unavailable
    504, // Gateway Timeout
  ]
  return statusesToRetry.some((status) => isApiError(error, status))
}
