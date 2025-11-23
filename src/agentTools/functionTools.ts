import type { ModelBaseTool } from "../types";

export const propagationAnalysisTool: ModelBaseTool = {
  "name": "propagation_analysis_tool",
  "description": "Analyze geometric and semantic transformation of the target jamo and recommend a propagation range across structurally similar jamo.",
  "properties": {
    "type": "object",
    "required": ["geometric_analysis", "semantic_analysis", "reasoning", "recommendedIndex"],
    "properties": {
      "geometric_analysis": {
        "type": "string",
        "description": "A precise geometric analysis comparing the reference jamo and the transformed jamo. Describe structural, proportional, and stroke-level changes."
      },
      "semantic_analysis": {
        "type": "string",
        "description": "An interpretation of the expressive or emotional intent behind the geometric transformation."
      },
      "reasoning": {
        "type": "string",
        "description": "Explain, in polite and friendly Korean honorific language, why this propagation index is appropriate. The explanation should be concise."
      },
      "recommendedIndex": {
        "type": "number",
        "description": "Inclusive index boundary for propagation. For example, if recommendedIndex = 3, the transformation MUST propagate to elements[0], elements[1], elements[2], and elements[3] (four elements in total)."
      }
    }
  }
};


export const planTool: ModelBaseTool = {
  "name": "plan_tool",
  "description": "Plan the geometric transformation of the jamo based on the analysis",
  "properties": {
    "type": "object",
    "required": ["jamo", "syllable", "plan", "plan_summary", "reason"],
    "properties": {
      "jamo": {
        "type": "string",
        "description": "The jamo to transform."
      },
      "syllable": {
        "type": "string",
        "description": "The parent syllable of the jamo."
      },
      "plan": {
        "type": "string",
        "description": "A detailed geometric transformation plan for the jamo, including concrete numeric values (e.g., coordinates, offsets, angles, lengths). Do NOT include any semantic or emotional interpretation; focus only on how to modify the vector paths."
      },
      "plan_summary": {
        "type": "string",
        "description": "Write a short transformation summary in Korean, containing no more than 15 words, describing the core geometric change concisely."
      },
      "reason": {
        "type": "string",
        "description": "Write the justification in Korean, containing no more than 10 words, and concisely explain why this transformation is appropriate."
      }
    }
  }
};



export const executionTool: ModelBaseTool =
{
  "name": "execution_tool",
  "description": "Execute the transformation and return the modified path data",
  "properties": {
    "type": "object",
    "required": ["path", "summary", "jamo"],
    "properties": {
      "jamo": { "type": "string", "description": "The jamo that was transformed" },
      "path": { "type": "string", "description": "The modified SVG path data for the jamo" },
      "summary": { "type": "string", "description": "Very short summary of the changes applied within 10 words" },
    }
  },
};

export const editTool: ModelBaseTool = {
  "name": "edit_tool",
  "description": "Edit the jamo based on the guide sketch and return the updated SVG path data.",
  "properties": {
    "type": "object",
    "required": ["path"],
    "properties": {
      "path": {
        "type": "string",
        "description": "The final updated SVG path reflecting the guide sketch with clean, professional vector geometry."
      }
    }
  }
};
