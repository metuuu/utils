import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PutObjectCommandInput } from "@aws-sdk/client-s3/dist-types/commands/PutObjectCommand";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client();

const createSignedFileUploadUrl = async (
  options: {
    /** @default 900 // 15 min */
    expiresIn?: number;
  } & Omit<PutObjectCommandInput, "Bucket">,
) => {
  const { expiresIn = 900, ...putObjectCommandInput } = options;
  const signedUrl = await getSignedUrl(
    client,
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      ...putObjectCommandInput,
    }),
    { expiresIn },
  );

  return {
    url: signedUrl,
    fields: putObjectCommandInput,
  };
};

export default createSignedFileUploadUrl;
