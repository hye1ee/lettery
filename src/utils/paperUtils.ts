import paper from 'paper'
import { colors } from './styles';

export const findParentLayer = (item: paper.Item): paper.Layer | null => {
  if (item instanceof paper.Layer) {
    return item;
  } else if (item.parent) {
    return findParentLayer(item.parent);
  } else {
    return null;
  }
}

export const simplifyPath = (path: paper.Path): { original: number; simplified: number; saved: number; percentage: number } | null => {
  if (path && path.segments.length > 2) {
    const originalCount = path.segments.length;

    // Simplify the path with configurable tolerance
    path.simplify(10);

    const simplifiedCount = path.segments.length;
    const saved = originalCount - simplifiedCount;
    const percentage = Math.round(saved / originalCount * 100);

    console.log(`Path simplified: ${saved} of ${originalCount} segments removed. Saving ${percentage}%`);

    return {
      original: originalCount,
      simplified: simplifiedCount,
      saved: saved,
      percentage: percentage
    };
  }
  return null;
}

export const closePath = (path: paper.Path): void => {
  path.closed = true;
  path.strokeWidth = 0;
  path.fillColor = new paper.Color(colors.black);
}

export const ungroupItem = (item: paper.Item): void => {
  if (item instanceof paper.Group) {
    item.children.forEach(child => {
      ungroupItem(child);
      item.parent?.addChild(child.clone());
    });
    item.remove();
  }
}