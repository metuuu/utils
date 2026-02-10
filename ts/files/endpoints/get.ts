import ErrorApiResponse from "@/ts/aws/lambda-rest-api/models/ErrorApiResponse";
import log from "@/ts/aws/lambda-rest-api/utils/log";
import validateRequestParameters from "@/ts/aws/lambda-rest-api/utils/validateRequestParameters";
import { RequestHandler } from "express";
import httpStatus from "http-status";
import z from "zod";
import FileEntity, { fileToClient } from "../FileEntity";
import ElectroDbUtils from "@/ts/db/electrodb/ElectroDbUtils";

const parameterValidationSchema = z.object({
  params: z.object({}),
  query: z.object({
    parentId: z.string().optional(),
    fileType: z.array(z.enum(["foo", "bar"])),
  }),
  body: z.object({}),
});

const getFiles: RequestHandler = async (req, res, next) => {
  try {
    const { query } = await validateRequestParameters(
      req,
      parameterValidationSchema,
    );
    const parentId = query.parentId!;
    log.addDynamicErrorMetadata({ parentId, fileType: query.fileType });

    // Access checks
    const user = xxxxxxxxx;

    const fileTypesToFetch = query.fileType;

    const { hasAccess } = await hasAccessToFiles({
      user,
      fileTypes: query.fileType,
      parentId,
      action: "download",
    });
    if (!hasAccess) throw new ErrorApiResponse(httpStatus.FORBIDDEN);

    // Fetch the files
    const fileQuery = FileEntity.query
      .byParentId({ parentId })
      .where((a, o) => o.eq(a.isUploaded, true))
      .where((a, o) =>
        ElectroDbUtils.OR(
          fileTypesToFetch.map((type) => o.eq(a.fileType, type)),
        ),
      );
    const { data: files } = await fileQuery.go();

    const filesToClient = await Promise.all(files.map(fileToClient));
    res.status(httpStatus.OK).send(filesToClient);
  } catch (err) {
    next(err);
  }
};

export default getFiles;
