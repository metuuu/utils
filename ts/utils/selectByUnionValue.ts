const selectByUnionValue = <TReturnValue = any, TUnion extends string = any>(
  value: TUnion,
  select: Record<TUnion, TReturnValue>
) => {
  return select[value];
};

export default selectByUnionValue;

export const selectByOptionalUnionValue = <
  TReturnValue = any,
  TUnion extends string | null | undefined = any
>(
  value: TUnion,
  select: { [key in Exclude<TUnion, undefined | null>]?: TReturnValue } & {
    default: TReturnValue;
  }
): TUnion extends undefined ? TReturnValue : TReturnValue => {
  return (select as any)[value || "default"] as TReturnValue;
};
