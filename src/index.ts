import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  APIGatewayProxyResult,
  APIGatewayProxyResultV2,
  Context,
} from 'aws-lambda'
import type { App } from 'h3'
import { toPlainHandler } from 'h3'
import { withQuery } from 'ufo'

import { normalizeCookieHeader } from './utils'
import {
  normalizeLambdaIncomingHeaders,
  normalizeLambdaOutgoingBody,
  normalizeLambdaOutgoingHeaders,
} from './utils.lambda'

export function toAWSLambdaHandler(app: App) {
  return async (e: Parameters<typeof handler>[1], context?: Context) => {
    return handler(app, e, context)
  }
}

async function handler(
  app: App,
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult>
async function handler(
  app: App,
  event: APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResultV2>
async function handler(
  app: App,
  event: APIGatewayProxyEvent | APIGatewayProxyEventV2,
  context: Context,
): Promise<APIGatewayProxyResult | APIGatewayProxyResultV2> {
  const query = {
    ...event.queryStringParameters,
    ...(event as APIGatewayProxyEvent).multiValueQueryStringParameters,
  }
  const url = withQuery(
    (event as APIGatewayProxyEvent).path || (event as APIGatewayProxyEventV2).rawPath,
    query,
  )
  const method =
    (event as APIGatewayProxyEvent).httpMethod ||
    (event as APIGatewayProxyEventV2).requestContext?.http?.method ||
    'get'

  if ('cookies' in event && event.cookies) {
    event.headers.cookie = event.cookies.join(';')
  }

  const headers = normalizeLambdaIncomingHeaders(event.headers)

  const plainHandler = toPlainHandler(app)

  const response = await plainHandler({
    method,
    path: url,
    headers: new Headers(headers),
    body: event.isBase64Encoded
      ? Buffer.from(event.body || '', 'base64').toString('utf8')
      : event.body,
  })

  // ApiGateway v2 https://docs.aws.amazon.com/apigateway/latest/developerguide/http-api-develop-integrations-lambda.html#http-api-develop-integrations-lambda.v2
  const isApiGwV2 = 'cookies' in event || 'rawPath' in event
  const preparedResponseHeaders = Object.fromEntries(response.headers)
  const awsBody = await normalizeLambdaOutgoingBody(
    response.body as BodyInit,
    preparedResponseHeaders,
  )
  const awsHeaders = normalizeLambdaOutgoingHeaders(preparedResponseHeaders, isApiGwV2)
  const cookies = normalizeCookieHeader(response.headers['set-cookie'])
  return {
    ...(cookies.length > 0 && {
      ...(isApiGwV2 ? { cookies } : { multiValueHeaders: { 'set-cookie': cookies } }),
    }),
    statusCode: response.status,
    body: awsBody.body,
    headers: awsHeaders,
    isBase64Encoded: awsBody.type === 'binary',
  }
}
