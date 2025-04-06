import { Element } from "./element";
import { applyTransform } from "./helpres";

export class Circle extends Element {
    public draw(): void {
      this.p.push();
      if (this.transform) {
        applyTransform(this.p, this.transform);
      }

      this.applyStyles();

      const cx = this.xmlElement.getNum('cx') || 0;
      const cy = this.xmlElement.getNum('cy') || 0;
      const r = this.xmlElement.getNum('r');

      this.p.circle(cx, cy, r * 2);
      this.p.pop();
    }

    public getDebugInfo(): string[] {
      const cx = this.xmlElement.getNum('cx') || 0;
      const cy = this.xmlElement.getNum('cy') || 0;
      const r = this.xmlElement.getNum('r');
      return [`Circle: cx=${cx}, cy=${cy}, r=${r}`];
    }
}