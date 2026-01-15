import axios from "axios";
import { ErrorRequestHandler } from "express";
import httpErrors from "http-errors";
import { default as status } from "http-status";
import ErrorApiResponse from "../models/ErrorApiResponse";
import log from "../utils/log";
// import postingManager from "../utils/postingManager";

const expressErrorHandler: ErrorRequestHandler = async (
  err,
  req,
  res,
  next
) => {
  try {
    // Express body parser throws HttpErrors/SyntaxErrors which are converted to ErrorApiResponse class instance
    // for error handler to be able to process it correctly and to return responses in consistent format.
    // SyntaxError is returned at least when JSON parsing fails, so we return the details of the SyntaxError to client so it will know what really went wrong.
    const error = httpErrors.isHttpError(err)
      ? new ErrorApiResponse(err.statusCode, {
          detail: err.stack || err.message,
        })
      : err;

    // If error is instance of ErrorApiResponse we return API response according to it
    if (error instanceof ErrorApiResponse) {
      log.info(`Request failed with status code ${error.responseStatusCode}`, {
        statusCode: error.responseStatusCode,
        title: error.responseError.title,
        detail: error.responseError.detail,
      });

      const alertPostTexts: string[] = [];
      if (error.responseError.title)
        alertPostTexts.push(error.responseError.title);
      if (error.responseError.detail)
        alertPostTexts.push(error.responseError.detail);

      // // if (shouldPostSlackAlertOfErrorApiResponse(req, error)) {
      // await postingManager.post({
      //   title: "Lambda REST API",
      //   subtitle: `Request failed with status code ${error.responseStatusCode}`,
      //   text: alertPostTexts.join("\n"),
      //   level: error.responseStatusCode < 500 ? "warn" : "error",
      // });
      // // }

      res.status(error.responseStatusCode).json(error.responseError);
      return;
    }

    // Axios errors include sensitive information usually so we don't want to fully log it
    if (axios.isAxiosError(error)) {
      log.error("Internal Server Error - Axios error", {
        error: {
          message: error.message,
          stack: error.stack,
        },
        axiosRequestDetails: {
          method: error.response?.config?.method,
          url: error.response?.config?.url,
          responseData: error.response?.data,
        },
      });
    }
    // Log other errors completely
    else {
      log.error("Internal Server Error", { error });
    }

    // await postingManager.post({
    //   level: "error",
    //   title: "Lambda REST API",
    //   subtitle: "Internal Server Error",
    //   text: error.stack || error.message,
    // });

    // For other than ErrorApiResponse errors, 500 Internal Server Error response is returned
    if (process.env.ENV === "develop") {
      // In dev environment we return error stack information to client to help debugging
      res.status(500).json({
        title: status[500],
        detail: error.stack || error.message,
      });
      return;
    } else {
      res.status(500).json({ title: status[500] });
      return;
    }
  } catch (errorFromErrorHandler) {
    try {
      // This log triggers "Unexpected Lambda error notifier". See amplify/backend/function/unexpectedLambdaErrorNotifier/README.md
      log.error("Unexpected error in expressErrorHandler", {
        errorFromErrorHandler,
        originalError: err,
      });
    } catch {
      // Just in case if there is something wrong with the logger
      console.error(
        "Unexpected error in expressErrorHandler: ",
        errorFromErrorHandler,
        "\n",
        "The original error was: ",
        err
      );
    }

    // We don't want to forward full error because Amplify doesn't configure NODE_ENV env var that would disable returning error stack to client only when the value is set to 'production'.
    // TODO: Should we configure NODE_ENV var https://stackoverflow.com/questions/16978256/what-is-node-env-and-how-to-use-it-in-express
    next("Internal Server Error");
  }
};

export default expressErrorHandler;
