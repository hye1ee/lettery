import './style.css'
import paper from 'paper'
import { canvasService, toolService, uiService } from './services'
import { SelectTool, PencilTool, PenTool, HandTool, EditTool } from './tools'
import { cursor, logger } from './helpers'


let layerImportSvgBtn: HTMLButtonElement
let layerExportSvgBtn: HTMLButtonElement
let addLayerBtn: HTMLButtonElement
let fileInput: HTMLInputElement

// Initialize the application
const initApp = () => {
  console.log('Initializing app...')


  layerImportSvgBtn = document.getElementById('layer-import-svg') as HTMLButtonElement
  layerExportSvgBtn = document.getElementById('layer-export-svg') as HTMLButtonElement
  addLayerBtn = document.getElementById('header-plus-btn') as HTMLButtonElement
  fileInput = document.getElementById('file-input') as HTMLInputElement

  const statusText = document.getElementById('status-text') as HTMLSpanElement;
  const coordinates = document.getElementById('coordinates') as HTMLSpanElement;
  const canvas = document.getElementById('vector-canvas') as HTMLElement;

  // Check if all elements are found
  if (!layerImportSvgBtn || !layerExportSvgBtn || !addLayerBtn || !fileInput || !statusText || !coordinates) {
    console.error('Some DOM elements not found:', {
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

  // Initialize services
  uiService.init();

  // Set up event listeners
  setupEventListeners();

  // Initialize Paper.js
  initCanvas();
  initTools();

  // Initialize helpers
  logger.init(statusText, coordinates);
  cursor.init(canvas);

  console.log('App initialization complete')
}

// Set up all event listeners
const setupEventListeners = () => {
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

  // Clear hover effects when mouse leaves canvas
  const canvas = document.getElementById('vector-canvas') as HTMLCanvasElement;
  if (canvas) {
    canvas.addEventListener('mouseleave', () => {
      console.log('Mouse left canvas');
      canvasService.clearHoverEffects();
    });
  }

}

// Initialize Paper.js
const initCanvas = () => {
  // Initialize canvas service
  canvasService.init('vector-canvas')

  canvasService.setUpdateItemsCallback(updateItemsCallback);

  // Set up selection callbacks from canvas -> UI
  canvasService.setAlertSelectionChangeCallback((itemId: string, selected: boolean, layerId?: string) => {
    uiService.updateItemSelection(itemId, selected, layerId);
  });

  // Initialize UI
  logger.updateStatus('Vector editor ready. Use V for select, P for pencil, A for pen');
}

const initTools = () => {
  // Get tool instances
  const tools = [
    SelectTool.getInstance(),
    PencilTool.getInstance(),
    PenTool.getInstance(),
    HandTool.getInstance(),
    // EditTool.getInstance()
  ]

  toolService.initTools(tools);
  canvasService.addEventHandlers(toolService.getEventHandlers());
}


// Selection handling from canvas -> UI



const updateItemsCallback = (items: paper.Item[]) => {
  uiService.updateItems(items);
}



initApp();




