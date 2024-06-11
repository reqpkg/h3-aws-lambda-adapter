import { createApp, createRouter, defineEventHandler } from 'h3'

import { toAWSLambdaHandler } from '../../src/index'

const TEST_PATH = '/test'
const testHandler = defineEventHandler(() => {
  return {
    data: {
      result: 'ok',
    },
  }
})

describe('aws lambda handler', () => {
  let response = null

  beforeAll(async () => {
    const app = createApp()
    const router = createRouter().post(TEST_PATH, testHandler)
    app.use(router)
    const handler = toAWSLambdaHandler(app)

    const event = {
      version: '2.0',
      routeKey: '$default',
      rawPath: TEST_PATH,
      rawQueryString: 'parameter1=value1&parameter1=value2&parameter2=value',
      cookies: ['cookie1', 'cookie2'],
      headers: {
        Header1: 'value1',
        Header2: 'value1,value2',
      },
      queryStringParameters: {
        parameter1: 'value1,value2',
        parameter2: 'value',
      },
      requestContext: {
        accountId: '123456789012',
        apiId: 'api-id',
        authentication: {
          clientCert: {
            clientCertPem: 'CERT_CONTENT',
            subjectDN: 'www.example.com',
            issuerDN: 'Example issuer',
            serialNumber: 'a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1:a1',
            validity: {
              notBefore: 'May 28 12:30:02 2019 GMT',
              notAfter: 'Aug  5 09:36:04 2021 GMT',
            },
          },
        },
        authorizer: {
          jwt: {
            claims: {
              claim1: 'value1',
              claim2: 'value2',
            },
            scopes: ['scope1', 'scope2'],
          },
        },
        domainName: 'id.execute-api.us-east-1.amazonaws.com',
        domainPrefix: 'id',
        http: {
          method: 'POST',
          path: TEST_PATH,
          protocol: 'HTTP/1.1',
          sourceIp: '192.168.0.1/32',
          userAgent: 'agent',
        },
        requestId: 'id',
        routeKey: '$default',
        stage: '$default',
        time: '12/Mar/2020:19:03:58 +0000',
        timeEpoch: 1583348638390,
      },
      body: 'eyJ0ZXN0IjoiYm9keSJ9',
      pathParameters: {
        parameter1: 'value1',
      },
      isBase64Encoded: true,
      stageVariables: {
        stageVariable1: 'value1',
        stageVariable2: 'value2',
      },
    }

    response = await handler(event)
  })

  it('returns 200 status', async () => {
    expect(response?.statusCode).toBe(200)
  })

  it('returns body data', async () => {
    expect(JSON.parse(response?.body).data.result).toBe('ok')
  })
})
