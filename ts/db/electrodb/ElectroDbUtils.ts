const ElectroDbUtils = {
  /** Add parentheses automatically to conditions if there are multiple conditions. DynamoDB gives error if there are redundant parenthesis. */
  AND: (conditionGroup: string[]) => {
    return conditionGroup.length > 1
      ? `(${conditionGroup.join(" AND ")})`
      : conditionGroup[0];
  },
  /** Add parentheses automatically to conditions if there are multiple conditions. DynamoDB gives error if there are redundant parenthesis. */
  OR: (conditionGroup: string[]) => {
    return conditionGroup.length > 1
      ? `(${conditionGroup.join(" OR ")})`
      : conditionGroup[0];
  },
};

export default ElectroDbUtils;
