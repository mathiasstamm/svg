import p5 from "p5";
import { Style } from "./style";

export abstract class Element {
  protected p: p5;
  protected xmlElement: p5.XML;
  protected style: Style;
  protected transform: string | null;

  constructor(p: p5, xmlElement: p5.XML, parentStyle: Style) {
    this.p = p;
    this.xmlElement = xmlElement;
    this.style = this.extractStyle(parentStyle);
    this.transform = xmlElement.getString('transform') || null;
  }

  protected extractStyle(parentStyle: Style): Style {
    const style: Style = { ...parentStyle };

    if (this.xmlElement.hasAttribute('fill')) {
      const fill = this.xmlElement.getString('fill');
      style.fill = fill !== 'none' ? fill : null;
    }

    if (this.xmlElement.hasAttribute('stroke')) {
      const stroke = this.xmlElement.getString('stroke');
      style.stroke = stroke !== 'none' ? stroke : null;
    }

    if (this.xmlElement.hasAttribute('stroke-width')) {
      style['stroke-width'] = this.xmlElement.getNum('stroke-width');
    }
    return style;
  }

  protected applyStyles(): void {
    if (this.style.fill) {
      this.p.fill(this.style.fill);
    } else {
      this.p.noFill();
    }

    if (this.style.stroke) {
      this.p.stroke(this.style.stroke);
    } else {
      this.p.noStroke();
    }

    if (this.style['stroke-width']) {
      this.p.strokeWeight(this.style['stroke-width']);
    }
  }

  protected fixCoordinate(value: string | null): number | null {
    if (!value) return null;
    const fixedValue = value.replace(/(?<!\d)\./g, '0.').replace(/(?<=\d)-/g, ' -');
    const parsed = parseFloat(fixedValue);
    return isNaN(parsed) ? null : parsed;
  }

  public abstract draw(): void;

  public getDebugInfo(): string[] {
    return [`Element: ${this.xmlElement.getName()}`];      
    }
}
