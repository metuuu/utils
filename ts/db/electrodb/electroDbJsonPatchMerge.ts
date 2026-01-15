import { DataUpdateOperations } from "electrodb";

/**
 * undefined - skip
 * null - remove
 * object (not array) - electroDbJsonPatchMerge recursion
 * other value - set
 */
const electroDbJsonPatchMerge = <T extends object>(
  data: T,
  attribute: any,
  operation: DataUpdateOperations<any, any, any, any, any>
) => {
  for (const k in data) {
    const key = k as keyof typeof data;
    const value = data[key];
    if (value === undefined) continue;
    if (value === null) operation.remove(attribute[key]);
    else if (Array.isArray(value)) operation.set(attribute[key], value);
    else if (typeof value === "object")
      electroDbJsonPatchMerge(value, attribute[key], operation);
    else operation.set(attribute[key], value);
  }
};

export default electroDbJsonPatchMerge;
