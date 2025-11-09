import * as hangul from 'hangul-js';


export const verticalVowels = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅣ', 'ㅐ', 'ㅒ', 'ㅔ', 'ㅖ'];
export const horizontalVowels = ['ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ'];
export const complexVowels = ['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ'];

export const isVerticalVowel = (text: string): boolean => {
  return verticalVowels.includes(text);
};

export const isHorizontalVowel = (text: string): boolean => {
  return horizontalVowels.includes(text);
};

export const isComplexVowel = (text: string): boolean => {
  return complexVowels.includes(text);
};

export const isVowel = (text: string): boolean => {
  return isVerticalVowel(text) || isHorizontalVowel(text) || isComplexVowel(text);
};

export const isConsonant = (text: string): boolean => {
  return !isVowel(text);
};

export const decomposeSyllable = (syllable: string): string[] => {
  const result = [];
  const jamos = hangul.disassemble(syllable);

  if (jamos.length < 3 || (jamos.length == 3 && isConsonant(jamos[1]))) return jamos;
  else {
    result.push(jamos[0]);
    const vowels = [];
    const consonants = [];
    for (let i = 1; i < jamos.length; i++) {
      if (isVowel(jamos[i])) {
        vowels.push(jamos[i]);
      }
      else {
        consonants.push(jamos[i]);
      }
    }
    if (vowels.length > 0) result.push(hangul.assemble(vowels));
    if (consonants.length > 0) result.push(hangul.assemble(consonants));
  }

  return result;
};