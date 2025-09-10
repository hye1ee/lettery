import paper from 'paper'

export const findParentLayer = (item: paper.Item): paper.Layer | null => {
  if (item instanceof paper.Layer) {
    return item;
  } else if (item.parent) {
    return findParentLayer(item.parent);
  } else {
    return null;
  }
}