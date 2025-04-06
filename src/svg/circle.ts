import { Element } from "./element";
import { applyTransform } from "./helpres";

export class Circle extends Element {
  public draw(): void {
    this.p.push();

    if (this.transform) {
      applyTransform(this.p, this.transform);
    }

    this.applyStyles();

    // Parse and fix coordinates
    const cx = this.fixCoordinate(this.xmlElement.getString('cx')) || 0;
    const cy = this.fixCoordinate(this.xmlElement.getString('cy')) || 0;
    const r = this.fixCoordinate(this.xmlElement.getString('r'));

    console.log(`Drawing circle at (${cx}, ${cy}) with radius=${r}`);

    if (r) {
      this.p.circle(cx, cy, r * 2);
    }

    this.p.pop();
  }

  private fixCoordinate(value: string | null): number | null {
    if (!value) return null;
    const fixedValue = value.replace(/(?<!\d)\./g, '0.').replace(/(?<=\d)-/g, ' -');
    const parsed = parseFloat(fixedValue);
    return isNaN(parsed) ? null : parsed;
  }

  public getDebugInfo(): string[] {
    const cx = this.fixCoordinate(this.xmlElement.getString('cx')) || 0;
    const cy = this.fixCoordinate(this.xmlElement.getString('cy')) || 0;
    const r = this.fixCoordinate(this.xmlElement.getString('r'));
    return [`Circle: cx=${cx}, cy=${cy}, r=${r}`];
  }
}