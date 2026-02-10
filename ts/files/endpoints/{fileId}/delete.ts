import ErrorApiResponse from "@/ts/aws/lambda-rest-api/models/ErrorApiResponse";
import log from "@/ts/aws/lambda-rest-api/utils/log";
import validateRequestParameters from "@/ts/aws/lambda-rest-api/utils/validateRequestParameters";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { RequestHandler } from "express";
import httpStatus from "http-status";
import z from "zod";
import FileEntity from "../../FileEntity";

const s3Client = new S3Client({});

const parameterValidationSchema = z.object({
  params: z.object({ fileId: z.string() }),
  query: z.object({}),
  body: z.object({}),
});

const deleteFile: RequestHandler = async (req, res, next) => {
  try {
    const {
      params: { fileId },
    } = await validateRequestParameters(req, parameterValidationSchema);
    log.addDynamicErrorMetadata({ fileId, fileKey: `files/${fileId}` });

    // Access check
    const user = xxxxxxxxxx;
    if (!user) throw new ErrorApiResponse(httpStatus.UNAUTHORIZED);

    const { data: file } = await FileEntity.get({ id: fileId }).go({
      attributes: ["parentId", "fileType"],
    });
    if (!file) throw new ErrorApiResponse(httpStatus.FORBIDDEN);
    const { hasAccess } = await hasAccessToFiles({
      user,
      parentId: file.parentId,
      fileTypes: [file.fileType],
      action: "upload",
    });
    if (!hasAccess) throw new ErrorApiResponse(httpStatus.FORBIDDEN);

    // Delete image from DB
    await FileEntity.delete({ id: fileId }).go({ response: "none" });

    // Delete image from S3
    await s3Client.send(
      new DeleteObjectCommand({
        Key: `files/${fileId}`,
        Bucket: BUCKET_NAME,
      }),
    );

    res.sendStatus(httpStatus.NO_CONTENT);
  } catch (err) {
    next(err);
  }
};

export default deleteFile;
