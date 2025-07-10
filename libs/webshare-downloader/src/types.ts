export type SuccessResponse<T> = {
  status: ['OK']
} & T

export interface ErrorResponse {
  status: ['FATAL']
  code: [string]
  message: [string]
}

export interface ApiResponse<T> {
  response: SuccessResponse<T> | ErrorResponse
}

export interface Credentials {
  username: string
  password: string
}
