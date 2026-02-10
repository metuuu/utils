import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client();

const createSignedFileDownloadUrl = async (key: string) => {
  const signedUrl = await getSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      // ResponseContentDisposition: 'attachment',
      // ResponseContentDisposition: downloadFileName ? `attachment; filename="${downloadFileName}"` : 'attachment',
    }),
    {
      expiresIn: 60 * 60 * 12, // 12 hours
    },
  );

  return signedUrl;
};

export default createSignedFileDownloadUrl;
