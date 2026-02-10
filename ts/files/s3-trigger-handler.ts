import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { S3Event } from "aws-lambda";
import log from "lambda-log";
import FileEntity from "./FileEntity";

const s3Client = new S3Client();

export const handler = async (event: S3Event) => {
  await Promise.all(
    event.Records.map(async (record) => {
      const bucketName = record.s3.bucket.name;
      const objectKey = record.s3.object.key;

      log.info("Incoming S3 event", {
        eventName: record.eventName,
        bucketName,
        objectKey,
      });

      // Put event
      if (record.eventName === "ObjectCreated:Put") {
        // File
        const fileMatch = objectKey.match(
          // files/<file-id>
          /files\/([0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12})/,
        );
        if (fileMatch) {
          const [, fileId] = fileMatch;

          const objectHead = await s3Client.send(
            new HeadObjectCommand({
              Bucket: bucketName,
              Key: objectKey,
            }),
          );

          await FileEntity.patch({ id: fileId })
            .set({
              isUploaded: true,
              size: record.s3.object.size,
              contentType: objectHead.ContentType,
              uploadedAt: objectHead.LastModified
                ? objectHead.LastModified.getTime()
                : new Date(record.eventTime).getTime(),
            })
            .remove(["ttl"])
            .go();
        }
      }

      log.info("Unhandled S3 event", {
        bucketName,
        objectKey,
        eventName: record.eventName,
      });
    }),
  );
};
