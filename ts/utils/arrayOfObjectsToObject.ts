// TODO: Fix typings

type ValueOfTypeByKey<T, K extends keyof T> = T[K];

// Converts [{ id: "a", title: "test"}] to { a: { id: "a", title: "test"}}
const arrayOfObjectsToObject = <T, K extends keyof T>(
  objs: T[],
  keyAsId: K
  // @ts-ignore
): Record<ValueOfTypeByKey<T, K>, T> => {
  return objs.reduce(
    (obj, item) => ({
      ...obj,
      // @ts-ignore
      [item[keyAsId]]: item,
    }),
    {}
  ) as any;
};

export default arrayOfObjectsToObject;
