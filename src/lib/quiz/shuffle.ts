// Fisher-Yates shuffle + seeded PRNG (mulberry32)

export function createSeededRng(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: T[], rng: () => number = Math.random): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffleOptions(
  options: string[],
  correctAnswer: string,
  rng: () => number = Math.random
): { shuffledOptions: string[]; newCorrectAnswer: string } {
  if (!options || options.length === 0) {
    return { shuffledOptions: options, newCorrectAnswer: correctAnswer };
  }

  const correctUpper = correctAnswer.trim().toUpperCase();
  let correctIndex = options.findIndex(
    (o) => o.trim().toUpperCase().startsWith(correctUpper + ")")
  );
  if (correctIndex === -1) {
    correctIndex = options.findIndex(
      (o) => o.trim().toUpperCase() === correctUpper
    );
  }
  if (correctIndex === -1) {
    return { shuffledOptions: options, newCorrectAnswer: correctAnswer };
  }

  const indices = options.map((_, i) => i);
  shuffle(indices, rng);

  const shuffledOptions = indices.map((i) => options[i]);
  // newCorrectIndex = position in shuffled array where the original correct answer now lives
  const newCorrectIndex = indices.indexOf(correctIndex);

  const letters = "ABCDEFGHIJ";
  const relabeled = shuffledOptions.map((opt, i) => {
    const stripped = opt.replace(/^[A-J]\)\s*/, "");
    return `${letters[i]}) ${stripped}`;
  });

  return { shuffledOptions: relabeled, newCorrectAnswer: letters[newCorrectIndex] };
}
