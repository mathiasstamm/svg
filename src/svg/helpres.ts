import p5 from "p5";
import { Rect } from "./rect";
import { Circle } from "./circle";
import { Path } from "./path";
import { Group } from "./group";
import { Style } from "./style";
import { Element } from "./element";

export function createShape(p: p5, xmlElement: p5.XML, parentStyle: Style): Element | null {
    const tag = xmlElement.getName();
    switch (tag) {
      case 'rect':
        return new Rect(p, xmlElement, parentStyle);
      case 'circle':
        return new Circle(p, xmlElement, parentStyle);
      case 'path':
        return new Path(p, xmlElement, parentStyle);
      case 'g':
        return new Group(p, xmlElement, parentStyle);
      default:
        return null;
    }
  };

export function applyTransform(p: p5, transformStr: string): void {
const transforms = transformStr.match(/\w+\([^)]+\)/g) || [];
for (const t of transforms) {
    const [name, params] = t.split('(');
    const values = params.slice(0, -1).split(/[\s,]+/).map(Number);

    switch (name) {
    case 'translate':
        p.translate(values[0] || 0, values[1] || 0);
        break;
    case 'rotate':
        p.rotate(p.radians(values[0] || 0));
        break;
    case 'scale':
        p.scale(values[0] || 1, values[1] || values[0] || 1);
        break;
    }
}
}
