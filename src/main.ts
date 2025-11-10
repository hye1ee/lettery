import './style.css'
import { agentService, canvasService, historyService, toolService, uiService } from './services'
import { selectTool, pencilTool, markerTool, penTool, handTool, editTool, rectangleTool, ellipseTool } from './tools'
import { cursor, logger, contextMenu } from './helpers'
import { guidedEditTool, smartPropagationTool } from './agentTools'
import { ModelProvider } from './models'
import { initI18n, translate } from './i18n'


let layerImportSvgBtn: HTMLButtonElement
let layerExportSvgBtn: HTMLButtonElement
let addLayerBtn: HTMLButtonElement
let addJamoBtn: HTMLButtonElement
let fileInput: HTMLInputElement

// Initialize the application
const initApp = () => {
  console.log('Initializing app...')


  layerImportSvgBtn = document.getElementById('layer-import-svg') as HTMLButtonElement
  layerExportSvgBtn = document.getElementById('layer-export-svg') as HTMLButtonElement
  addLayerBtn = document.getElementById('header-plus-btn') as HTMLButtonElement
  addJamoBtn = document.getElementById('jamo-plus-btn') as HTMLButtonElement
  fileInput = document.getElementById('file-input') as HTMLInputElement

  const statusText = document.getElementById('status-text') as HTMLSpanElement;
  const coordinates = document.getElementById('coordinates') as HTMLSpanElement;
  const canvas = document.getElementById('vector-canvas') as HTMLElement;

  // Check if all elements are found
  if (!layerImportSvgBtn || !layerExportSvgBtn || !addLayerBtn || !addJamoBtn || !fileInput || !statusText || !coordinates) {
    console.error('Some DOM elements not found:', {
      layerImportSvgBtn: !!layerImportSvgBtn,
      layerExportSvgBtn: !!layerExportSvgBtn,
      addLayerBtn: !!addLayerBtn,
      addJamoBtn: !!addJamoBtn,
      fileInput: !!fileInput,
      statusText: !!statusText,
      coordinates: !!coordinates
    })
    return
  }

  console.log('All DOM elements found, setting up event listeners...')


  // Set up event listeners
  setupEventListeners();

  // Initialize Paper.js
  initCanvas();
  initTools();

  // Initialize services
  uiService.init();
  historyService.init();
  // ModelProvider.init({
  //   modelType: "anthropic",
  //   modelName: "claude-sonnet-4-5",
  //   apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  // });
  ModelProvider.init({
    modelType: "openai",
    modelName: "gpt-4.1",
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  });

  // Initialize helpers
  logger.init(statusText, coordinates);
  cursor.init(canvas);
  contextMenu.init();

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

  // Header plus button (syllables)
  addLayerBtn.addEventListener('click', () => {
    console.log('Header plus button clicked');
    uiService.addSyllable();
  })

  // Jamo plus button
  addJamoBtn.addEventListener('click', () => {
    console.log('Jamo plus button clicked');
    uiService.addJamo();
  })

  // Agent tools are now dynamically registered and rendered
  // No need for hardcoded event listeners

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
      canvasService.zoomAtPoint(event, event.deltaY < 0)
      event.preventDefault();
    }
  }, { passive: false });

  // Keyboard events
  document.addEventListener('keydown', (event) => {
    if (event.key === 'z' && (event.ctrlKey || event.metaKey) && !event.shiftKey) {
      event.preventDefault();
      historyService.undo();
    } else if (event.key === 'z' && (event.ctrlKey || event.metaKey) && event.shiftKey) {
      event.preventDefault();
      historyService.redo();
    }
  })

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

  // Set up selection callbacks from canvas -> UI
  canvasService.setAlertSelectionChangeCallback(({ id, layer }: { id: string | null, layer?: boolean }) => {
    uiService.updateItemSelection({ id, layer });
  });

  // Initialize UI
  logger.updateStatus(translate('logger.ready'));
}

const initTools = () => {
  // Get tool instances
  const tools = [
    selectTool,
    pencilTool,
    markerTool,
    penTool,
    handTool,
    editTool,
    rectangleTool,
    ellipseTool
  ]

  toolService.setRenderCallback(uiService.renderPathItems)
  toolService.initTools(tools);
  canvasService.addEventHandlers(toolService.getEventHandlers());

  // Initialize agent tools
  const agentTools = [
    guidedEditTool,
    smartPropagationTool
  ]

  agentService.setRenderCallback(uiService.renderAgentTools);
  agentService.initTools(agentTools);
}


initI18n();
initApp();





