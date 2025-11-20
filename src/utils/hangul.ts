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

export const formFeatures = {
  "right-top-corner": {
    "description": "A structure with a right-top angular corner.",
    "elements": ["ㄱ", "ㄹ", "ㅁ", "ㅋ", "ㅍ", "ㄲ", "ㄸ", "ㅂ", "ㅃ"]
  },
  "left-bottom-corner": {
    "description": "A structure with a left-bottom angular corner.",
    "elements": ["ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅌ", "ㅍ", "ㄸ", "ㅃ"]
  },
  "double-corner": {
    "description": "A composite structure featuring both upper and lower angular corners.",
    "elements": ["ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅌ", "ㅍ", "ㄸ", "ㅃ"]
  },
  "square-outline": {
    "description": "A closed square-shaped outline.",
    "elements": ["ㅁ", "ㅂ", "ㅍ", "ㅃ"]
  },
  "triangular-outline": {
    "description": "A triangular or mountain-shaped outline.",
    "elements": ["ㅅ", "ㅈ", "ㅊ", "ㅆ", "ㅉ"]
  },
  "circular-outline": {
    "description": "A circular or ring-shaped outline.",
    "elements": ["ㅇ", "ㅎ"]
  },
  "vertical-line": {
    "description": "A structure primarily composed of vertical strokes.",
    "elements": [
      "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅋ", "ㅌ", "ㅍ", "ㄲ", "ㄸ", "ㅃ",
      "ㅣ", "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅐ", "ㅒ", "ㅔ", "ㅖ",
      "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"
    ]
  },
  "horizontal-line": {
    "description": "A structure primarily composed of horizontal strokes.",
    "elements": [
      "ㄱ", "ㄴ", "ㄷ", "ㄹ", "ㅁ", "ㅂ", "ㅈ", "ㅊ", "ㅋ", "ㅌ", "ㅍ", "ㅎ",
      "ㄲ", "ㄸ", "ㅃ", "ㅉ",
      "ㅡ", "ㅗ", "ㅛ", "ㅜ", "ㅠ",
      "ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"
    ]
  },
  "double-vertical-line": {
    "description": "A repeated vertical-line structure formed by combining two parallel vertical components.",
    "elements": ["ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅙ", "ㅞ"]
  },
  "diagonal-line": {
    "description": "A structure that includes diagonal strokes.",
    "elements": ["ㅅ", "ㅈ", "ㅊ", "ㄱ", "ㅋ", "ㄲ", "ㅆ", "ㅉ"]
  },
  "left-tick": {
    "description": "A short attached stroke positioned on the left side.",
    "elements": ["ㅓ", "ㅕ", "ㅐ", "ㅒ", "ㅔ", "ㅖ", "ㅝ", "ㅞ"]
  },
  "right-tick": {
    "description": "A short attached stroke positioned on the right side.",
    "elements": ["ㅏ", "ㅑ", "ㅐ", "ㅒ", "ㅖ", "ㅘ", "ㅙ"]
  },
  "double-tick": {
    "description": "A structure with two consecutive short ticks.",
    "elements": ["ㅑ", "ㅕ", "ㅛ", "ㅠ", "ㅒ"]
  },
  "upper-tick": {
    "description": "A short attached stroke positioned above the main body.",
    "elements": ["ㅊ", "ㅎ", "ㅗ", "ㅛ", "ㅘ", "ㅙ", "ㅚ"]
  },
  "lower-tick": {
    "description": "A short attached stroke positioned below the main body.",
    "elements": ["ㅜ", "ㅠ", "ㅝ", "ㅞ", "ㅟ"]
  },
  "middle-bar": {
    "description": "An additional horizontal bar placed in the middle region.",
    "elements": ["ㅋ", "ㅌ", "ㅂ"]
  },
  "upper-bar": {
    "description": "An additional horizontal bar placed on the upper region.",
    "elements": ["ㅈ", "ㅊ", "ㅎ"]
  },
  "combined-vowel-structure": {
    "description": "A vowel structure composed of multiple combined components.",
    "elements": ["ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"]
  }
};

export const formGroups = {
  "right-top-corner-group": {
    "description": "A group of consonants characterized by an upper-right angular corner, derived from the ㄱ base structure.",
    "elements": ["ㄱ", "ㄲ", "ㅋ"]
  },

  "left-bottom-corner-group": {
    "description": "A group of consonants characterized by a lower-left angular corner, derived from the ㄴ base structure.",
    "elements": ["ㄴ", "ㄷ", "ㅌ", "ㄸ"]
  },

  "corner-composite-group": {
    "description": "A composite corner structure combining both upper-right and lower-left corners.",
    "elements": ["ㄹ"]
  },

  "square-group": {
    "description": "A group of consonants defined by a closed, square-shaped outline.",
    "elements": ["ㅁ", "ㅂ", "ㅍ", "ㅃ"]
  },

  "triangular-group": {
    "description": "A group of consonants defined by a triangular or mountain-shaped outline.",
    "elements": ["ㅅ", "ㅆ", "ㅈ", "ㅊ", "ㅉ"]
  },

  "circular-group": {
    "description": "A group of consonants characterized by a circular or ring-shaped outline.",
    "elements": ["ㅇ", "ㅎ"]
  },

  "vertical-line-group": {
    "description": "A group of vowels derived from the vertical-stroke-based structure.",
    "elements": ["ㅣ", "ㅏ", "ㅑ", "ㅓ", "ㅕ", "ㅐ", "ㅒ", "ㅔ", "ㅖ"]
  },

  "horizontal-line-group": {
    "description": "A group of vowels derived from the horizontal-stroke-based structure.",
    "elements": ["ㅡ", "ㅗ", "ㅛ", "ㅜ", "ㅠ"]
  },

  "combined-line-group": {
    "description": "A group of composite vowels created by combining vertical and horizontal components.",
    "elements": ["ㅘ", "ㅙ", "ㅚ", "ㅝ", "ㅞ", "ㅟ", "ㅢ"]
  }
};

export const hangulConsonants: Record<string, {
  form_group: string;
  form_features: string[];
  description: string;
}> = {
  "ㄱ": {
    "form_group": "right-top-corner-group",
    "form_features": ["right-top-corner", "open-shape", "vertical-line", "horizontal-line", "diagonal-line"],
    "description": "A base consonant of the right-top-corner family, characterized by an angular corner at the upper-right."
  },

  "ㄲ": {
    "form_group": "right-top-corner-group",
    "form_features": ["right-top-corner", "open-shape", "vertical-line", "horizontal-line", "diagonal-line"],
    "description": "A reinforced form of ㄱ, created by duplicating the right-top-corner structure for added emphasis."
  },

  "ㅋ": {
    "form_group": "right-top-corner-group",
    "form_features": ["right-top-corner", "open-shape", "vertical-line", "horizontal-line", "middle-bar"],
    "description": "A variation of ㄱ created by adding a middle horizontal bar to the right-top-corner base shape."
  },

  "ㄴ": {
    "form_group": "left-bottom-corner-group",
    "form_features": ["left-bottom-corner", "open-shape", "vertical-line", "horizontal-line"],
    "description": "The base consonant of the left-bottom-corner family, defined by a downward-left angular corner."
  },

  "ㄷ": {
    "form_group": "left-bottom-corner-group",
    "form_features": ["double-corner", "vertical-line", "horizontal-line", "open-shape"],
    "description": "A derivative of ㄴ, created by adding an upper horizontal bar to close the top portion of the shape."
  },

  "ㄸ": {
    "form_group": "left-bottom-corner-group",
    "form_features": ["double-corner", "vertical-line", "horizontal-line", "open-shape"],
    "description": "A reinforced form of ㄷ, constructed by doubling the consonant to emphasize its angular structure."
  },

  "ㅌ": {
    "form_group": "left-bottom-corner-group",
    "form_features": ["double-corner", "vertical-line", "horizontal-line", "middle-bar"],
    "description": "A derivative of ㄷ formed by adding a middle horizontal bar, creating a more complex layered structure."
  },

  "ㄹ": {
    "form_group": "corner-composite-group",
    "form_features": ["double-corner", "vertical-line", "horizontal-line", "open-shape"],
    "description": "A composite consonant combining both right-top and left-bottom corners, merging features of ㄱ and ㄴ."
  },

  "ㅁ": {
    "form_group": "square-group",
    "form_features": ["square-outline", "closed-shape", "vertical-line", "horizontal-line"],
    "description": "A closed square-outline consonant representing the base form of the square-shaped family."
  },

  "ㅂ": {
    "form_group": "square-group",
    "form_features": ["square-outline", "closed-shape", "vertical-line", "horizontal-line", "middle-bar"],
    "description": "A derivative of ㅁ created by adding a middle horizontal bar inside the square structure."
  },

  "ㅃ": {
    "form_group": "square-group",
    "form_features": ["square-outline", "closed-shape", "vertical-line", "horizontal-line", "middle-bar"],
    "description": "A reinforced version of ㅂ, formed by doubling the consonant to amplify its geometric presence."
  },

  "ㅍ": {
    "form_group": "square-group",
    "form_features": ["square-outline", "closed-shape", "vertical-line", "horizontal-line", "middle-bar"],
    "description": "A variation of ㅁ with a split internal middle bar, creating a more divided square structure."
  },

  "ㅅ": {
    "form_group": "triangular-group",
    "form_features": ["triangular-outline", "open-shape", "diagonal-line"],
    "description": "The base triangular consonant, formed with two diagonal strokes creating a pointed mountain-like outline."
  },

  "ㅆ": {
    "form_group": "triangular-group",
    "form_features": ["triangular-outline", "open-shape", "diagonal-line"],
    "description": "A reinforced form of ㅅ, created by doubling the triangular structure for sharper emphasis."
  },

  "ㅈ": {
    "form_group": "triangular-group",
    "form_features": ["triangular-outline", "open-shape", "upper-bar", "diagonal-line"],
    "description": "A triangular base shape (ㅅ) with an added upper bar, giving it a more defined top edge."
  },

  "ㅉ": {
    "form_group": "triangular-group",
    "form_features": ["triangular-outline", "open-shape", "upper-bar", "diagonal-line"],
    "description": "A reinforced version of ㅈ, created by doubling the consonant for increased visual weight."
  },

  "ㅊ": {
    "form_group": "triangular-group",
    "form_features": ["triangular-outline", "open-shape", "upper-bar", "upper-tick", "diagonal-line"],
    "description": "A derivative of ㅈ formed by adding an upper tick above the upper bar, creating additional emphasis."
  },

  "ㅇ": {
    "form_group": "circular-group",
    "form_features": ["circular-outline", "closed-shape"],
    "description": "A base circular consonant, characterized by a closed ring-shaped outline."
  },

  "ㅎ": {
    "form_group": "circular-group",
    "form_features": ["circular-outline", "open-shape", "upper-bar", "upper-tick"],
    "description": "A derivative of ㅇ created by adding an upper bar and a top tick, expanding the circular base form."
  }
}

export const hangulVowels: Record<string, {
  form_group: string;
  form_features: string[];
  description: string;
}> = {
  "ㅣ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line"],
    "description": "The base vertical-line vowel represented by a single upright stroke."
  },

  "ㅏ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "right-tick"],
    "description": "A vowel formed by adding a right-side tick to the vertical base vowel ㅣ."
  },

  "ㅑ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "right-tick", "double-tick"],
    "description": "A derivative of ㅏ with a doubled right tick to indicate reinforcement."
  },

  "ㅓ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "left-tick"],
    "description": "A vowel formed by adding a left-side tick to the vertical base vowel ㅣ."
  },

  "ㅕ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "left-tick", "double-tick"],
    "description": "A reinforced version of ㅓ, created by doubling the left tick."
  },

  "ㅐ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "double-vertical-line", "right-tick"],
    "description": "A combined form created by merging a vertical base stroke with an additional parallel stroke, plus a right tick."
  },

  "ㅒ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "double-vertical-line", "right-tick", "double-tick"],
    "description": "A reinforced version of ㅐ, featuring doubled ticks on the right side."
  },

  "ㅔ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "double-vertical-line", "left-tick"],
    "description": "A combined form made by pairing two vertical components with a left tick."
  },

  "ㅖ": {
    "form_group": "vertical-line-group",
    "form_features": ["vertical-line", "double-vertical-line", "left-tick", "double-tick"],
    "description": "A reinforced version of ㅔ, featuring doubled left-side ticks."
  },

  "ㅡ": {
    "form_group": "horizontal-line-group",
    "form_features": ["horizontal-line"],
    "description": "The base horizontal-line vowel represented by a single flat stroke."
  },

  "ㅗ": {
    "form_group": "horizontal-line-group",
    "form_features": ["horizontal-line", "upper-tick"],
    "description": "A vowel formed by adding an upper tick to the horizontal base vowel ㅡ."
  },

  "ㅛ": {
    "form_group": "horizontal-line-group",
    "form_features": ["horizontal-line", "upper-tick", "double-tick"],
    "description": "A reinforced version of ㅗ, featuring double upper ticks."
  },

  "ㅜ": {
    "form_group": "horizontal-line-group",
    "form_features": ["horizontal-line", "lower-tick"],
    "description": "A vowel formed by adding a lower tick to the horizontal base vowel ㅡ."
  },

  "ㅠ": {
    "form_group": "horizontal-line-group",
    "form_features": ["horizontal-line", "lower-tick", "double-tick"],
    "description": "A reinforced version of ㅜ, created by doubling the lower tick."
  },

  "ㅘ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "upper-tick", "vertical-line", "right-tick"],
    "description": "A combined vowel formed by merging ㅗ (ㅡ + upper tick) with ㅏ (ㅣ + right tick)."
  },

  "ㅙ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "upper-tick", "vertical-line", "double-vertical-line", "right-tick"],
    "description": "A composite vowel created by merging ㅗ with ㅐ, combining horizontal, vertical, and tick structures."
  },

  "ㅚ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "upper-tick", "vertical-line"],
    "description": "A compound vowel combining ㅗ (horizontal + upper tick) with ㅣ."
  },

  "ㅝ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "lower-tick", "vertical-line", "left-tick"],
    "description": "A compound vowel combining ㅜ (horizontal + lower tick) with ㅓ (vertical + left tick)."
  },

  "ㅞ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "lower-tick", "vertical-line", "double-vertical-line", "left-tick"],
    "description": "A composite vowel formed by merging ㅜ with ㅔ, combining horizontal, vertical, and double-line structures."
  },

  "ㅟ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "lower-tick", "vertical-line"],
    "description": "A compound vowel combining ㅜ (horizontal + lower tick) with ㅣ."
  },

  "ㅢ": {
    "form_group": "combined-line-group",
    "form_features": ["combined-vowel-structure", "horizontal-line", "vertical-line"],
    "description": "A composite structure combining ㅡ (horizontal) with ㅣ (vertical)."
  }
};

const computeSimilarityScore = (target: string, candidate: string) => {


  const targetInfo = isConsonant(target) ? hangulConsonants[target] : hangulVowels[target];
  const candidateInfo = isConsonant(candidate) ? hangulConsonants[candidate] : hangulVowels[candidate];

  if (!targetInfo || !candidateInfo) return -999; // safety fallback

  let score = 0;

  // --- (1) group score ---
  if (targetInfo.form_group === candidateInfo.form_group) {
    score += 2;
  }

  // --- (2) consonant vowel mismatch penalty ---
  if (isConsonant(target) !== isConsonant(candidate)) {
    score -= 1;
  }

  // --- (3) feature overlap score ---
  const tFeatures = new Set(targetInfo.form_features);
  const cFeatures = new Set(candidateInfo.form_features);

  let overlap = 0;
  tFeatures.forEach(f => {
    if (cFeatures.has(f as string)) overlap += 1;
  });

  score += overlap;

  return score;
};

export const calculateDistance = (target: string, elements: string[]) => {
  const scored = elements.map(ch => ({
    char: ch,
    score: computeSimilarityScore(target, ch)
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.map(s => s.char);
};