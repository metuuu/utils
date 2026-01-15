import express from "express";
import httpStatus from "http-status";
import ErrorApiResponse from "./models/ErrorApiResponse";
import log from "./utils/log";
import postFoo from "./endpoints/foo/post";
import getFoo from "./endpoints/foo/{fooId}/get";
import getRequestEvent from "./utils/getRequestEvent";

export const getApiRouter = () => {
  const router = express.Router();

  // Logging
  log.info("Initializing Router");
  router.use((req, res, next) => {
    const event = getRequestEvent();
    const { httpMethod, path } = event.requestContext;
    log.info(`Endpoint "${httpMethod} ${path}" function is being called`);
    res.on("finish", () =>
      log.info(`Request ended with status code ${req.res?.statusCode}`, {
        statusCode: req.res?.statusCode,
      })
    );
    next();
  });

  // Content
  router.post("/foo", postFoo);
  router.get("/foo/:fooId", getFoo);

  // NOT FOUND HANDLING
  router.all("*", (req, res, next) => {
    const event = getRequestEvent();
    next(
      new ErrorApiResponse(httpStatus.NOT_FOUND, {
        detail: `Endpoint ${event.requestContext.httpMethod} ${event.requestContext.path} doesn't exist`,
      })
    );
  });

  return router;
};
