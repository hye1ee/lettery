import paper from 'paper'
import { colors } from './styles';
import { isHorizontalVowel, isComplexVowel, isVerticalVowel } from './hangul';


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

export const closePath = (path: paper.Path | paper.CompoundPath): paper.Path | paper.CompoundPath => {
  path.closed = true;
  path.strokeWidth = 0;
  path.fillColor = new paper.Color(colors.black);
  return path as paper.Path | paper.CompoundPath;
}

export const makeCompoundPath = (items: paper.Item[]): paper.CompoundPath => {
  return new paper.CompoundPath({ children: items });
}

export const releaseCompoundPath = (items: paper.Item[]): void => {
  items.forEach(item => {
    if (item instanceof paper.CompoundPath && item.children.length > 0) {
      item.children.forEach(child => {
        child.parent = item.parent;
      });
      item.remove();
    }
  });
}

export const alignItems = (items: paper.Item[], align: 'top' | 'horizontal' | 'bottom' | 'left' | 'vertical' | 'right'): void => {
  let bounds = items[0].bounds;
  items.forEach(item => {
    bounds = bounds.unite(item.bounds);
  });

  switch (align) {
    case 'top':
      items.forEach(item => {
        item.bounds.top = bounds.top;
      });
      break;
    case 'horizontal':
      items.forEach(item => {
        item.bounds.center.y = (bounds.top + bounds.bottom) / 2;
      });
      break;
    case 'bottom':
      items.forEach(item => {
        item.bounds.bottom = bounds.bottom;
      });
      break;
    case 'left':
      items.forEach(item => {
        item.bounds.left = bounds.left;
      });
      break;
    case 'vertical':
      items.forEach(item => {
        item.bounds.center.x = (bounds.left + bounds.right) / 2;
      });
      break;
    case 'right':
      items.forEach(item => {
        item.bounds.right = bounds.right;
      });
      break;
  }
}

export const flipItems = (items: paper.Item[], direction: 'horizontal' | 'vertical'): void => {
  let bounds = items[0].bounds;
  items.forEach(item => {
    bounds = bounds.unite(item.bounds);
  });

  items.forEach(item => {
    if (direction === 'horizontal') {
      item.transform(new paper.Matrix(1, 0, 0, -1, 0, 2 * bounds.center.y));
    } else {
      item.transform(new paper.Matrix(-1, 0, 0, 1, 2 * bounds.center.x, 0));
    }
  });
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

export const rgbaToPaperColor = (rgba: { r: number, g: number, b: number, a?: number }): paper.Color => {
  return new paper.Color(rgba.r, rgba.g, rgba.b, rgba.a);
}

export const ungroupSVG = (item: paper.Item): paper.Item[] => {
  if (!(item instanceof paper.Group)) return [];

  const newItems: paper.Item[] = [];

  item.children.forEach(child => {
    if (child instanceof paper.Path || child instanceof paper.CompoundPath) {
      const newChild = child.clone();

      item.parent?.addChild(newChild);
      newItems.push(newChild);
    }
  });
  item.remove();
  return newItems;
}

export const getTranslationVector = (text: string, textItems: paper.Item[]): paper.Point => {
  // [1] get bounding box size
  let bounds = textItems[0].bounds;
  textItems.forEach(item => {
    bounds = bounds.unite(item.bounds);
  });
  const width = bounds.width;
  const height = bounds.height;
  const scale = 1;

  // if korean vowel
  if (isVerticalVowel(text)) {
    return new paper.Point(width * scale, 0);
  }
  else if (isHorizontalVowel(text)) {
    return new paper.Point(0, height * scale);
  }
  else if (isComplexVowel(text)) {
    return new paper.Point(width * scale / 4, height * scale / 2);
  }
  else { // consonant
    return new paper.Point(0, height * scale);
  }
}