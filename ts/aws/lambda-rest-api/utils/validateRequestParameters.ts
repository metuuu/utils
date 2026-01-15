import { Request } from "express";
import httpStatus from "http-status";
import { ZodError, ZodObject, ZodSchema } from "zod";
import ErrorApiResponse from "../models/ErrorApiResponse";

/**
 * @throws {ErrorApiResponse}
 */
export default async function validateRequestParameters<
  TParams extends ZodSchema,
  TQuery extends ZodSchema,
  TBody extends ZodSchema
>(
  req: Request,
  paramValidationSchema: ZodObject<{
    params: TParams;
    query: TQuery;
    body: TBody;
  }>
) {
  try {
    const data = await paramValidationSchema.parseAsync(req);
    return data;
  } catch (err: any) {
    if (!(err instanceof ZodError)) throw err;
    throw new ErrorApiResponse(httpStatus.BAD_REQUEST, {
      title: `Your request parameters didn't validate.`,
      detail: err.issues
        .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
        .join("\n"),
      invalidParams: err.issues.map(({ path, message, code }) => ({
        path,
        message,
        code,
      })),
    });
  }
}
