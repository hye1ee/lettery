import './style.css'
import paper from 'paper'
import { canvasService, toolService, uiService } from './services'

import { TOOLS } from './types'

// DOM elements
let selectTool: HTMLButtonElement
let penTool: HTMLButtonElement
let handTool: HTMLButtonElement
let addPointTool: HTMLButtonElement
let layerImportSvgBtn: HTMLButtonElement
let layerExportSvgBtn: HTMLButtonElement
let addLayerBtn: HTMLButtonElement
let fileInput: HTMLInputElement
let statusText: HTMLSpanElement
let coordinates: HTMLSpanElement

// Initialize the application
const initApp = () => {
  console.log('Initializing app...')

  // Get DOM elements
  selectTool = document.getElementById('select-tool') as HTMLButtonElement
  penTool = document.getElementById('pen-tool') as HTMLButtonElement
  handTool = document.getElementById('hand-tool') as HTMLButtonElement
  addPointTool = document.getElementById('add-point-tool') as HTMLButtonElement
  layerImportSvgBtn = document.getElementById('layer-import-svg') as HTMLButtonElement
  layerExportSvgBtn = document.getElementById('layer-export-svg') as HTMLButtonElement
  addLayerBtn = document.getElementById('header-plus-btn') as HTMLButtonElement
  fileInput = document.getElementById('file-input') as HTMLInputElement
  statusText = document.getElementById('status-text') as HTMLSpanElement
  coordinates = document.getElementById('coordinates') as HTMLSpanElement

  // Check if all elements are found
  if (!selectTool || !penTool || !handTool || !addPointTool || !layerImportSvgBtn || !layerExportSvgBtn || !addLayerBtn || !fileInput || !statusText || !coordinates) {
    console.error('Some DOM elements not found:', {
      selectTool: !!selectTool,
      penTool: !!penTool,
      handTool: !!handTool,
      addPointTool: !!addPointTool,
      layerImportSvgBtn: !!layerImportSvgBtn,
      layerExportSvgBtn: !!layerExportSvgBtn,
      addLayerBtn: !!addLayerBtn,
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
    [TOOLS.HAND, handTool],
    [TOOLS.ADD_POINT, addPointTool]
  ])

  uiService.init(statusText, coordinates, toolButtons)

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

  handTool.addEventListener('click', () => {
    console.log('Hand tool clicked')
    switchTool(TOOLS.HAND)
  })

  addPointTool.addEventListener('click', () => {
    console.log('Add point tool clicked')
    switchTool(TOOLS.ADD_POINT)
  })


  // Layer action buttons
  layerImportSvgBtn.addEventListener('click', () => {
    fileInput.click()
  })

  layerExportSvgBtn.addEventListener('click', () => {
    canvasService.exportSVG();
  })

  // Header plus button
  addLayerBtn.addEventListener('click', () => {
    console.log('Header plus button clicked');

    uiService.addLayer();
  })

  // File input change
  fileInput.addEventListener('change', (e) => {
    const target = e.target as HTMLInputElement
    console.log('File input changed, files:', target.files?.length);
    if (target.files && target.files[0]) {
      console.log('Importing file:', target.files[0].name);
      canvasService.importSVG(target.files[0]);
      // Reset the input so the same file can be imported again
      target.value = '';
      console.log('File input reset, ready for next import');
    }
  })

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const newTool = toolService.handleKeyboardShortcut(e.key)
    if (newTool) {
      switchTool(newTool)
    } else if (e.key.toLowerCase() === 'escape') {
      canvasService.deselectAll()
    }
  })

  // Zoom controls
  document.addEventListener("wheel", function (event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) {
      if (event.deltaY > 0) {
        canvasService.zoomOut();
      } else {
        canvasService.zoomIn();
      }
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

  canvasService.setUpdateItemsCallback(updateItemsCallback);

  // Set up selection callbacks from canvas -> UI
  canvasService.setAlertSelectionChangeCallback((itemId: string, selected: boolean, layerId?: string) => {
    uiService.updateItemSelection(itemId, selected, layerId);
  });

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
    const path = canvasService.startDrawing(event.point)
    if (path) {
      uiService.updateStatus('Drawing started')
    }
  } else if (currentTool === TOOLS.SELECT) {
    handleSelection(event.point)
  } else if (currentTool === TOOLS.HAND) {
    canvasService.startPan(event.point)
    uiService.updateCursor('grabbing');
    uiService.updateStatus('Panning started')
  } else if (currentTool === TOOLS.ADD_POINT) {
    handleAddPoint(event.point)
  }
}

const handleMouseDrag = (event: paper.ToolEvent) => {
  const currentTool = toolService.getCurrentTool()

  if (currentTool === TOOLS.PEN) {
    canvasService.continueDrawing(event.point)
  } else if (currentTool === TOOLS.SELECT) {
    const state = canvasService.getDrawingState()
    if (state.selectedPoint || state.selectedItem) {
      canvasService.moveSelectedPoint(event.point)
      uiService.updateStatus('Point moved')
    }
  } else if (currentTool === TOOLS.HAND) {
    canvasService.panTo(event.point)
  }
}

const handleMouseUp = (event: paper.ToolEvent) => {
  const currentTool = toolService.getCurrentTool()

  if (currentTool === TOOLS.PEN) {
    if (canvasService.finishDrawing(event.point)) {
      uiService.updateStatus('Drawing finished')
    }
  } else if (currentTool === TOOLS.HAND) {
    canvasService.endPan()
    uiService.updateStatus('Panning finished')
    uiService.updateCursor('hand');
  }
}

const handleMouseMove = (event: paper.ToolEvent) => {
  uiService.updateCoordinates(event.point.x, event.point.y)
}

// Selection handling from canvas -> UI
const handleSelection = (point: paper.Point) => {
  const hitResult = canvasService.hitTest(point)

  if (hitResult) {
    if (hitResult.item instanceof paper.Path) {
      canvasService.selectItem(hitResult.item)
      uiService.updateStatus('Path selected')
    } else if (hitResult.item instanceof paper.Segment) {
      // canvasService.selectPoint(hitResult.item)
      // uiService.updateStatus('Point selected')
    } else {
      // Other drawable items
      canvasService.selectItem(hitResult.item)
      uiService.updateStatus('Item selected')
    }
  } else {
    // Clicked on empty space - deselect items but keep active layer
    console.log('Canvas click on empty space - deselecting all items');
    canvasService.deselectAll()
    uiService.updateStatus('Deselected')
  }
}

// Add point handling
const handleAddPoint = (point: paper.Point) => {
  const hitResult = canvasService.hitTest(point, {
    tolerance: 10,
    match: (result: any) => result.item instanceof paper.Path
  })

  if (hitResult && hitResult.item instanceof paper.Path) {
    const path = hitResult.item
    const newSegment = canvasService.addPointToPath(path, point)

    if (newSegment) {
      uiService.updateStatus('Point added')
    }
  }
}

const updateItemsCallback = (items: paper.Item[]) => {
  uiService.updateItems(items);
}



initApp();




