import './style.css'
import paper from 'paper'
import { canvasService, drawingService, toolService, uiService } from './services'
import { TOOLS } from './types'

// DOM elements
let selectTool: HTMLButtonElement
let penTool: HTMLButtonElement
let addPointTool: HTMLButtonElement
let importSvgBtn: HTMLButtonElement
let exportSvgBtn: HTMLButtonElement
let clearCanvasBtn: HTMLButtonElement
let fileInput: HTMLInputElement
let statusText: HTMLSpanElement
let coordinates: HTMLSpanElement

// Initialize the application
const initApp = () => {
  console.log('Initializing app...')

  // Get DOM elements
  selectTool = document.getElementById('select-tool') as HTMLButtonElement
  penTool = document.getElementById('pen-tool') as HTMLButtonElement
  addPointTool = document.getElementById('add-point-tool') as HTMLButtonElement
  importSvgBtn = document.getElementById('import-svg') as HTMLButtonElement
  exportSvgBtn = document.getElementById('export-svg') as HTMLButtonElement
  clearCanvasBtn = document.getElementById('clear-canvas') as HTMLButtonElement
  fileInput = document.getElementById('file-input') as HTMLInputElement
  statusText = document.getElementById('status-text') as HTMLSpanElement
  coordinates = document.getElementById('coordinates') as HTMLSpanElement

  // Check if all elements are found
  if (!selectTool || !penTool || !addPointTool || !importSvgBtn || !exportSvgBtn || !clearCanvasBtn || !fileInput || !statusText || !coordinates) {
    console.error('Some DOM elements not found:', {
      selectTool: !!selectTool,
      penTool: !!penTool,
      addPointTool: !!addPointTool,
      importSvgBtn: !!importSvgBtn,
      exportSvgBtn: !!exportSvgBtn,
      clearCanvasBtn: !!clearCanvasBtn,
      fileInput: !!fileInput,
      statusText: !!statusText,
      coordinates: !!coordinates
    })
    return
  }

  console.log('All DOM elements found, setting up event listeners...')

  // Initialize UI service with DOM elements
  const toolButtons = new Map([
    [TOOLS.SELECT, selectTool],
    [TOOLS.PEN, penTool],
    [TOOLS.ADD_POINT, addPointTool]
  ])

  uiService.initialize(statusText, coordinates, toolButtons)

  // Set up event listeners
  setupEventListeners()

  // Initialize Paper.js
  initCanvas();

  console.log('App initialization complete')
}

// Set up all event listeners
const setupEventListeners = () => {
  // Tool switching
  selectTool.addEventListener('click', () => {
    console.log('Select tool clicked')
    switchTool(TOOLS.SELECT)
  })

  penTool.addEventListener('click', () => {
    console.log('Pen tool clicked')
    switchTool(TOOLS.PEN)
  })

  addPointTool.addEventListener('click', () => {
    console.log('Add point tool clicked')
    switchTool(TOOLS.ADD_POINT)
  })

  // File operations
  importSvgBtn.addEventListener('click', () => {
    fileInput.click()
  })

  exportSvgBtn.addEventListener('click', () => {
    canvasService.exportSVG();
  })

  clearCanvasBtn.addEventListener('click', () => {
    canvasService.clearCanvas();
  })

  // File input change
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    if (target.files && target.files[0]) {
      canvasService.importSVG(target.files[0]);
    }
  })

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const newTool = toolService.handleKeyboardShortcut(e.key)
    if (newTool) {
      switchTool(newTool)
    } else if (e.key.toLowerCase() === 'escape') {
      drawingService.deselectAll()
    }
  })

  // Zoom controls
  document.addEventListener("wheel", function (event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      console.log("wheel with ctrl/meta", event);
      // Handle zoom here
      event.preventDefault();
    }
  }, { passive: false });

}

// Initialize Paper.js
const initCanvas = () => {
  // Initialize canvas service
  canvasService.init('vector-canvas')

  // Set up Paper.js event handlers
  canvasService.setupEventHandlers({
    onMouseDown: handleMouseDown,
    onMouseDrag: handleMouseDrag,
    onMouseUp: handleMouseUp,
    onMouseMove: handleMouseMove
  })

  // Initialize UI
  switchTool(TOOLS.SELECT)
  uiService.updateStatus('Vector editor ready. Use V for select, P for pen, A for add point');

}

// Tool switching
const switchTool = (tool: string) => {
  if (toolService.isValidTool(tool)) {
    toolService.switchTool(tool)
    uiService.updateToolButtonStates(tool)
    uiService.updateCursor(tool)
    uiService.updateStatus(`${toolService.getToolName(tool)} tool selected`)
  }
}

// Mouse event handlers
const handleMouseDown = (event: paper.ToolEvent) => {
  const currentTool = toolService.getCurrentTool()

  if (currentTool === TOOLS.PEN) {
    const path = drawingService.startDrawing(event.point)
    if (path) {
      uiService.updateStatus('Drawing started')
    }
  } else if (currentTool === TOOLS.SELECT) {
    handleSelection(event.point)
  } else if (currentTool === TOOLS.ADD_POINT) {
    handleAddPoint(event.point)
  }
}

const handleMouseDrag = (event: paper.ToolEvent) => {
  const currentTool = toolService.getCurrentTool()

  if (currentTool === TOOLS.PEN) {
    drawingService.continueDrawing(event.point)
  } else if (currentTool === TOOLS.SELECT) {
    const state = drawingService.getState()
    if (state.selectedPoint) {
      drawingService.moveSelectedPoint(event.point)
      uiService.updateStatus('Point moved')
    }
  }
}

const handleMouseUp = (event: paper.ToolEvent) => {
  const currentTool = toolService.getCurrentTool()

  if (currentTool === TOOLS.PEN) {
    if (drawingService.finishDrawing(event.point)) {
      uiService.updateStatus('Drawing finished')
    }
  }
}

const handleMouseMove = (event: paper.ToolEvent) => {
  uiService.updateCoordinates(event.point.x, event.point.y)
}

// Selection handling
const handleSelection = (point: paper.Point) => {
  const hitResult = drawingService.hitTest(point)

  if (hitResult) {
    if (hitResult.item instanceof paper.Path) {
      drawingService.selectPath(hitResult.item)
      uiService.updateStatus('Path selected')
    } else if (hitResult.item instanceof paper.PathItem) {
      drawingService.selectPoint(hitResult.item)
      uiService.updateStatus('Point selected')
    }
  } else {
    drawingService.deselectAll()
    uiService.updateStatus('Deselected')
  }
}

// Add point handling
const handleAddPoint = (point: paper.Point) => {
  const hitResult = drawingService.hitTest(point, {
    tolerance: 10,
    match: (result: any) => result.item instanceof paper.Path
  })

  if (hitResult && hitResult.item instanceof paper.Path) {
    const path = hitResult.item
    const newSegment = drawingService.addPointToPath(path, point)

    if (newSegment) {
      uiService.updateStatus('Point added')
    }
  }
}


initApp();

