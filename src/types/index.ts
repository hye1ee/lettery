
export interface Syllable {
  id: string;
  string: string;
  jamo: string[];
  jamoIds: string[];

}

export type ItemClassName = 'Group' | 'Layer' | 'Path' | 'CompoundPath' | 'Shape' | 'Raster' | 'SymbolItem' | 'PointText';

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
  execute: () => void;
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