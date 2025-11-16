import type { Tool } from "../types";

/**
 * Manages drawing tools (pen, pencil, select) and their interactions
 */
class ToolService {
  private static instance: ToolService | null = null
  private currentTool: string | null = null;
  private tools: Map<string, Tool> = new Map();
  private buttons: Map<string, HTMLButtonElement> = new Map();
  private renderCallback: (() => void) | null = null;

  private constructor() { }

  /**
   * Get the singleton instance
   */
  static getInstance(): ToolService {
    if (!ToolService.instance) {
      ToolService.instance = new ToolService()
    }
    return ToolService.instance
  }

  setRenderCallback(callback: () => void): void {
    this.renderCallback = callback;
  }

  /**
   * Initialize all tools
   */
  initTools(tools: Tool[]): void {

    const keys = new Map<string, string>();
    tools.forEach((tool) => {
      this.tools.set(tool.id, tool);

      // Set up tool switch callback for tools that support it
      if (tool.setToolSwitchCallback) {
        tool.setToolSwitchCallback(this.switchTool);
      }

      if (tool.setRenderCallback && this.renderCallback) {
        tool.setRenderCallback(this.renderCallback);
      }

      const button = document.getElementById(`${tool.id}-tool`) as HTMLButtonElement
      if (button) {
        button.addEventListener('click', () => {
          this.switchTool(tool.id);
        })
        this.buttons.set(tool.id, button);
      }
      keys.set(tool.shortcut, tool.id);


    })
    // set up key event handler
    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const tool = keys.get(key);
      if (tool) {
        this.switchTool(tool);
      }
    })

    // initialize with the first tool
    this.switchTool(tools[0].id);
  }

  /**
   * Switch to a different tool
   */
  switchTool = (tool: string): void => {
    if (this.currentTool === tool) return;

    if (this.currentTool) {
      const currentToolInstance = this.tools.get(this.currentTool);
      // Pass the next tool ID to deactivate if the tool supports it
      if (currentToolInstance && (currentToolInstance as any).deactivateWithNextTool) {
        (currentToolInstance as any).deactivateWithNextTool(tool);
      } else {
        currentToolInstance?.deactivate();
      }
      // Change SVG back to non-fill version
      const currentButton = this.buttons.get(this.currentTool);
      const currentImg = currentButton?.querySelector('img');
      if (currentImg && currentImg.src) {
        currentImg.src = currentImg.src.replace('-fill.svg', '.svg');
      }
    }
    this.currentTool = tool;

    this.tools.get(tool)?.activate();
    // Change SVG to fill version
    const activeButton = this.buttons.get(tool);
    const activeImg = activeButton?.querySelector('img');
    if (activeImg && activeImg.src) {
      activeImg.src = activeImg.src.replace('.svg', '-fill.svg');
    }
  }

  selectItem(item: paper.Item): void {
    if (!this.currentTool) return;

    const currentToolInstance = this.tools.get(this.currentTool);
    if (currentToolInstance && (currentToolInstance as any).selectItem) {
      (currentToolInstance as any).selectItem(item);
    }
  }

  /**
   * Get the current tool instance
   */
  getCurrentTool(): Tool | null {
    if (!this.currentTool) return null;
    return this.tools.get(this.currentTool) || null;
  }

  /**
   * Get the current tool ID
   */
  getCurrentToolId(): string | null {
    return this.currentTool;
  }

  getEventHandlers(): {
    onMouseDown: (event: paper.ToolEvent) => void;
    onMouseDrag: (event: paper.ToolEvent) => void;
    onMouseUp: (event: paper.ToolEvent) => void;
    onMouseMove: (event: paper.ToolEvent) => void;
    onDoubleClick: (event: paper.ToolEvent) => void;
    onKeyDown: (event: KeyboardEvent) => void;
  } {
    return {
      onMouseDown: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool && activeTool.onMouseDown) {
          activeTool.onMouseDown(event);
        }
      },
      onMouseDrag: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool && activeTool.onMouseDrag) {
          activeTool.onMouseDrag(event);
        }
      },
      onMouseUp: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool && activeTool.onMouseUp) {
          activeTool.onMouseUp(event);
        }
      },
      onMouseMove: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool && activeTool.onMouseMove) {
          activeTool.onMouseMove(event);
        }
      },
      onDoubleClick: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool && activeTool.onDoubleClick) {
          activeTool.onDoubleClick(event);
        }
      },
      onKeyDown: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool && activeTool.onKeyDown) {
          activeTool.onKeyDown(event);
        }
      }
    };
  }



}

export default ToolService;



