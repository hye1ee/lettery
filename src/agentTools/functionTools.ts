import type { ModelBaseTool } from "../types";

export const analysisTool: ModelBaseTool =
{
  "name": "analysis_tool",
  "description": "Analyze the geometric and semantic transformation of the jamo based on the reference jamo and the target jamo's path data",
  "properties": {
    "type": "object",
    "required": ["geometric_analysis", "semantic_analysis", "summary"],
    "properties": {
      "geometric_analysis": { "type": "string", "description": "The geometric analysis of the jamo based on the reference jamo and the target jamo's path data" },
      "semantic_analysis": { "type": "string", "description": "The semantic analysis of the jamo based on the reference jamo and the target jamo's path data" },
      "summary": { "type": "string", "description": "The summary of the analysis based on the geometric and semantic analysis" },
    }
  },
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