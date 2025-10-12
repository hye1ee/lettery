import paper from "paper";
import { uiService } from ".";
import { logger } from "../helpers";

interface HistoryState {
  json: string;
  action: string;
  activeLayerId: string;
  data: string[];
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

    const data: string[] = paper.project.activeLayer?.children.filter(
      item => item instanceof paper.PathItem)
      .map(item => item.pathData) || [];

    // Only record meaningful changes
    this.undoStack.push({ json: currentJSON, activeLayerId: activeLayerId, action, data });
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

  getHistoryData(id?: string): string[][] {
    const layerId = id || paper.project.activeLayer?.id.toString() || '';
    if (!layerId) throw new Error('Layer ID is required');

    // 0) only consider state with data
    const dataStates = this.undoStack.filter(state => state.data.length > 0);

    const ranges: [number, number][] = [];
    let start = -1;

    // 1) Scan stack and collect consecutive ranges [start, end] for target layerId
    for (let i = 0; i < dataStates.length; i++) {
      const isMatch = dataStates[i].activeLayerId === layerId;

      if (isMatch) {
        if (start === -1) start = i; // open range
      } else if (start !== -1) {
        ranges.push([start, i - 1]); // close range
        start = -1;
      }
    }

    // ✅ fix: close last open range correctly (end = last index)
    if (start !== -1) ranges.push([start, dataStates.length - 1]);
    if (!ranges.length) return [];

    // 2) If multiple ranges, take each range's end; if single range, take [start, end]
    const pickIndices =
      ranges.length >= 2 ? ranges.map(r => r[1]) : [ranges[0][0], ranges[0][1]];

    // 3) Map indices → data, keep last 4, then reverse order
    return pickIndices.map(i => dataStates[i].data).slice(-4).reverse();
  }



  getHistoryInfo(): { undo: number; redo: number } {
    return { undo: this.undoStack.length, redo: this.redoStack.length };
  }
}

export default HistoryService;