const shuffleArray = <T>(array: T[]) => {
  const copyOfArray = [...array];
  let currentIndex = copyOfArray.length;
  let randomIndex: number;

  while (currentIndex > 0) {
    randomIndex = Math.floor(Math.random() * --currentIndex);
    [copyOfArray[currentIndex], copyOfArray[randomIndex]] = [
      copyOfArray[randomIndex],
      copyOfArray[currentIndex],
    ];
  }

  return copyOfArray;
};

export default shuffleArray;
