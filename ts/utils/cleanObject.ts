import { ConditionalKeys, SetOptional } from "type-fest";

type CleanObjectOptions<
  TRemoveNull extends boolean = false,
  TRemoveEmptyString extends boolean = false
> = {
  removeNull?: TRemoveNull;
  removeEmptyString?: TRemoveEmptyString;
};

/** Removes object keys from type with value of "TRemoveType" template. If union type, excludes the type from union. */
export type RemoveTypeFromObjValues<T, TRemoveType> = {
  [K in keyof T as T[K] extends TRemoveType ? never : K]: Exclude<
    T[K],
    TRemoveType
  >;
};

type MakeStringsOptional<T> = SetOptional<T, ConditionalKeys<T, string>>;

/**
 * Remove object keys with undefined or undefined and null value depending on clean options.
 */
const cleanObject = <
  T extends Record<any, any>,
  TRemoveNull extends boolean = false,
  TRemoveEmptyString extends boolean = false
>(
  obj: T,
  options?: CleanObjectOptions<TRemoveNull, TRemoveEmptyString>
  // We get dynamic return type depending on if removeNull is set
  // (TRemoveNull extends true ? undefined | null)
  // https://stackoverflow.com/a/52818072/4336383
): TRemoveEmptyString extends true
  ? MakeStringsOptional<
      TRemoveNull extends true ? RemoveTypeFromObjValues<T, null> : T
    >
  : RemoveTypeFromObjValues<
      T,
      TRemoveNull extends true ? undefined | null : undefined
    > => {
  const { removeNull, removeEmptyString } = options || {};
  const cleanedObj = { ...obj };
  Object.keys(cleanedObj).forEach((key) => {
    if (
      // Remove undefined
      cleanedObj[key] === undefined ||
      // Remove null
      (removeNull && cleanedObj[key] === null) ||
      // Remove empty string
      (removeEmptyString && cleanedObj[key] === "")
    )
      delete cleanedObj[key];
  });
  return cleanedObj as any;
};

export default cleanObject;
