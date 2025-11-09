import { translate } from '../i18n';

class Logger {
  private static instance: Logger | null = null;
  private statusElement: HTMLSpanElement | null = null;
  private coordinatesElement: HTMLSpanElement | null = null;
  private currentStatus: string = '';

  private constructor() { }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * Initialize the Logger service with DOM elements
   */
  init(statusElement: HTMLSpanElement, coordinatesElement: HTMLSpanElement): void {
    this.statusElement = statusElement;
    this.coordinatesElement = coordinatesElement;
  }

  /**
   * Update the status message
   */
  updateStatus(message: string): void {
    if (this.currentStatus === message) return;

    this.currentStatus = message
    if (this.statusElement) {
      this.statusElement.textContent = message;
    }
    console.log('Status:', message)
  }

  /**
   * Update the coordinates display
   */
  updateCoordinates(x: number, y: number): void {
    if (this.coordinatesElement) {
      this.coordinatesElement.textContent = `X: ${Math.round(x)}, Y: ${Math.round(y)}`;
    }
  }

  /**
   * Clear the status message
   */
  clearStatus(): void {
    this.updateStatus('');
  }

  /**
   * Get the current status message
   */
  getCurrentStatus(): string {
    return this.currentStatus;
  }

  /**
   * Log debug information
   */
  log(message: string, data?: any): void {
    console.log(`[Logger] ${message}`, data || '');
  }

  /**
   * Log error information
   */
  error(message: string, error?: any): void {
    console.error(`[Logger] ${message}`, error || '');
    this.updateStatus(translate('logger.error', { message }));
  }

  /**
   * Log warning information
   */
  warn(message: string, data?: any): void {
    console.warn(`[Logger] ${message}`, data || '');
    this.updateStatus(translate('logger.warning', { message }));
  }
}

export default Logger;
