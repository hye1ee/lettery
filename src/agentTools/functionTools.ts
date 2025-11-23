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


export const planTool: ModelBaseTool =
{
  "name": "plan_tool",
  "description": "Plan the geometric transformation of the jamo based on the analysis",
  "properties": {
    "type": "object",
    "required": ["jamo", "syllable", "plan", "reason"],
    "properties": {
      "jamo": { "type": "string", "description": "The jamo to transform" },
      "syllable": { "type": "string", "description": "The parent syllable of the jamo" },
      "plan": { "type": "string", "description": "The transformation plan for the jamo" },
      "reason": { "type": "string", "description": "The reason for the transformation plan" },
    }
  },
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
      "summary": { "type": "string", "description": "Summary of the changes applied" },
    }
  },
};

export const editTool: ModelBaseTool =
{
  "name": "edit_tool",
  "description": "Edit the jamo based on the user's description and the guide path data and return the modified path data",
  "properties": {
    "type": "object",
    "required": ["path", "summary"],
    "properties": {
      "path": { "type": "string", "description": "The modified SVG path data for the jamo" },
      "summary": { "type": "string", "description": "Summary of the changes applied" },
    }
  },
};