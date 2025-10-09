import paper from "paper";
import { uiService } from ".";
import { logger } from "../helpers";

interface HistoryState {
  json: string;
  action: string;
  activeLayerId: string;
}

class HistoryService {
  private static instance: HistoryService;

  private undoStack: HistoryState[] = [];
  private redoStack: HistoryState[] = [];
  private readonly maxUndos = 80;

  private constructor() {
    document.getElementById("undo")?.addEventListener("click", () => {
      this.undo();
    });

    document.getElementById("redo")?.addEventListener("click", () => {
      this.redo();
    });
  }

  /** Get singleton instance */
  static getInstance(): HistoryService {
    if (!HistoryService.instance) {
      HistoryService.instance = new HistoryService();
    }
    return HistoryService.instance;
  }

  public init(): void {
    document.getElementById("undo")?.classList.add("disabled");
    document.getElementById("redo")?.classList.add("disabled");
  }

  /**
   * Save a snapshot — either as a full state or as a diff
   */
  saveSnapshot(action: string): void {
    const currentJSON = paper.project.exportJSON({ asString: true });
    const activeLayerId = paper.project.activeLayer?.id.toString() || '';

    const state: HistoryState = {
      json: currentJSON,
      activeLayerId: activeLayerId,
      action
    };

    // Only record meaningful changes
    this.undoStack.push(state);
    this.redoStack = []; // clear redo history

    if (this.undoStack.length > this.maxUndos) {
      this.undoStack.shift();
    }

    this.updateButtons();
  }

  private updateButtons(): void {
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");

    if (this.undoStack.length < 2) {
      undoBtn?.classList.add("disabled");
    } else if (this.undoStack.length > 1) {
      undoBtn?.classList.remove("disabled");
    }

    if (this.redoStack.length > 0) {
      redoBtn?.classList.remove("disabled");
    } else if (this.redoStack.length < 1) {
      redoBtn?.classList.add("disabled");
    }
  }


  public undo(): void {
    console.log("Undo");

    if (this.undoStack.length < 2) return;
    const current = this.undoStack.pop();
    if (!current) return;
    this.redoStack.push(current);

    const previous = this.undoStack[this.undoStack.length - 1];
    this.restore(previous);

    this.updateButtons();
    logger.updateStatus(`Undo success`);
  }

  public redo(): void {
    if (this.redoStack.length === 0) return;
    const next = this.redoStack.pop();
    if (!next) return;
    this.undoStack.push(next);
    this.restore(next);

    this.updateButtons();
    logger.updateStatus(`Redo success`);
  }

  private restore(snapshot: HistoryState): void {
    paper.project.clear();
    paper.view.update();
    paper.project.importJSON(snapshot.json);

    // Restore the active layer
    if (snapshot.activeLayerId) {
      const layer = paper.project.getItem({ id: snapshot.activeLayerId });
      if (layer instanceof paper.Layer) layer.activate();
    }

    uiService.renderAll();
    paper.view.update();
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  getHistoryInfo(): { undo: number; redo: number } {
    return { undo: this.undoStack.length, redo: this.redoStack.length };
  }
}

export default HistoryService;