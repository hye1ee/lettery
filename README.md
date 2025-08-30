# Lettery - Vector Editor

A professional vector editing tool built with Paper.js and TypeScript, similar to Adobe Illustrator.

## 🏗️ Project Structure

```
src/
├── main.ts                 # Main application entry point
├── utils.ts               # Legacy compatibility layer (re-exports services)
├── services/              # Business logic services
│   ├── index.ts          # Main services index and ServiceManager
│   ├── fileService.ts     # File import/export operations
│   ├── canvasService.ts   # Paper.js canvas management
│   ├── toolService.ts     # Tool switching and state management
│   ├── drawingService.ts  # Drawing operations and path management
│   └── uiService.ts       # UI state and interactions
├── types/                 # TypeScript type definitions
│   └── index.ts          # Centralized type exports
└── constants/             # Application constants
    └── index.ts          # Tool types, colors, etc.
```

## 🎯 Services Overview

All services follow the **Singleton Pattern** for consistent state management across the application.

### **ServiceManager** (`src/services/index.ts`)

- **Main entry point** for all services
- Provides unified initialization and management
- Singleton pattern ensures single instance across the app

### **FileService** (`src/services/fileService.ts`)

- SVG import/export operations
- File validation and handling
- Download functionality

### **CanvasService** (`src/services/canvasService.ts`)

- Paper.js initialization and management
- Canvas setup and configuration
- Dotted pattern background
- Sample content generation

### **ToolService** (`src/services/toolService.ts`)

- Tool switching logic
- Tool state management
- Keyboard shortcuts
- Tool information and descriptions

### **DrawingService** (`src/services/drawingService.ts`)

- Path creation and manipulation
- Selection handling
- Point management
- Shape creation (rectangles, circles)

### **UIService** (`src/services/uiService.ts`)

- Status message updates
- Coordinate display
- Tool button state management
- Cursor updates
- Tooltip management

## 🚀 Usage Examples

### **Basic Service Usage**

```typescript
import { serviceManager, fileService, toolService } from "./services";

// Initialize all services
serviceManager.initialize("vector-canvas");

// Use individual services
const currentTool = toolService.getCurrentTool();
const result = await fileService.importSVG(file);
```

### **Alternative Import Methods**

```typescript
// Import specific service instances
import { fileService, canvasService } from "./services";

// Import service classes (if you need to create new instances)
import { FileService, CanvasService } from "./services";

// Import the main manager
import serviceManager from "./services";
```

## 🔧 Service Architecture

### **Singleton Pattern Benefits**

- ✅ **Consistent State**: Single instance ensures data consistency
- ✅ **Memory Efficiency**: No duplicate service instances
- ✅ **Easy Access**: Global access to services from anywhere
- ✅ **Centralized Management**: ServiceManager handles initialization

### **Service Lifecycle**

1. **Creation**: Services are created when first accessed via `getInstance()`
2. **Initialization**: `serviceManager.initialize()` sets up all services
3. **Usage**: Services are accessed via singleton instances
4. **Cleanup**: `serviceManager.cleanup()` for resource cleanup

## 🚀 Getting Started

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start development server:**

   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## 🎨 Features

- **Vector Drawing**: Freehand path creation with the pen tool
- **Path Selection**: Click to select and manipulate paths
- **Point Editing**: Add, move, and manipulate control points
- **SVG Import/Export**: Work with existing SVG files
- **Professional UI**: Modern toolbar with intuitive tools
- **Keyboard Shortcuts**: V (select), P (pen), A (add point)

## 🛠️ Development

### **Adding New Services**

1. Create new service class with singleton pattern
2. Add to `src/services/index.ts`
3. Export from main services index
4. Update ServiceManager if needed

### **Adding New Tools**

1. Add tool type to `src/types/index.ts`
2. Update `src/services/toolService.ts`
3. Add tool button to HTML
4. Implement tool logic in `src/services/drawingService.ts`

### **Adding New File Formats**

1. Extend `src/services/fileService.ts`
2. Add format validation
3. Update UI to support new formats

### **Modifying Canvas Behavior**

1. Update `src/services/canvasService.ts`
2. Modify event handlers as needed
3. Update constants in `src/constants/index.ts`

## 🔧 Technical Details

- **Framework**: Paper.js v0.12.18 for vector graphics
- **Language**: TypeScript with strict type checking
- **Build Tool**: Vite for fast development and building
- **Architecture**: Service-oriented architecture with singleton pattern
- **State Management**: Centralized state management through services

## 📝 Notes

- All services use the singleton pattern for consistent state
- The `utils.ts` file serves as a legacy compatibility layer
- `ServiceManager` provides unified access to all services
- Services can be accessed individually or through the manager
- Paper.js initialization issues may need to be resolved based on the specific version being used

## 🐛 Known Issues

- Paper.js initialization may have compatibility issues with version 0.12.18
- Some TypeScript types may not perfectly match the Paper.js API
- Canvas service constructor arguments may need adjustment based on Paper.js version

## 🤝 Contributing

1. Follow the existing singleton service structure
2. Add proper TypeScript types
3. Include error handling
4. Update documentation as needed
5. Use the ServiceManager for initialization and management
