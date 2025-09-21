class Cursor {
  private static instance: Cursor | null = null;
  private currentCursor: string = 'default';
  private cursorElement: HTMLSpanElement | null = null;

  private constructor() { }

  static getInstance(): Cursor {
    if (!Cursor.instance) {
      Cursor.instance = new Cursor();
    }
    return Cursor.instance;
  }

  init(cursorElement: HTMLSpanElement): void {
    this.cursorElement = cursorElement;
  }

  updateCursor(cursor: string): void {
    if (this.currentCursor === cursor) return;

    this.currentCursor = cursor;
    if (this.cursorElement) {
      this.cursorElement.style.cursor = cursor;
    }
  }

  getCurrentCursor(): string {
    return this.currentCursor;
  }

  resetCursor(): void {
    this.updateCursor('default');
  }
}

export default Cursor;
