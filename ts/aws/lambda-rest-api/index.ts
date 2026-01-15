// AWS X-RAY SETUP
// eslint-disable-next-line prettier/prettier
delete process.env.AWS_XRAY_CONTEXT_MISSING;
// eslint-disable-next-line prettier/prettier
import AwsXRay from "aws-xray-sdk-core";
import http from "http";
import https from "https";

// Configure the context missing strategy to do nothing (It caused crashes)
AwsXRay.setContextMissingStrategy(() => {});

// Capture http(s) requests and promises
AwsXRay.captureHTTPsGlobal(http);
AwsXRay.captureHTTPsGlobal(https);
// eslint-disable-next-line prettier/prettier
AwsXRay.capturePromise();

// IMPORTS
import serverlessExpress from "@codegenie/serverless-express";
import { APIGatewayProxyHandler } from "aws-lambda";
import AwsXRayExpress from "aws-xray-sdk-express";
import express from "express";
import expressErrorHandler from "./middleware/expressErrorHandler";
import { getApiRouter } from "./router";
import { initializeLogging } from "./utils/log";
import secretsManager from "./utils/secretsManager";
let serverlessExpressInstance: APIGatewayProxyHandler;

export const handler: APIGatewayProxyHandler = (event, context, cb) => {
  initializeLogging(event, context);
  if (serverlessExpressInstance)
    return serverlessExpressInstance(event, context, cb);

  return setup(event, context, cb);
};

const setup: APIGatewayProxyHandler = (event, context, cb) => {
  const app = express();

  // Preload secrets
  app.use((req, res, next) => {
    secretsManager
      .preloadSecrets()
      .then(() => next())
      .catch((err) => next(err));
  });

  // JSON body parser config
  app.use(express.json());

  // TODO: CORS configuration
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });

  // Initialize router
  const router = getApiRouter();
  app.use(AwsXRayExpress.openSegment("route"));
  app.use("/", router);
  app.use(AwsXRayExpress.closeSegment());

  // Custom error handling
  app.use(expressErrorHandler);

  serverlessExpressInstance = serverlessExpress({ app });
  return serverlessExpressInstance(event, context, cb);
};
