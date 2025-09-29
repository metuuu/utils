import crypto from "crypto";

class Seed {
  index = 0;
  seed: Buffer;
  currentSeed: Buffer;

  constructor(seed: string | Buffer) {
    this.seed = typeof seed === "string" ? Buffer.from(seed) : seed;
    this.currentSeed = this.seed;
  }

  next = () => {
    const newBuffer = Buffer.from((++this.index).toString());
    this.currentSeed = Buffer.concat([this.seed, newBuffer]);
    return this.currentSeed;
  };
}

const globalSeed = new Seed(crypto.randomBytes(32));

export default class RandomSeeded {
  private seed: Seed;

  constructor(seed: string | Buffer) {
    this.seed = new Seed(seed);
  }

  random = () => random(this.seed);
  randomChoice = <T>(array: T[] | T) => randomChoice(array, this.seed);

  shuffle = <T>(array: T[]) => shuffle(array, this.seed);
}

const maxVal = Math.pow(2, 256);

export const random = (seed: Seed = globalSeed) => {
  const hash = crypto.createHash("sha256").update(seed.next()).digest(); //.reduce((prev, current) => current + prev, 0)
  return byteArrayToLong(hash) / maxVal;
};

function byteArrayToLong(byteArray: Uint8Array) {
  let value = 0;
  for (let i = byteArray.length - 1; i >= 0; i--) {
    value = value * 256 + byteArray[i];
  }
  return value;
}

export const randomChoice = <T>(array: T[] | T, seed: Seed = globalSeed) => {
  if (!Array.isArray(array)) return array;
  return array[Math.floor(random(seed) * array.length)];
};

export const shuffle = <T>(array: T[], seed: Seed = globalSeed) => {
  const copyOfArray = [...array];
  let currentIndex = copyOfArray.length;
  let randomIndex: number;

  // While there remain elements to shuffle.
  while (currentIndex > 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(random(seed) * --currentIndex);

    // And swap it with the current element.
    [copyOfArray[currentIndex], copyOfArray[randomIndex]] = [
      copyOfArray[randomIndex],
      copyOfArray[currentIndex],
    ];
  }

  return copyOfArray;
};
