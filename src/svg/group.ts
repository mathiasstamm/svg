import p5 from "p5";
import { Element } from "./element";
import { applyTransform, createShape } from "./helpres";
import { Style } from "./style";

export class Group extends Element {
    private children: Element[];
  
    constructor(p: p5, xmlElement: p5.XML, parentStyle: Style) {
      super(p, xmlElement, parentStyle);
      this.children = [];
      const childElements = xmlElement.getChildren();
      
      for (const child of childElements) {
        const childShape = createShape(p, child, this.style);
        if (childShape) {
          this.children.push(childShape);
        }
      }
    }
  
    public draw(): void {
      this.p.push();
      
      if (this.transform) {
        applyTransform(this.p, this.transform);
      }
      
      for (const child of this.children) {
        child.draw();
      }
      
      this.p.pop();
    }

    public getDebugInfo(): string[] {
      return this.children.flatMap((child) => child.getDebugInfo());
    }
}