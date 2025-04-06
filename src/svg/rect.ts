import { Element } from "./element";
import { applyTransform } from "./helpres";

export class Rect extends Element {
    public draw(): void {
      this.p.push();

      if (this.transform) {
        applyTransform(this.p, this.transform);
      }

      this.applyStyles();
      
      const x = this.xmlElement.getNum('x') || 0;
      const y = this.xmlElement.getNum('y') || 0;
      const width = this.xmlElement.getNum('width');
      const height = this.xmlElement.getNum('height');
      
      this.p.rect(x, y, width, height);
      this.p.pop();
    }

    public getDebugInfo(): string[] {
      const x = this.xmlElement.getNum('x') || 0;
      const y = this.xmlElement.getNum('y') || 0;
      const width = this.xmlElement.getNum('width');
      const height = this.xmlElement.getNum('height');
      return [`Rect: x=${x}, y=${y}, width=${width}, height=${height}`];
    }
}