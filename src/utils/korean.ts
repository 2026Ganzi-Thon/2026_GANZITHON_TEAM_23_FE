// src/utils/korean.ts

/** 마지막 글자 받침 유무에 따라 을/를 */
export const withObjectParticle = (word: string): string => {
  const last = word.charCodeAt(word.length - 1);
  const isHangul = last >= 0xac00 && last <= 0xd7a3;
  if (!isHangul) return `${word}을(를)`;
  const hasFinalConsonant = (last - 0xac00) % 28 !== 0;
  return `${word}${hasFinalConsonant ? "을" : "를"}`;
};
