export default interface File {
  id: string;
  parentId: string;
  uri: string;
  name: string;
  type: string;
  contentType: string;
  /** The size of the object in bytes */
  size: number;
  uploadedAt: number;
}
