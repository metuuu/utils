export const pickRandom = <T>(arr: Array<T>): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

/** Has max precision of 6 decimals */
export const randomRange = (min: number, max: number, decimals: number = 0) => {
  const value = Math.random() * (max - min) + min;
  return Number(value.toFixed(decimals));
};
