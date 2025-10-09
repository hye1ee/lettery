import paper from 'paper';
import { alignItems, closePath, flipItems, makeCompoundPath, releaseCompoundPath } from '../utils/paperUtils';
import { historyService, uiService } from '../services';
import { boundingBox, previewBox } from '.';

/**
 * Singleton class for managing context menu
 */

export interface ContextMenuItem {
  label: string | null;
  onClick?: () => void;
  icon?: string;
  disabled?: boolean;
  submenu?: ContextMenuItem[];
}

class ContextMenu {
  private static instance: ContextMenu;
  private menuElement: HTMLElement | null = null;
  private targetElement: HTMLElement | null = null;

  private constructor() {
    // Private constructor for singleton pattern
  }

  public static getInstance(): ContextMenu {
    if (!ContextMenu.instance) {
      ContextMenu.instance = new ContextMenu();
    }
    return ContextMenu.instance;
  }

  public init(): void {
    // Create the context menu element
    this.targetElement = document.getElementById('vector-canvas') as HTMLElement;
    this.menuElement = document.getElementById('context-menu') as HTMLElement;

    if (!this.menuElement || !this.targetElement) throw new Error('Context menu not initialized');


    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (this.menuElement && !this.menuElement.contains(e.target as Node)) {
        this.hide();
      }
    });

    // Close menu on scroll or resize
    window.addEventListener('scroll', () => this.hide());
    window.addEventListener('resize', () => this.hide());


    // Prevent default context menu
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    this.targetElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();

      console.log('Showing context menu', e);
      this.show(e.offsetX, e.offsetY);
    });
  }

  public show(x: number, y: number): void {
    if (!this.menuElement || !this.targetElement) throw new Error('Context menu not initialized');


    console.log('Showing context menu');
    // Clear existing menu items
    this.menuElement.innerHTML = '';

    // Check selection
    const selection = paper.project.selectedItems;
    if (selection.length === 0) return;


    const items: ContextMenuItem[] = [
      {
        label: 'Duplicate',
        onClick: () => {
          selection.forEach(item => {
            item.clone().parent = item.parent;
          });
          uiService.renderPathItems();
          historyService.saveSnapshot('Duplicate');
        },
        icon: 'duplicate.svg'
      },
      {
        label: 'Remove',
        onClick: () => {
          selection.forEach(item => {
            item.remove();
          });
          previewBox.hide();
          uiService.renderPathItems();
          historyService.saveSnapshot('Remove');
        },
        icon: 'remove.svg'
      },
      {
        label: 'Make Compound',
        onClick: () => {
          const path = makeCompoundPath(selection);
          closePath(path);
          uiService.renderPathItems();
          historyService.saveSnapshot('Make Compound');
        },
        icon: 'compoundpath.svg'
      },
      {
        label: 'Release Compound',
        onClick: () => {
          releaseCompoundPath(selection);
          uiService.renderPathItems();
          historyService.saveSnapshot('Release Compound');
        },
        disabled: !selection.every(item => item instanceof paper.CompoundPath),
        icon: 'ungroup.svg'
      },
      {
        label: 'Align Vertical',
        icon: 'alignvertical.svg',
        disabled: selection.length == 1,
        submenu: [
          {
            label: 'Align Left',
            onClick: () => {
              alignItems(selection, 'left');
              boundingBox.show(selection);
              historyService.saveSnapshot('Align Left');
            },
            icon: 'alignleft.svg',
          },
          {
            label: 'Align Center',
            onClick: () => {
              alignItems(selection, 'vertical');
              boundingBox.show(selection);
              historyService.saveSnapshot('Align Vertical Center');
            },
            icon: 'alignvertical.svg',
          },
          {
            label: 'Align Right',
            onClick: () => {
              alignItems(selection, 'right');
              boundingBox.show(selection);
              historyService.saveSnapshot('Align Right');
            },
            icon: 'alignright.svg',
          },
        ]
      },
      {
        label: 'Align Horizontal',
        icon: 'alignhorizontal.svg',
        disabled: selection.length == 1,
        submenu: [
          {
            label: 'Align Top',
            onClick: () => {
              alignItems(selection, 'top');
              boundingBox.show(selection);
              historyService.saveSnapshot('Align Top');
            },
            icon: 'aligntop.svg',
          },
          {
            label: 'Align Center',
            onClick: () => {
              alignItems(selection, 'horizontal');
              boundingBox.show(selection);
              historyService.saveSnapshot('Align Horizontal Center');
            },
            icon: 'alignhorizontal.svg',
          },
          {
            label: 'Align Bottom',
            onClick: () => {
              alignItems(selection, 'bottom');
              boundingBox.show(selection);
              historyService.saveSnapshot('Align Bottom');
            },
            icon: 'alignbottom.svg',
          },
        ]
      },
      {
        label: 'Flip Horizontal',
        onClick: () => {
          flipItems(selection, 'horizontal');
          historyService.saveSnapshot('Flip Horizontal');
        },
        icon: 'fliphorizontal.svg',
      },
      {
        label: 'Flip Vertical',
        onClick: () => {
          flipItems(selection, 'vertical');
          historyService.saveSnapshot('Flip Vertical');
        },
        icon: 'flipvertical.svg',
      },
    ];
    // Create menu items
    items.forEach((item) => {

      const menuItem = document.createElement('div');
      menuItem.className = 'context-menu-item';

      if (item.disabled) {
        menuItem.classList.add('disabled');
      }

      // Icon
      if (item.icon) {
        const icon = document.createElement('img');
        icon.src = item.icon;
        icon.className = 'context-menu-icon';
        menuItem.appendChild(icon);
      }

      // Label
      if (item.label) {
        const label = document.createElement('span');
        label.className = 'context-menu-label';
        label.textContent = item.label;
        menuItem.appendChild(label);
      } else {
        // separator
        const separator = document.createElement('div');
        separator.className = 'context-menu-separator';
        menuItem.appendChild(separator);
      }

      // Submenu arrow
      if (!item.disabled && item.submenu) {
        const arrow = document.createElement('span');
        arrow.className = 'context-menu-arrow';
        arrow.textContent = '▶';
        menuItem.appendChild(arrow);

        // Create submenu
        const submenuElement = document.createElement('div');
        submenuElement.className = 'context-menu-submenu';
        submenuElement.style.display = 'none';

        // Add submenu items
        item.submenu.forEach((subitem) => {
          const submenuItem = document.createElement('div');
          submenuItem.className = 'context-menu-item';

          if (subitem.disabled) {
            submenuItem.classList.add('disabled');
          }

          // Icon
          if (subitem.icon) {
            const icon = document.createElement('img');
            icon.src = subitem.icon;
            icon.className = 'context-menu-icon';
            submenuItem.appendChild(icon);
          }

          // Label
          if (subitem.label) {
            const label = document.createElement('span');
            label.className = 'context-menu-label';
            label.textContent = subitem.label;
            submenuItem.appendChild(label);
          }

          // Click handler
          if (!subitem.disabled && subitem.onClick) {
            submenuItem.addEventListener('click', (e) => {
              e.stopPropagation();
              subitem.onClick!();
              this.hide();
            });
          }

          submenuElement.appendChild(submenuItem);
        });

        menuItem.appendChild(submenuElement);

        // Show/hide submenu on hover
        menuItem.addEventListener('mouseenter', () => {
          submenuElement.style.display = 'block';

          // Position submenu
          const menuRect = menuItem.getBoundingClientRect();
          const submenuRect = submenuElement.getBoundingClientRect();

          // Check if submenu goes off screen to the right
          if (menuRect.right + submenuRect.width > window.innerWidth) {
            submenuElement.style.left = `-${submenuRect.width}px`;
          } else {
            submenuElement.style.left = '100%';
          }

          submenuElement.style.top = '0';
        });

        menuItem.addEventListener('mouseleave', (e) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!submenuElement.contains(relatedTarget)) {
            submenuElement.style.display = 'none';
          }
        });

        submenuElement.addEventListener('mouseleave', (e) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (!menuItem.contains(relatedTarget)) {
            submenuElement.style.display = 'none';
          }
        });
      } else if (!item.disabled && item.onClick) {
        // Regular click handler (no submenu)
        menuItem.addEventListener('click', (e) => {
          e.stopPropagation();
          item.onClick!();
          this.hide();
        });
      }

      this.menuElement!.appendChild(menuItem);

    });

    // Position the menu
    this.menuElement.style.left = `${x}px`;
    this.menuElement.style.top = `${y}px`;
    this.menuElement.style.display = 'block';

    // Adjust position if menu goes off screen
    const rect = this.menuElement.getBoundingClientRect();

    if (x + rect.width > this.targetElement.getBoundingClientRect().width) {
      this.menuElement.style.left = `${x - rect.width - 5}px`;
    }

    if (rect.bottom > this.targetElement.getBoundingClientRect().height) {
      this.menuElement.style.top = `${y - rect.height - 5}px`;
    }

  }

  public hide(): void {
    if (this.menuElement) {
      this.menuElement.style.display = 'none';
    }
  }

}

export default ContextMenu;

