// Auto-import all agent tools to register them
import './guidedEdit';
import './smartPropagation';
import './placeholderAgent';

// Import the singleton instances after registration
import GuidedEditTool from './guidedEdit';
import SmartPropagationTool from './smartPropagation';
import PlaceholderAgent from './placeholderAgent';

export const guidedEditTool = GuidedEditTool.getInstance();
export const smartPropagationTool = SmartPropagationTool.getInstance();
export const placeholderAgent = PlaceholderAgent.getInstance();