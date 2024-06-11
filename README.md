# [H3](h3.unjs.io) AWS Lambda Adapter

⚡️ Use [h3](h3.unjs.io) with AWS Lambda

## Install

```sh
npm install h3-aws-lambda-adapter
```

## Usage

First, create app entry (`app.mjs`):

```js [app.mjs]
import { createApp, defineEventHandler } from 'h3'

export const app = createApp()

app.use(defineEventHandler(() => 'Hello world!'))
```

Create AWS Lambda entry:

```js [handler.mjs]
import { toAWSLambdaHandler } from 'h3-aws-lambda-adapter'

import { app } from './app.mjs'

export const handler = toAWSLambdaHandler(app)
```
