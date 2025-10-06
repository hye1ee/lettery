import paper from 'paper';

/**
 * Snap a delta vector to the nearest angle increment
 * @param delta - The movement delta vector
 * @param angleIncrement - The angle increment in radians (e.g., Math.PI/4 for 45 degrees)
 * @returns The snapped delta vector
 */
export const snapDeltaToAngle = (delta: paper.Point, angleIncrement: number): paper.Point => {
  const angle = Math.atan2(delta.y, delta.x);
  const snappedAngle = Math.round(angle / angleIncrement) * angleIncrement;
  const length = delta.length;

  return new paper.Point(
    Math.cos(snappedAngle) * length,
    Math.sin(snappedAngle) * length
  );
};

/**
 * Check if two vectors are colinear (parallel)
 * @param v1 - First vector
 * @param v2 - Second vector
 * @param tolerance - Tolerance for colinearity check (default: 0.01)
 * @returns True if vectors are colinear
 */
export const isColinear = (v1: paper.Point, v2: paper.Point, tolerance: number = 0.01): boolean => {
  if (v1.length === 0 || v2.length === 0) return true;

  const angle1 = Math.atan2(v1.y, v1.x);
  const angle2 = Math.atan2(v2.y, v2.x);
  const angleDiff = Math.abs(angle1 - angle2);

  // Normalize angle difference to [0, Math.PI]
  const normalizedDiff = Math.min(angleDiff, 2 * Math.PI - angleDiff);

  return normalizedDiff < tolerance || normalizedDiff > (Math.PI - tolerance);
};
