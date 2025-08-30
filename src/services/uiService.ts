import type { ToolType } from '../types'

class UIService {
  private static instance: UIService | null = null
  private statusElement: HTMLSpanElement | null = null
  private coordinatesElement: HTMLSpanElement | null = null
  private toolButtons: Map<ToolType, HTMLButtonElement> = new Map()

  private constructor() { }

  /**
   * Get the singleton instance
   */
  static getInstance(): UIService {
    if (!UIService.instance) {
      UIService.instance = new UIService()
    }
    return UIService.instance
  }

  /**
   * Initialize UI service with DOM elements
   */
  initialize(
    statusElement: HTMLSpanElement,
    coordinatesElement: HTMLSpanElement,
    toolButtons: Map<ToolType, HTMLButtonElement>
  ): void {
    this.statusElement = statusElement
    this.coordinatesElement = coordinatesElement
    this.toolButtons = toolButtons
  }

  /**
   * Update status message
   */
  updateStatus(message: string): void {
    if (this.statusElement) {
      this.statusElement.textContent = message
    }
    console.log('Status:', message)
  }

  /**
   * Update coordinates display
   */
  updateCoordinates(x: number, y: number): void {
    if (this.coordinatesElement) {
      this.coordinatesElement.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`
    }
  }

  /**
   * Update tool button states
   */
  updateToolButtonStates(activeTool: ToolType): void {
    this.toolButtons.forEach((button, tool) => {
      button.classList.toggle('active', tool === activeTool)
    })
  }

  /**
   * Update cursor style for a tool
   */
  updateCursor(tool: ToolType): void {
    const canvas = document.getElementById('vector-canvas') as HTMLCanvasElement
    if (canvas) {
      switch (tool) {
        case 'select':
          canvas.style.cursor = 'default'
          break
        case 'pen':
          canvas.style.cursor = 'crosshair'
          break
        case 'addPoint':
          canvas.style.cursor = 'pointer'
          break
        default:
          canvas.style.cursor = 'default'
      }
    }
  }

  /**
   * Show tool tip
   */
  showTooltip(message: string, x: number, y: number): void {
    // Remove existing tooltip
    this.hideTooltip()

    const tooltip = document.createElement('div')
    tooltip.className = 'tooltip'
    tooltip.textContent = message
    tooltip.style.left = `${x}px`
    tooltip.style.top = `${y}px`
    tooltip.style.position = 'absolute'
    tooltip.style.zIndex = '10000'

    document.body.appendChild(tooltip)

    // Auto-hide after 3 seconds
    setTimeout(() => this.hideTooltip(), 3000)
  }

  /**
   * Hide tooltip
   */
  hideTooltip(): void {
    const existingTooltip = document.querySelector('.tooltip')
    if (existingTooltip) {
      existingTooltip.remove()
    }
  }

  /**
   * Show loading state
   */
  showLoading(message: string = 'Initializing'): void {
    this.updateStatus(message)
    // You could add a loading spinner here
  }

  /**
   * Hide loading state
   */
  hideLoading(message: string = 'Ready'): void {
    this.updateStatus(message)
    // Remove loading spinner here
  }

  /**
   * Show error message
   */
  showError(message: string): void {
    this.updateStatus(`Error: ${message}`)
    // You could add error styling here
  }

  /**
   * Show success message
   */
  showSuccess(message: string): void {
    this.updateStatus(message)
    // You could add success styling here
  }

  /**
   * Get tool button element
   */
  getToolButton(tool: ToolType): HTMLButtonElement | undefined {
    return this.toolButtons.get(tool)
  }

  /**
   * Check if UI is initialized
   */
  isInitialized(): boolean {
    return this.statusElement !== null && this.coordinatesElement !== null
  }
}

export default UIService;