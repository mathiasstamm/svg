import { Element } from "./element";
import { applyTransform } from "./helpres";

export class Path extends Element {
    public draw(): void {
      this.p.push();

      if (this.transform) {
        applyTransform(this.p, this.transform);
      }

      this.applyStyles();
      const d = this.xmlElement.getString('d') || '';
      const commands = d.match(/[MLZ][^MLZ]*/g) || [];
      this.p.beginShape();

      for (const cmd of commands) {
        const type = cmd[0];
        const coords = cmd.slice(1).trim().split(/\s+/).map(Number);

        if (type === 'M' && coords.length >= 2) {
          this.p.vertex(coords[0], coords[1]);
        } else if (type === 'L' && coords.length >= 2) {
          this.p.vertex(coords[0], coords[1]);
        } else if (type === 'Z') {
          this.p.endShape(this.p.CLOSE);
          this.p.beginShape();
        }
      }

      this.p.endShape();
      this.p.pop();
    }

    public getDebugInfo(): string[] {
      const d = this.xmlElement.getString('d') || '';
      return [`Path: d="${d}"`];
    }
}