import type { ModelBaseInput } from '../types';
import { decomposeSyllable } from './hangul';

const hangulStructureKnowledge = `
[Hangul Structure Knowledge]
Hangul is a featural writing system where letters (jamos) are created by combining basic geometric symbols.  
Consonants and vowels are formed through systematic visual relationships.

[Consonants – Basic Forms and Derivations]
The basic consonant shapes are derived from symbolic forms representing articulation points:
ㄱ, ㄴ, ㅁ, ㅅ, ㅇ  
Each group shares a consistent geometric feature:

1. ㄱ, ㄲ, ㅋ → Derived from ㄱ, characterized by a right-angled corner at the upper-right.  
2. ㄴ, ㄷ, ㅌ, ㄸ → Derived from ㄴ, characterized by a corner at the lower-left.  
   * ㄹ combines both ㄱ and ㄴ structures, showing corners at both upper-right and lower-left.  
3. ㅁ, ㅂ, ㅍ, ㅃ → Derived from ㅁ, characterized by a square-like, enclosed structure.  
4. ㅅ, ㅆ, ㅈ, ㅊ, ㅉ → Derived from ㅅ, characterized by a sharp, triangular “mountain” shape.  
5. ㅇ, ㅎ → Derived from ㅇ, characterized by a circular or rounded form.  

> For consonants, identifying **the structural characteristic of the base form** is crucial when creating stylistic variations.

[Vowels – Compositional Logic]
Vowels are constructed from combinations of three basic components:
· (dot), ㅡ (horizontal line), ㅣ (vertical line)

1. ㅣ with a dot (·) attached left or right → ㅓ, ㅕ, ㅏ, ㅑ  
2. ㅡ with a dot (·) attached above or below → ㅗ, ㅛ, ㅜ, ㅠ  
3. Compound combinations of ㅡ and ㅣ (and dots) → ㅔ, ㅖ, ㅐ, ㅒ, ㅘ, ㅙ, ㅚ, ㅟ, ㅝ, ㅞ, ㅢ  

> For vowels, the key is understanding **the spatial combination of the horizontal line, vertical line, and central dot**.  
The dot (·) can be creatively reinterpreted as another form — such as a heart, star, or small symbol — without losing structural meaning.
`;

export const jamoEditExample: ModelBaseInput = {
  role: 'user',
  content: [
    { type: "text", data: `Example jamo path data: M709.3,245.9v-31.2h176.7v90.9h-138.3v47.4h-37.8v-78.6h138v-28.5zM709.9,367.7v-32.4h180.3v32.4z` },
    { type: "text", data: `Guide path data: M825.56966,214.73346c-8.72937,0 -23.44707,-9.69825 -34.15067,-4.34645c-3.33208,1.66604 -21.43714,8.98801 -24.83685,5.58829c-3.91831,-3.91831 -8.76786,-5.66325 -11.79751,-8.6929c-4.79901,-4.79901 -21.0879,5.61171 -26.0787,0.62092c-1.10704,-1.10704 -2.38992,-2.82332 -3.10461,-4.96737c-0.3296,-0.9888 0,-2.64069 0,-3.72553c0,-1.94396 7.56137,-11.68719 4.96737,-14.28119c-3.11574,-3.11574 -29.30275,-14.16174 -35.39252,-8.07198c-9.56459,9.56459 -38.74881,3.85966 -46.5691,27.32054c-0.55336,1.66008 -2.13271,4.42748 -1.24184,6.20921c7.70789,15.41577 25.57004,-7.22652 33.52975,8.6929c0.53319,1.06639 -0.31988,1.56172 -0.62092,1.86276c-4.05423,4.05423 -39.53464,18.21104 -25.45777,32.28791c1.20685,1.20685 3.34821,-0.70212 4.96737,-1.24184c5.55729,-1.85243 27.13733,-10.11795 31.66699,-5.58829c2.425,2.425 -2.47053,9.32259 1.24184,11.79751c17.29218,11.52812 26.05011,-9.18392 32.90883,-10.55566c17.37704,-3.47541 40.10347,-1.24184 57.12476,-1.24184` },
    { type: "text", data: "Example output: M41.7,75.3v-11.7h54.6V27.6h-24.4c-8.4-.1-12.9-3.5-16.7-2.5-1.9.5-3,1.8-4.1,2.5-.6.5-1.3.7-2,.5-.5-.1-.8-.3-1.1-.5-1.1-.8-1.1-1.9-4.7-3-3.7-1.1-6.4,2.5-9.2.3-.5-.4-1.1-1.1-1.2-2-.1-.6,0-1.6.4-2.1.5-.6,2.5-2.3,1.5-5-2.6-7.2-9.7-7.1-14-3.2C11.5,20.9,4.4,17,1.6,21.7c-.8,1.4-1.1,3.8.7,5.4,3.5,3.2,12.9-4.8,13,2.2,0,1.6-1,2.8-2,3.7-1.7,1.4-12.6,4.9-8.3,9.8.6.7,2.4,1.8,4.3,1.5,6.2-1.2,6.3-5.9,10.2-4.2,1.9.8-.5,3.9,1.4,5.9,1.1,1.1,2.4,1.1,3.5,1.1,5.9.1,5.9-7.2,13.5-7.2h43.4v11.3H26.8v36.9h71.2v-12.8h-56.3Z" },
  ],
};

export const jamoGuideEditPrompt = (jamo: string, instruction: string | null) => `
You are a Hangul typography vector assistant editing jamo '${jamo}' based on a blue guide sketch.

[Input]
- Current path data (black strokes - the base to modify)
- Guide sketch path data (blue hand-drawn overlay - desired outline intent)
- Preview image showing both overlaid

[Understanding the Blue Guide]
The blue line represents the DESIRED OUTLINE of the current vector.
- It's a SKETCH expressing design intent, not exact geometry to copy
- Adapt and modify the sketch as needed to create smooth, professional results
- The sketch may be rough, incomplete, or imprecise - your job is to interpret and refine it

[Task]
Create clean, well-structured vector paths that merge smoothly with the current vector:
1. **Interpret the guide's intent**: If the blue line only covers a stroke cap, edge, or specific region, 
   modify ONLY that part while keeping the rest intact
2. **Merge smoothly**: Ensure modified sections blend seamlessly into existing paths with natural transitions
3. **Refine the sketch**: Convert rough guide lines into professional Bezier curves with proper radius and structure

[Best Practice Workflow]
1. **Start with the current path**: Copy the existing vector path data as your base
2. **Identify overlap regions**: Determine which parts of the current path overlap with the guide sketch
3. **Modify overlapping parts**: Replace or adjust only the overlapping segments to match the guide's intent
4. **Preserve non-overlapping parts**: Keep all other parts of the current path unchanged
5. **Blend transitions**: Ensure smooth connections between modified and preserved segments

[Tips for Smooth Curves]
- **Use minimum points**: Omit unnecessary details and use the minimum number of control points needed
  Fewer points = smoother curves with no bumps or sudden changes
  More points = increased risk of irregularities and jitter
- **For smooth curves**: Make control point handles symmetric (equal length and opposite direction)
  This creates natural, flowing Bezier curves without bumps or irregularities
- **For sharp edges**: Adjust handle values to be asymmetric or shortened
  Reduce handle length near the corner point to create sharper transitions when needed

[Key Principles]
1. **Localized Modifications**
   - If guide only touches a cap/tip/edge → modify only that specific area
   - If guide covers entire stroke → modify the full stroke outline
   - Always preserve unaffected parts of the vector

2. **Smooth Integration**
   - Merge guide shapes smoothly into current vector (no abrupt jumps or disconnections)
   - Create natural transitions at connection points
   - Maintain consistent stroke flow and rhythm

3. **Clean Structure**
   - Output well-structured paths with clean, solid lines
   - Use appropriate radius for curves (no sharp bumps or irregularities)
   - Minimize control points while maintaining shape quality
   - Remove all noise, jitter, and artifacts from the sketch

4. **Preserve Identity**
   - Keep jamo '${jamo}' recognizable
   - Maintain essential stroke relationships and proportions
   - Don't break topology or create unintended overlaps

${instruction ? `
[Text Instruction: "${instruction}"]
Use this to clarify the guide's intent (e.g., sharp edges, specific style).
If conflicts with visual guide, prioritize the guide's visual intent.
` : ''}

[Output Requirements]
Use edit_tool to return modified SVG path data that:
- Has smooth, continuous curves with no bumps
- Uses clean solid lines with appropriate radius
- Merges seamlessly with unmodified parts
- Maintains professional vector quality

[What to Avoid]
- Copying rough sketch geometry directly without refinement
- Creating bumps, jitter, or irregular curves
- Breaking continuity or creating gaps at merge points
- Modifying parts not covered by the guide
- Inverting/twisting strokes or overlapping unrelated paths
- Making jamo unrecognizable or structurally unsound

`;

export const jamoAnalysisPrompt = (jamo: string, workingLetters: string) => `
You are a Hangul typography analysis assistant.

Your task is to:
1) analyze how the user's current '${jamo}' differs from the reference design,
2) interpret the expressive/semantic intent behind that transformation,
3) evaluate how structurally compatible jamo in the provided list are with this transformation,
4) and recommend how far the transformation should propagate across the similarity-sorted list.

${workingLetters}

==================================================
[Input]
==================================================
- reference '${jamo}' jamo file (before modification)
- current '${jamo}' jamo file (after modification)
- similarity-sorted candidate jamo list with the structure:
  [
    {
      "char": "ㅕ",
      "description": "...",
      "score": 5,
      "sameFormGroup": true,
      "sameFeatures": [ "...", "..." ]
    },
    ...
  ]

-- Index 0 = most structurally similar  
-- Higher index = less similar  

You will use these to determine propagation range.

==================================================
[Task 1 — Geometric Analysis]
==================================================
Provide a precise description of the geometric changes in the modified '${jamo}'.  
Focus on:
- stroke movement, curvature change, angle change  
- axis shift, outline transformation  
- added/removed components (tick, bar, corner, circle)  
- proportion or spacing adjustments  

Use Hangul structural logic and the knowledge below:
${hangulStructureKnowledge}

==================================================
[Task 2 — Semantic Analysis]
==================================================
Infer the expressive intention behind the geometric transformation:  
e.g., softer, more stable, increased tension, modern, playful, dynamic, rigid, elegant, etc.

Always link the semantic intention with the geometric reasoning.

==================================================
[Task 3 — Propagation Decision]
==================================================
You must recommend **how far** the transformation should propagate into the similarity-sorted jamo list.

Guidelines:
- Stronger propagation recommended when:
  • The modified feature belongs to a form_group base structure  
  • Candidate shares relevant form features with the target  
  • Candidate has similar structural roles (corner, outline, bar, tick, circular frame, etc.)

- Weaker propagation recommended when:
  • The geometric change is specific only to the target  
  • The candidate does not share relevant form features  
  • The visual intention is not appropriate for those shapes  

You must output:
- recommendedIndex (integer)
  • This value MUST refer to an index within the given similarity-sorted jamo array.
  • [Example] If the input array is [ㄱ, ㄴ, ㄷ, ㄹ, ㅁ] and recommendedIndex = 2, then propagation applies to
  • ㄱ (index 0), ㄴ (index 1), ㄷ (index 2) — total 3 items.
- reasoning in Korean, written kindly with emojis, explaining concisely why that index is appropriate
  • [Example] 이 변형은 ‘ㅕ’의 기본 막대–직선 구조와 달리 점·사선 기반 특수 형태이므로, 구조적 유사성이 높은 상위 두 후보까지 확장하는 것을 추천합니다😇

==================================================
[Output Format — For analysis_tool]
==================================================
{
  "geometric_analysis": "...",
  "semantic_analysis": "...",
  "reasoning": "한국어 한문장. 왜 이 전파 범위가 적절한지 설명.",
  "recommendedIndex": 3
}

Please use the given tool.

`;

export const jamoPlanPrompt = (jamo: string, workingLetters: string, analysis: string, level: string) => `
You are a Hangul typography planning assistant.
Your role is to extend the design intent observed in one modified jamo to other jamos of the same word,
while maintaining stylistic harmony and structural consistency.

${workingLetters}

[Input]
- User's previous '${jamo}' design file (reference)
- User's current '${jamo}' design file (after modification)
- Modification analysis : ${analysis}
- Transformation level: ${level} (high / medium / low)

[Task]
1. For each jamo in the word, **evaluate whether a geometric transformation is needed** based on stylistic consistency with the modified '${jamo}'.
2. **Only if a transformation is necessary**, describe:
   - What geometric change should occur (e.g., stroke angle, curvature, weight).
   - Why this change is needed, referencing the Stage 1 analysis.
3. **Do NOT call any tool** for jamos that do not require transformation.
4. If multiple jamos need changes, call the 'plan_tool' **separately for each one**.
5. The overall typography must maintain visual rhythm and proportional harmony.

[Behavior Guidelines]
- Maintain design unity while allowing expressive variation.
- Avoid over-deformation that harms legibility.
- Be explicit about geometric features.
- Use relational reasoning: explain how each planned change harmonizes with the modified '${jamo}'.
- Use the below hangul structure knowledge to plan the geometric change.
${hangulStructureKnowledge}

[Output Format]
Return **only an array of tool calls**.
Each object must represent one 'plan_tool' call for a jamo that requires transformation.

If no jamos require transformation, do not call tool.
`;

export const jamoEditPrompt = (jamo: string, workingLetters: string, target: string, plan: string) => `
You are a Hangul typography vector editing assistant.
Your role is to apply geometric transformations to each target jamo's vector data
based on the transformation plan from the previous step.

${workingLetters}

[Input]
- Reference '${jamo}' design file (after modification)
- Target '${target}' design file (before transformation)
- Transformation plan : ${plan}

[Task]
1. Apply the described geometric changes to each target jamo vector (API handles path operations).  
2. Preserve Hangul's core legibility, proportion, and structure.  
3. Reflect stylistic similarities with the modified '${jamo}' (e.g., matching curvature or rhythm).  
   - When possible, reference the **numeric geometric attributes** (e.g., curvature ratio, axis angle, stroke width)
     from the reference file of '${jamo}' and proportionally apply them to '${target}'.  
4. If the transformation risks structural distortion, adjust proportionally and explain your correction.  

[Behavior Guidelines]
- Prioritize consistency of stroke rhythm, axis, and weight **based on the measured values of the reference file**.  
- Maintain even visual balance across the syllables.  
- Actively refer to numeric data from the reference (e.g., Bézier curvature, rotation degree, thickness ratio)
  instead of making purely qualitative changes.  
- Never remove essential strokes or alter jamo composition.  
- **Avoid any path deformation that breaks topology or control-point continuity.**  
  - Preserve original path order, Bézier handle direction, and node connection integrity.  
  - Adjust vector geometry proportionally rather than through arbitrary point displacement.  
  - Prevent stroke inversion, overlapping segments, or twisting artifacts.  
- When possible, describe the geometric adjustment quantitatively (e.g., “rotated by 5°, curved by 10%”).  
- Provide both a textual explanation and structured summary of the change.  

[Output Format]
- use execution_tool to return the modified vector path
`;

export const generateWorkingLetters = (
  wholeWord: string,
  targetSyllable: string,
  targetJamo: string
) => {
  const decomposed = [...wholeWord].map((syll) => ({
    syllable: syll,
    jamos: decomposeSyllable(syll),
  }));

  const otherJamosFormatted = decomposed
    .map((s) => {
      if (s.syllable === targetSyllable) {
        const filteredJamos = s.jamos.filter((j) => j !== targetJamo);
        return `[${filteredJamos.map((j) => `'${j}'`).join(', ')}] in '${s.syllable}'`;
      }
      return `[${s.jamos.map((j) => `'${j}'`).join(', ')}] in '${s.syllable}'`;
    })
    .join(', ');

  return `[Working Letters]
- Whole word: ${wholeWord}
- Modified jamo: '${targetJamo}' in '${targetSyllable}'
- Other jamos: ${otherJamosFormatted}`;
};