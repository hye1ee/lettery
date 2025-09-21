import type { Tool } from '../tools'

class ToolService {
  private static instance: ToolService | null = null
  private currentTool: string | null = null;
  private tools: Map<string, Tool> = new Map();
  private buttons: Map<string, HTMLButtonElement> = new Map();


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

  /**
   * Initialize all tools
   */
  initTools(tools: Tool[]): void {

    const keys = new Map<string, string>();
    tools.forEach((tool) => {
      this.tools.set(tool.id, tool);

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
   * Get the currently active tool instance
   */
  getActiveTool(): any {
    return this.currentTool;
  }
  /**
   * Switch to a different tool
   */
  switchTool = (tool: string): void => {
    if (this.currentTool === tool) return;

    if (this.currentTool) {
      this.tools.get(this.currentTool)?.deactivate();
      this.buttons.get(this.currentTool)?.classList.remove('active');
    }
    this.currentTool = tool;

    this.tools.get(tool)?.activate();
    this.buttons.get(tool)?.classList.add('active');
  }

  getEventHandlers(): {
    onMouseDown: (event: paper.ToolEvent) => void;
    onMouseDrag: (event: paper.ToolEvent) => void;
    onMouseUp: (event: paper.ToolEvent) => void;
    onMouseMove: (event: paper.ToolEvent) => void;
  } {
    return {
      onMouseDown: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool) {
          activeTool.onMouseDown(event);
        }
      },
      onMouseDrag: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool) {
          activeTool.onMouseDrag(event);
        }
      },
      onMouseUp: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool) {
          activeTool.onMouseUp(event);
        }
      },
      onMouseMove: (event) => {
        const activeTool = this.tools.get(this.currentTool!);
        if (activeTool) {
          activeTool.onMouseMove(event);
        }
      },
    };
  }



}

export default ToolService;



