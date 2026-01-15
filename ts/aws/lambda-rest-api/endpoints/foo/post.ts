import ErrorApiResponse from "../../models/ErrorApiResponse";
import validateRequestParameters from "../../utils/validateRequestParameters";
import { RequestHandler } from "express";
import httpStatus from "http-status";
import z from "zod";
import getAuthenticatedUserSub from "../../utils/getAuthenticatedUserSub";
import getRequestEvent from "../../utils/getRequestEvent";

const parameterValidationSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    fooId: z.string(),
  }),
});

const postFoo: RequestHandler = async (req, res, next) => {
  try {
    const {
      body: { fooId },
    } = await validateRequestParameters(req, parameterValidationSchema);

    const userId = await getAuthenticatedUserSub(getRequestEvent());
    if (!userId) throw new ErrorApiResponse(httpStatus.UNAUTHORIZED);

    res.status(httpStatus.OK).send({ fooId });
  } catch (err) {
    next(err);
  }
};

export default postFoo;
