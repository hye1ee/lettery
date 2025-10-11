import type { AgentTool } from "../types";

/**
 * Guided Edit Agent Tool
 */
class GuidedEdit implements AgentTool {
  private static instance: GuidedEdit;

  public readonly id: string = 'guided-edit';
  public readonly name: string = 'Guided Edit';
  public readonly description: string = 'Edit the selected jamo based on your description';
  public readonly icon: string = '/command.svg';
  public readonly isEnabled: boolean = true;

  private constructor() { }

  public static getInstance(): GuidedEdit {
    if (!GuidedEdit.instance) {
      GuidedEdit.instance = new GuidedEdit();
    }
    return GuidedEdit.instance;
  }

  public execute(): void {
    console.log('Guided Edit tool executed');
    // TODO: Implement guided edit functionality
  }
}
export default GuidedEdit;
