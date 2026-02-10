import { Entity, EntityItem } from "electrodb";
import File from "./File";
import createSignedFileDownloadUrl from "./getSignedFileDownloadUrl";

const FileEntity = new Entity(
  {
    model: {
      service: "files",
      entity: "file",
      version: "1",
    },
    attributes: {
      id: {
        field: "fileId",
        type: "string",
        required: true,
      },
      parentId: {
        type: "string",
        required: true,
      },
      fileKey: {
        type: "string",
        required: true,
      },
      fileType: {
        type: ["foo", "bar"] as const,
        required: true,
      },
      name: {
        type: "string",
      },
      size: {
        type: "number",
      },
      contentType: {
        type: "string",
      },
      /** Timestamp when file was uploaded to s3 */
      uploadedAt: {
        type: "number",
      },
      isUploaded: {
        type: "boolean",
        required: true,
      },
      ttl: { type: "number" },
      createdAt: {
        type: "number",
        required: true,
        readOnly: true,
        default: () => Date.now(),
      },
      updatedAt: {
        type: "number",
        readOnly: true,
        // watch for changes to any attribute
        watch: "*",
        // set current timestamp when updated
        set: () => Date.now(),
        required: true,
        default: () => Date.now(),
      },
    },
    indexes: {
      byId: {
        pk: {
          field: "pk",
          composite: ["id"],
          casing: "none",
        },
        sk: {
          field: "sk",
          composite: [],
        },
      },
      byParentId: {
        index: "gsi1",
        pk: {
          field: "gsi1pk",
          composite: ["parentId"],
          casing: "none",
        },
        sk: {
          field: "gsi1sk",
          composite: ["fileType", "id"],
          casing: "none",
        },
      },
    },
  },
  {
    table: process.env.STORAGE_FILE_NAME,
    client: docClient,
  },
);

export default FileEntity;

export type FileEntityType = EntityItem<typeof FileEntity>;

export const fileToClient = async (file: FileEntityType): Promise<File> => {
  const {
    id,
    parentId,
    fileType,
    fileKey,
    name,
    size,
    contentType,
    uploadedAt,
  } = file;
  const uri = await createSignedFileDownloadUrl(fileKey as string);
  return {
    id,
    parentId,
    type: fileType,
    uri: uri!,
    name: name || id,
    size: size!,
    contentType: contentType!,
    uploadedAt: uploadedAt!,
  };
};
