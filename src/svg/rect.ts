import { Element } from "./element";
import { applyTransform } from "./helpres";

export class Rect extends Element {
  public draw(): void {
    this.p.push();

    if (this.transform) {
      applyTransform(this.p, this.transform);
    }

    this.applyStyles();

    // Parse and fix coordinates
    const x = this.fixCoordinate(this.xmlElement.getString('x')) || 0;
    const y = this.fixCoordinate(this.xmlElement.getString('y')) || 0;
    const width = this.fixCoordinate(this.xmlElement.getString('width'));
    const height = this.fixCoordinate(this.xmlElement.getString('height'));

    console.log(`Drawing rect at (${x}, ${y}) with width=${width} and height=${height}`);

    if (width && height) {
      this.p.rect(x, y, width, height);
    }

    this.p.pop();
  }

  public getDebugInfo(): string[] {
    const x = this.fixCoordinate(this.xmlElement.getString('x')) || 0;
    const y = this.fixCoordinate(this.xmlElement.getString('y')) || 0;
    const width = this.fixCoordinate(this.xmlElement.getString('width'));
    const height = this.fixCoordinate(this.xmlElement.getString('height'));
    return [`Rect: x=${x}, y=${y}, width=${width}, height=${height}`];
  }
}