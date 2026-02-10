import ErrorApiResponse from "@/ts/aws/lambda-rest-api/models/ErrorApiResponse";
import log from "@/ts/aws/lambda-rest-api/utils/log";
import validateRequestParameters from "@/ts/aws/lambda-rest-api/utils/validateRequestParameters";
import { RequestHandler } from "express";
import httpStatus from "http-status";
import z from "zod";
import createSignedFileUploadUrl from "../createSignedFileUploadUri";
import FileEntity from "../FileEntity";

const parameterValidationSchema = z.object({
  params: z.object({}),
  query: z.object({}),
  body: z.object({
    parentId: z.string().optional(),
    fileType: z.enum(["foo", "bar"]),
    name: z.string().optional(),
  }),
});

const uploadFile: RequestHandler = async (req, res, next) => {
  try {
    const { body } = await validateRequestParameters(
      req,
      parameterValidationSchema,
    );
    const { fileType, name } = body;
    const parentId = body.parentId!;
    log.addDynamicErrorMetadata({ parentId, fileType });

    // Access check
    const user = xxxxxxxxxxxxx;
    if (!user) throw new ErrorApiResponse(httpStatus.UNAUTHORIZED);

    const { hasAccess } = await hasAccessToFiles({
      user,
      parentId,
      fileTypes: [fileType],
      action: "upload",
    });
    if (!hasAccess) throw new ErrorApiResponse(httpStatus.FORBIDDEN);

    // Store details to DB
    const fileId = crypto.randomUUID();
    const fileKey = `files/${fileId}`;

    await FileEntity.create({
      parentId,
      id: fileId,
      fileType,
      name: name || fileId,
      fileKey,
      isUploaded: false,
      ttl: Math.ceil(Date.now() / 1000) + 60 * 60, // If file is not uploaded within an hour, the file item is removed from db
    }).go();

    // Return signed upload url
    const signedUrl = await createSignedFileUploadUrl({ Key: fileKey });

    res.status(httpStatus.CREATED).send({ fileId, ...signedUrl });
  } catch (err) {
    next(err);
  }
};

export default uploadFile;
