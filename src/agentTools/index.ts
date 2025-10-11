// Auto-import all agent tools to register them
import './guidedEdit';
import './smartPropagation';

// Import the singleton instances after registration
import GuidedEditTool from './guidedEdit';
import SmartPropagationTool from './smartPropagation';

export const guidedEditTool = GuidedEditTool.getInstance();
export const smartPropagationTool = SmartPropagationTool.getInstance();