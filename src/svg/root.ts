import p5 from "p5";
import { Group } from "./group";

export class Root {
    public width: number;
    public height: number;
    private rootGroup: Group;
    private viewBox: string | undefined;
  
    constructor(p: p5, xml: p5.XML) {
      this.width = xml.getNum('width') || 400;
      this.height = xml.getNum('height') || 400;
      this.viewBox = xml.getString('viewBox') || undefined;
      this.rootGroup = new Group(p, xml, {});
    }
  
    public draw(): void {
      this.rootGroup.draw();
    }

    public getDebugInfo(): string[] {
      const debugInfo = [`Root: width=${this.width}, height=${this.height}`];
      if (this.viewBox) {
        debugInfo.push(`viewBox="${this.viewBox}"`);
      }
      return [...debugInfo, ...this.rootGroup.getDebugInfo()];
    }
}