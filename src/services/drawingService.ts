import paper from 'paper'
import { colors } from '../utils/styles'
import type { DrawingState } from '../types'

class DrawingService {
  private static instance: DrawingService | null = null
  private state: DrawingState = {
    currentPath: null,
    selectedPath: null,
    selectedPoint: null
  }
  private onSelectionChange: ((itemId: string, selected: boolean) => void) | null = null

  private constructor() { }

  /**
   * Get the singleton instance
   */
  static getInstance(): DrawingService {
    if (!DrawingService.instance) {
      DrawingService.instance = new DrawingService()
    }
    return DrawingService.instance
  }

  /**
   * Get current drawing state
   */
  getState(): DrawingState {
    return { ...this.state }
  }

  /**
   * Set selection change callback
   */
  setSelectionChangeCallback(callback: (itemId: string, selected: boolean) => void): void {
    this.onSelectionChange = callback;
  }

  /**
   * Start drawing a new path
   */
  startDrawing(point: paper.Point): paper.Path | null {
    try {
      if (!paper.project) {
        throw new Error('Paper.js project not initialized')
      }

      this.state.currentPath = new paper.Path()
      this.state.currentPath.strokeColor = new paper.Color(colors.black)
      this.state.currentPath.strokeWidth = 1
      this.state.currentPath.add(point)

      return this.state.currentPath
    } catch (error) {
      console.error('Error starting drawing:', error)
      return null
    }
  }

  /**
   * Continue drawing the current path
   */
  continueDrawing(point: paper.Point): boolean {
    if (this.state.currentPath) {
      this.state.currentPath.add(point)
      return true
    }
    return false
  }

  /**
   * Finish drawing the current path
   */
  finishDrawing(point: paper.Point): boolean {
    if (this.state.currentPath) {
      this.state.currentPath.add(point)
      this.smoothPath(this.state.currentPath)
      this.state.currentPath = null
      return true
    }
    return false
  }

  /**
   * Smooth a path
   */
  smoothPath(path: paper.Path): void {
    if (path && path.segments.length > 2) {
      path.smooth()
    }
  }

  /**
   * Select a path
   */
  selectPath(path: paper.PathItem): void {
    this.deselectAll()
    this.state.selectedPath = path
    path.selected = true;
    path.strokeColor = new paper.Color(colors.primary)
    path.strokeWidth = 2

    // Notify UI service about selection
    if (path.id && this.onSelectionChange) {
      this.onSelectionChange(path.id.toString(), true);
    }
  }

  /**
   * Deselect a path
   */
  deselectPath(path: paper.PathItem): void {
    path.strokeColor = new paper.Color(colors.black)
    path.strokeWidth = 1

    // Notify UI service about deselection
    if (path.id && this.onSelectionChange) {
      this.onSelectionChange(path.id.toString(), false);
    }
  }

  /**
   * Select a point
   */
  selectPoint(point: paper.PathItem): void {
    this.deselectAll()
    this.state.selectedPoint = point
    point.fillColor = new paper.Color(colors.error)
  }

  /**
   * Deselect a point
   */
  deselectPoint(point: paper.PathItem): void {
    point.fillColor = new paper.Color(colors.black)
  }

  /**
   * Deselect all items
   */
  deselectAll(): void {
    if (this.state.selectedPath) {
      this.deselectPath(this.state.selectedPath)
      this.state.selectedPath.selected = false;
      this.state.selectedPath = null
    }

    if (this.state.selectedPoint) {
      this.deselectPoint(this.state.selectedPoint)
      this.state.selectedPoint.selected = false;
      this.state.selectedPoint = null
    }

    // Clear all selections in UI
    if (this.onSelectionChange) {
      this.onSelectionChange('', false); // Empty string indicates clear all
    }
  }

  /**
   * Move a selected point
   */
  moveSelectedPoint(point: paper.Point): void {
    if (this.state.selectedPoint) {
      this.state.selectedPoint.position = point;
    }
    if (this.state.selectedPath) {
      this.state.selectedPath.position = point;
    }
  }

  /**
   * Add a point to an existing path
   */
  addPointToPath(path: paper.Path, point: paper.Point): paper.Segment | null {
    try {
      const segment = path.getNearestLocation(point)

      if (segment) {
        const newSegment = path.insert(segment.index + 1, point)

        // Create a visual indicator for the new point
        const pointIndicator = new paper.Path.Circle(newSegment.point, 10)
        pointIndicator.fillColor = new paper.Color(colors.error)
        pointIndicator.strokeColor = new paper.Color(colors.warning)
        pointIndicator.strokeWidth = 1

        return newSegment
      }
    } catch (error) {
      console.error('Error adding point to path:', error)
    }

    return null
  }

  /**
   * Create a rectangle
   */
  createRectangle(point: paper.Point, size: paper.Size): paper.Path | null {
    try {
      if (!paper.project) {
        throw new Error('Paper.js project not initialized')
      }

      const rect = new paper.Path.Rectangle(point, size)
      rect.strokeColor = new paper.Color(colors.black)
      rect.strokeWidth = 1
      rect.fillColor = new paper.Color(colors.lightGray)

      return rect
    } catch (error) {
      console.error('Error creating rectangle:', error)
      return null
    }
  }

  /**
   * Create a circle
   */
  createCircle(center: paper.Point, radius: number): paper.Path | null {
    try {
      if (!paper.project) {
        throw new Error('Paper.js project not initialized')
      }

      const circle = new paper.Path.Circle(center, radius)
      circle.strokeColor = new paper.Color(colors.black)
      circle.strokeWidth = 1
      circle.fillColor = new paper.Color(colors.info)

      return circle
    } catch (error) {
      console.error('Error creating circle:', error)
      return null
    }
  }

  /**
   * Get hit test result at a point
   */
  hitTest(point: paper.Point, options?: any): paper.HitResult | null {
    if (!paper.project) {
      return null
    }

    return paper.project.hitTest(point, options)
  }
}

export default DrawingService;
