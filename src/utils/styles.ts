export const colors = {
  black: '#000000',
  white: '#ffffff',
  gray: '#808080',
  lightGray: '#d3d3d3',
  orange: '#e4141b',
  blue: '#0000ff',
  red: '#ff0000',
  green: '#00ff00',
  yellow: '#ffff00',
  primary: // brown
    '#4e2a20',
  secondary: // blue
    '#22A6FF',
  tertiary: // dark brown
    '#c99a8d',
  quaternary: // very dark brown
    '#e5c8c0',
  quinary: // black
    '#000000',
  error: // red
    '#ff0000',
  success: // green
    '#00ff00',
  warning: // yellow
    '#ffff00',
  info: // blue
    '#0000ff',
}

export const hexToRgb = (hex: string): { r: number, g: number, b: number } => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { r, g, b };
}

export const hexToRgba = (hex: string, alpha: number): { r: number, g: number, b: number, a: number } => {
  const { r, g, b } = hexToRgb(hex);
  return { r, g, b, a: alpha };
}