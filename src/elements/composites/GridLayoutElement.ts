import { TransformElement } from "../primitives/TransformElement";
import { Element } from "../primitives/Element";

interface GridLayoutConfig {
  columns?: number; // Number of columns (default: auto-wrap based on children)
  gap?: number; // Gap between cells in pixels (default: 0)
  alignItems?: "start" | "center" | "end"; // Vertical alignment within row (default: center)
}

/**
 * Simple grid layout element that positions children in a grid pattern.
 * Flows left-to-right, top-to-bottom.
 */
export class GridLayoutElement extends TransformElement {
  columns: number;
  gap: number;
  alignItems: "start" | "center" | "end";

  constructor(config: GridLayoutConfig = {}) {
    super();
    this.columns = config.columns ?? 0; // 0 = single row (all children in one row)
    this.gap = config.gap ?? 0;
    this.alignItems = config.alignItems ?? "center";
  }

  async init(): Promise<void> {
    await super.init();
  }

  override play(): void {
    this.calculateLayout();
    super.play();
  }

  override addChild(child: Element): void {
    super.addChild(child);
    if (this.getState() === "PLAYING" && child instanceof TransformElement) {
      this.calculateLayout();
    }
  }

  override removeChild(child: Element): void {
    super.removeChild(child);
    if (this.getState() === "PLAYING" && child instanceof TransformElement) {
      this.calculateLayout();
    }
  }

  private calculateLayout(): void {
    // logger.debug("[GridLayout] calculateLayout start", {
    //   childCount: this.children.length,
    // });

    if (this.children.length === 0) {
      this.setWidth(0);
      this.setHeight(0);
      //logger.debug("[GridLayout] calculateLayout empty, width=0, height=0");
      return;
    }

    const transformChildren = this.getChildrenOfType(TransformElement);
    const cols = this.columns > 0 ? this.columns : transformChildren.length;
    const rows = Math.ceil(transformChildren.length / cols);

    // logger.debug("[GridLayout] grid dimensions", {
    //   cols,
    //   rows,
    //   transformChildCount: transformChildren.length,
    // });

    // Calculate column widths and row heights
    const colWidths: number[] = new Array(cols).fill(0);
    const rowHeights: number[] = new Array(rows).fill(0);

    transformChildren.forEach((child, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const childWidth = child.getWidth() ?? 0;
      const childHeight = child.getHeight() ?? 0;

      // logger.debug("[GridLayout] child dimensions", {
      //   index,
      //   childType: child.constructor.name,
      //   childWidth,
      //   childHeight,
      //   col,
      //   row,
      // });

      colWidths[col] = Math.max(colWidths[col], childWidth);
      rowHeights[row] = Math.max(rowHeights[row], childHeight);
    });

    // logger.debug("[GridLayout] calculated col/row sizes", {
    //   colWidths,
    //   rowHeights,
    // });

    // Position children in grid
    let currentY = 0;
    for (let row = 0; row < rows; row++) {
      let currentX = 0;
      const rowHeight = rowHeights[row];

      for (let col = 0; col < cols; col++) {
        const childIndex = row * cols + col;
        if (childIndex >= transformChildren.length) break;

        const child = transformChildren[childIndex];
        const childHeight = child.getHeight() ?? 0;

        // Horizontal position (left-aligned within column)
        child.x = currentX;

        // Vertical alignment within row
        // All text uses textBaseline: "top", so we can use simple positioning
        if (this.alignItems === "start") {
          child.y = currentY;
        } else if (this.alignItems === "center") {
          child.y = currentY + (rowHeight - childHeight) / 2;
        } else if (this.alignItems === "end") {
          child.y = currentY + rowHeight - childHeight;
        }

        // logger.debug("[GridLayout] positioned child", {
        //   childIndex,
        //   childType: child.constructor.name,
        //   x: child.x,
        //   y: child.y,
        // });

        currentX += colWidths[col] + this.gap;
      }

      currentY += rowHeight + this.gap;
    }

    // Calculate total dimensions
    const totalWidth =
      colWidths.reduce((sum, w) => sum + w, 0) +
      this.gap * Math.max(0, cols - 1);
    const totalHeight =
      rowHeights.reduce((sum, h) => sum + h, 0) +
      this.gap * Math.max(0, rows - 1);

    this.setWidth(totalWidth);
    this.setHeight(totalHeight);

    // logger.debug("[GridLayout] calculateLayout complete", {
    //   finalWidth: totalWidth,
    //   finalHeight: totalHeight,
    // });
  }
}
