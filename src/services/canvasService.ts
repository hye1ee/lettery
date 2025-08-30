
import paper from 'paper'
import { colors } from '../constants'

class CanvasService {
  private static instance: CanvasService | null = null
  private project: paper.Project | null = null
  private view: paper.View | null = null

  private constructor() { }

  static getInstance(): CanvasService {
    if (!CanvasService.instance) {
      CanvasService.instance = new CanvasService();
    }
    return CanvasService.instance
  }

  /**
   * Init function to initialize the canvas
   */

  init(canvasId: string) {
    const canvas = document.getElementById(canvasId) as HTMLCanvasElement
    if (!canvas) throw new Error("Canvas element not found");

    paper.setup(canvas);

    this.view = paper.view;
    paper.view.autoUpdate = true;

    this.project = paper.project;

    this.createBackgroundLayer();
  }

  createBackgroundLayer(): void {
    const backgroundLayer = new paper.Layer();
    this.project?.addLayer(backgroundLayer);

    const background = new paper.Path.Rectangle(this.view!.bounds)
    background.fillColor = new paper.Color(colors.lightGray)

    // Create dots
    const dotSize = 2;
    const spacing = 20;

    for (let x = spacing; x < this.view!.bounds.width; x += spacing) {
      for (let y = spacing; y < this.view!.bounds.height; y += spacing) {
        const dot = new paper.Path.Circle(new paper.Point(x, y), dotSize)
        dot.fillColor = new paper.Color(colors.gray)
        backgroundLayer.addChild(dot);
      }
    }
    backgroundLayer.sendToBack();
  }

  setupEventHandlers(handlers: {
    onMouseDown: (event: paper.ToolEvent) => void
    onMouseDrag: (event: paper.ToolEvent) => void
    onMouseUp: (event: paper.ToolEvent) => void
    onMouseMove: (event: paper.ToolEvent) => void
  }): void {
    if (!this.view) throw new Error("view not found");

    this.view.onMouseDown = handlers.onMouseDown
    this.view.onMouseDrag = handlers.onMouseDrag
    this.view.onMouseUp = handlers.onMouseUp
    this.view.onMouseMove = handlers.onMouseMove
  }

  /**
   * Get the current project properties
   */

  getProject(): paper.Project {
    if (!this.project) throw new Error("Project not found");
    return this.project
  }

  getView(): paper.View {
    if (!this.view) throw new Error("View not found");
    return this.view
  }

  getBounds(): paper.Rectangle | null {
    if (!this.view) throw new Error("view not found");
    return this.view.bounds;
  }

  /**
   * Manage the canvas
   */

  importSVG(file: File): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const svgContent = e.target?.result as string
        try {
          // Check if Paper.js is initialized
          if (!this.project) {
            resolve({
              success: false,
              message: 'Paper.js project not initialized'
            })
            return
          }

          // Import SVG
          this.project.importSVG(svgContent)

          resolve({
            success: true,
            message: 'SVG imported successfully'
          })
        } catch (error) {
          resolve({
            success: false,
            message: 'Error importing SVG'
          })
        }
      }

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Failed to read file'
        })
      }

      reader.readAsText(file)
    })
  }

  exportSVG() {
    if (!this.project) throw new Error("Project not found");

    const svgContent = this.project.exportSVG({ asString: true }) as string
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'lettery-sample.svg'
    a.click()

    URL.revokeObjectURL(url)
  }

  clearCanvas(): void {
    this.project?.clear();
    this.createBackgroundLayer();
  }
} export default CanvasService;

