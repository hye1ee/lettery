

export const lerpPoint = (point1: { x: number, y: number }, point2: { x: number, y: number }, t: number): { x: number, y: number } => {
  return {
    x: point1.x + (point2.x - point1.x) * t,
    y: point1.y + (point2.y - point1.y) * t
  };
}
