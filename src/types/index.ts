
export interface Syllable {
  id: string;
  string: string;
  jamo: string[];
  jamoIds: string[];

}

export type ItemClassName = 'Group' | 'Layer' | 'Path' | 'GuidePath' | 'CompoundPath' | 'Shape' | 'Raster' | 'SymbolItem' | 'PointText';

export type ActionType = 'delete' | 'ungroup' | 'duplicate' | 'rotate' | 'scale' | 'move' | 'edit' | 'select' | 'deselect';

// Drawing state
export interface DrawingState {
  currentDrawing: any | null
  currentPath: any | null
  selectedItems: any[] // Array of selected items
  selectedPoint: any | null
  dragOffset: any | null
  initialDragPositions: any[] // Store initial positions when starting drag
  isDragSelecting: boolean // Whether we're in drag selection mode
  dragSelectionStart: any | null // Starting point of drag selection
}

// Canvas configuration
export interface CanvasConfig {
  dotSize: number
  dotSpacing: number
  backgroundColor: string
  dotColor: string
}

// Event handlers
export interface CanvasEventHandlers {
  onMouseDown: (event: any) => void
  onMouseDrag: (event: any) => void
  onMouseUp: (event: any) => void
  onMouseMove: (event: any) => void
}

// File operations
export interface FileOperationResult {
  success: boolean
  message: string
  error?: Error
  data?: string
}


/* Agent Tools */
export interface AgentTool {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEnabled: boolean;

  activate(): void;
  deactivate(): void;
  setRenderCallback(callback: () => void): void;
}

/* Tools */
export interface Tool {
  id: string;
  shortcut: string;
  cursorStyle: string;

  activate(): void;
  deactivate(): void;

  onMouseDown(event: paper.ToolEvent): void;
  onMouseMove(event: paper.ToolEvent): void;
  onMouseUp(event: paper.ToolEvent): void;
  onMouseDrag(event: paper.ToolEvent): void;
  onDoubleClick?(event: paper.ToolEvent): void;
  onKeyDown?(event: KeyboardEvent): void;
  setToolSwitchCallback?(callback: (toolId: string) => void): void;
  setRenderCallback?(callback: () => void): void;
}

/* Tools for AI models */
export interface ModelBaseTool {
  name: string;
  description: string;
  properties: ModelBaseToolObjectProperty;
}

export type ModelBaseToolPropertyType =
  "object" |
  "string" |
  "number" |
  "boolean" |
  "array";

export type ModelBaseToolProperty =
  ModelBaseToolBaseProperty |
  ModelBaseToolObjectProperty |
  ModelBaseToolNumberProperty |
  ModelBaseToolArrayProperty |
  ModelBaseToolStringProperty;

export interface ModelBaseToolBaseProperty {
  type: ModelBaseToolPropertyType;
  description?: string;
}

export interface ModelBaseToolObjectProperty extends ModelBaseToolBaseProperty {
  type: "object";
  properties: Record<string, ModelBaseToolProperty>;
  required: string[];
}

export interface ModelBaseToolNumberProperty extends ModelBaseToolBaseProperty {
  type: "number";
  minimum?: number;
  maximum?: number;
}

export interface ModelBaseToolArrayProperty extends ModelBaseToolBaseProperty {
  type: "array";
  items?: ModelBaseToolProperty;
  minItems?: number;
  maxItems?: number;
}

export interface ModelBaseToolStringProperty extends ModelBaseToolBaseProperty {
  type: "string";
  enum?: string[];
}

export interface ModelBaseInput {
  role: "assistant" | "user";
  content: string | ModelBaseInputData[];
}

export interface ModelBaseInputData {
  type: "text" | "image";
  data: string;
}