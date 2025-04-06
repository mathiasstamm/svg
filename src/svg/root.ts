import p5 from "p5";
import { Group } from "./group";

export class Root {
  private p: p5;
  private xml: p5.XML;
  public width: number;
  public height: number;
  private rootGroup: Group;
  private viewBox: [number, number, number, number] | undefined;

  constructor(p: p5, xml: p5.XML) {
    this.p = p;
    this.xml = xml;

    // Extract width and height from the SVG attributes
    this.width = parseFloat(this.xml.getString('width')) || 400;
    this.height = parseFloat(this.xml.getString('height')) || 400;

    console.log('Root initialized with width:', this.width, 'height:', this.height);

    // Parse the viewBox attribute
    const viewBoxStr = xml.getString('viewBox');
    if (viewBoxStr) {
      const viewBoxValues = viewBoxStr.split(/\s+/).map(Number);
      if (viewBoxValues.length === 4) {
        this.viewBox = [
          viewBoxValues[0],
          viewBoxValues[1],
          viewBoxValues[2],
          viewBoxValues[3],
        ];
        console.log('Parsed viewBox:', this.viewBox);
      }
    } else {
      // If no viewBox is defined, use width and height as the default viewBox
      this.viewBox = [0, 0, this.width, this.height];
      console.log('Default viewBox applied:', this.viewBox);
    }

    // Initialize the root group
    this.rootGroup = new Group(p, xml, {});
  }

  public draw(): void {
    console.log('Rendering root group...');
    this.p.push();

    // Apply viewBox transformation if defined
    if (this.viewBox) {
      const [x, y, w, h] = this.viewBox;

      // Calculate scaling factors to map the viewBox to the canvas dimensions
      const scaleX = this.p.width / w;
      const scaleY = this.p.height / h;

      console.log(`Applying viewBox transformation: translate(${x}, ${y}), scale(${scaleX}, ${scaleY})`);

      // Apply transformations to map the viewBox to the canvas
      this.p.scale(scaleX, scaleY);
      this.p.translate(-x, -y);
    }

    // Draw the root group
    this.rootGroup.draw();
    this.p.pop();
  }

  public getDebugInfo(): string[] {
    const debugInfo: string[] = [];
    debugInfo.push(`Root: width=${this.width}, height=${this.height}`);
    if (this.viewBox) {
      debugInfo.push(`viewBox="${this.viewBox.join(' ')}"`);
    }

    // Append debug info from the root group
    return [...debugInfo, ...this.rootGroup.getDebugInfo()];
  }
}