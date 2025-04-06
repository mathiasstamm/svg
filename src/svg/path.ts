import p5 from "p5";
import { Element } from "./element";
import { applyTransform } from "./helpres";

// Define types for path commands
type BaseCommand = {
  type: string;
};

type PointCommand = BaseCommand & {
  x: number;
  y: number;
};

type LineCommand = PointCommand;

type CubicBezierCommand = PointCommand & {
  cp1x: number;
  cp1y: number;
  cp2x: number;
  cp2y: number;
};

type QuadraticBezierCommand = PointCommand & {
  cx: number;
  cy: number;
};

type ArcCommand = PointCommand & {
  rx: number;
  ry: number;
  xAxisRotation: number;
  largeArcFlag: number;
  sweepFlag: number;
};

type ClosePathCommand = BaseCommand & {
  type: 'Z';
};

type PathCommand =
  | (BaseCommand & PointCommand)
  | CubicBezierCommand
  | QuadraticBezierCommand
  | ArcCommand
  | ClosePathCommand;

export class Path extends Element {
  private commands: PathCommand[] = [];
  private debug: boolean = false;
  
  constructor(p: p5, xmlElement: p5.XML, parentStyle: any) {
    super(p, xmlElement, parentStyle);
    this.parsePathData();
  }

  private parsePathData(): void {
    const pathData = this.xmlElement.getString('d');
    if (!pathData) return;

    // This handles comma/space separation and scientific notation
    const commandRegex = /([MLHVCSQTAZmlhvcsqtaz])([^MLHVCSQTAZmlhvcsqtaz]*)/g;
    let match;
    let currentPoint = { x: 0, y: 0 };
    let firstPoint = { x: 0, y: 0 };
    let lastControlPoint: { x: number, y: number } | null = null;
    let subpathStart = { x: 0, y: 0 };

    while ((match = commandRegex.exec(pathData)) !== null) {
      const cmd = match[1];
      const paramStr = match[2].trim();
      const params = this.parseParams(paramStr);
      
      if (this.debug) {
        console.log(`Command: ${cmd}, Params: ${params.join(', ')}`);
      }

      switch (cmd) {
        case 'M':
        case 'm':
          this.handleMoveCommand(cmd, params, currentPoint, firstPoint, subpathStart);
          break;

        case 'L':
        case 'l':
          this.handleLineCommand(cmd, params, currentPoint);
          break;

        case 'H':
        case 'h':
          this.handleHorizontalLineCommand(cmd, params, currentPoint);
          break;

        case 'V':
        case 'v':
          this.handleVerticalLineCommand(cmd, params, currentPoint);
          break;

        case 'C':
        case 'c':
          lastControlPoint = this.handleCubicBezierCommand(cmd, params, currentPoint);
          break;

        case 'S':
        case 's':
          lastControlPoint = this.handleSmoothCubicBezierCommand(cmd, params, currentPoint, lastControlPoint);
          break;

        case 'Q':
        case 'q':
          lastControlPoint = this.handleQuadraticBezierCommand(cmd, params, currentPoint);
          break;

        case 'T':
        case 't':
          lastControlPoint = this.handleSmoothQuadraticBezierCommand(cmd, params, currentPoint, lastControlPoint);
          break;

        case 'A':
        case 'a':
          this.handleArcCommand(cmd, params, currentPoint);
          break;

        case 'Z':
        case 'z':
          this.commands.push({ type: 'Z' });
          // Important: Go back to subpath start, not first point
          currentPoint.x = subpathStart.x;
          currentPoint.y = subpathStart.y;
          lastControlPoint = null;
          break;
      }
    }
  }

  private parseParams(paramString: string): number[] {
    if (!paramString) return [];
    
    // Handle various number formats including scientific notation and mixed delimiters
    const numberPattern = /-?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g;
    const matches = paramString.match(numberPattern);
    
    return matches ? matches.map(parseFloat) : [];
  }

  private handleMoveCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }, 
    firstPoint: { x: number, y: number },
    subpathStart: { x: number, y: number }
  ): void {
    if (params.length < 2) return;
    
    let index = 0;
    
    // First pair is always a moveto
    const isRelative = cmd === 'm';
    
    // First point
    if (isRelative) {
      currentPoint.x += params[index];
      currentPoint.y += params[index + 1];
    } else {
      currentPoint.x = params[index];
      currentPoint.y = params[index + 1];
    }
    
    // Update the first point of the entire path
    if (this.commands.length === 0) {
      firstPoint.x = currentPoint.x;
      firstPoint.y = currentPoint.y;
    }
    
    // Store the start of this subpath
    subpathStart.x = currentPoint.x;
    subpathStart.y = currentPoint.y;
    
    this.commands.push({ type: 'M', x: currentPoint.x, y: currentPoint.y });
    index += 2;
    
    // Subsequent pairs are treated as lineto commands
    while (index < params.length - 1) {
      if (isRelative) {
        currentPoint.x += params[index];
        currentPoint.y += params[index + 1];
      } else {
        currentPoint.x = params[index];
        currentPoint.y = params[index + 1];
      }
      this.commands.push({ type: 'L', x: currentPoint.x, y: currentPoint.y });
      index += 2;
    }
  }

  private handleLineCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }
  ): void {
    const isRelative = cmd === 'l';
    
    for (let i = 0; i < params.length - 1; i += 2) {
      if (isRelative) {
        currentPoint.x += params[i];
        currentPoint.y += params[i + 1];
      } else {
        currentPoint.x = params[i];
        currentPoint.y = params[i + 1];
      }
      this.commands.push({ type: 'L', x: currentPoint.x, y: currentPoint.y });
    }
  }

  private handleHorizontalLineCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }
  ): void {
    const isRelative = cmd === 'h';
    
    for (let i = 0; i < params.length; i++) {
      if (isRelative) {
        currentPoint.x += params[i];
      } else {
        currentPoint.x = params[i];
      }
      this.commands.push({ type: 'L', x: currentPoint.x, y: currentPoint.y });
    }
  }

  private handleVerticalLineCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }
  ): void {
    const isRelative = cmd === 'v';
    
    for (let i = 0; i < params.length; i++) {
      if (isRelative) {
        currentPoint.y += params[i];
      } else {
        currentPoint.y = params[i];
      }
      this.commands.push({ type: 'L', x: currentPoint.x, y: currentPoint.y });
    }
  }

  private handleCubicBezierCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }
  ): { x: number, y: number } | null {
    const isRelative = cmd === 'c';
    let lastCP2 = null;
    
    for (let i = 0; i + 5 < params.length; i += 6) {
      let cp1x, cp1y, cp2x, cp2y, x, y;
      
      if (isRelative) {
        cp1x = currentPoint.x + params[i];
        cp1y = currentPoint.y + params[i + 1];
        cp2x = currentPoint.x + params[i + 2];
        cp2y = currentPoint.y + params[i + 3];
        x = currentPoint.x + params[i + 4];
        y = currentPoint.y + params[i + 5];
      } else {
        cp1x = params[i];
        cp1y = params[i + 1];
        cp2x = params[i + 2];
        cp2y = params[i + 3];
        x = params[i + 4];
        y = params[i + 5];
      }
      
      this.commands.push({ 
        type: 'C', 
        cp1x, cp1y, 
        cp2x, cp2y, 
        x, y 
      });
      
      // Update the last control point for subsequent smooth curve commands
      lastCP2 = { x: cp2x, y: cp2y };
      
      // Update current point
      currentPoint.x = x;
      currentPoint.y = y;
    }
    
    return lastCP2;
  }

  private handleSmoothCubicBezierCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number },
    lastControlPoint: { x: number, y: number } | null
  ): { x: number, y: number } | null {
    const isRelative = cmd === 's';
    let lastCP2 = null;
    
    for (let i = 0; i + 3 < params.length; i += 4) {
      // First control point is reflection of the last control point
      let cp1x, cp1y, cp2x, cp2y, x, y;
      
      // Calculate reflected control point
      if (lastControlPoint && this.isLastCommandCubicBezier()) {
        cp1x = 2 * currentPoint.x - lastControlPoint.x;
        cp1y = 2 * currentPoint.y - lastControlPoint.y;
      } else {
        cp1x = currentPoint.x;
        cp1y = currentPoint.y;
      }
      
      if (isRelative) {
        cp2x = currentPoint.x + params[i];
        cp2y = currentPoint.y + params[i + 1];
        x = currentPoint.x + params[i + 2];
        y = currentPoint.y + params[i + 3];
      } else {
        cp2x = params[i];
        cp2y = params[i + 1];
        x = params[i + 2];
        y = params[i + 3];
      }
      
      this.commands.push({ 
        type: 'C', 
        cp1x, cp1y, 
        cp2x, cp2y, 
        x, y 
      });
      
      // Update the last control point for subsequent smooth curve commands
      lastCP2 = { x: cp2x, y: cp2y };
      
      // Update current point
      currentPoint.x = x;
      currentPoint.y = y;
    }
    
    return lastCP2;
  }

  private handleQuadraticBezierCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }
  ): { x: number, y: number } | null {
    const isRelative = cmd === 'q';
    let lastCP = null;
    
    for (let i = 0; i + 3 < params.length; i += 4) {
      let cx, cy, x, y;
      
      if (isRelative) {
        cx = currentPoint.x + params[i];
        cy = currentPoint.y + params[i + 1];
        x = currentPoint.x + params[i + 2];
        y = currentPoint.y + params[i + 3];
      } else {
        cx = params[i];
        cy = params[i + 1];
        x = params[i + 2];
        y = params[i + 3];
      }
      
      this.commands.push({ 
        type: 'Q', 
        cx, cy, 
        x, y 
      });
      
      // Update the last control point for subsequent smooth curve commands
      lastCP = { x: cx, y: cy };
      
      // Update current point
      currentPoint.x = x;
      currentPoint.y = y;
    }
    
    return lastCP;
  }

  private handleSmoothQuadraticBezierCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number },
    lastControlPoint: { x: number, y: number } | null
  ): { x: number, y: number } | null {
    const isRelative = cmd === 't';
    let lastCP = null;
    
    for (let i = 0; i + 1 < params.length; i += 2) {
      let cx, cy, x, y;
      
      // Calculate reflected control point
      if (lastControlPoint && this.isLastCommandQuadraticBezier()) {
        cx = 2 * currentPoint.x - lastControlPoint.x;
        cy = 2 * currentPoint.y - lastControlPoint.y;
      } else {
        cx = currentPoint.x;
        cy = currentPoint.y;
      }
      
      if (isRelative) {
        x = currentPoint.x + params[i];
        y = currentPoint.y + params[i + 1];
      } else {
        x = params[i];
        y = params[i + 1];
      }
      
      this.commands.push({ 
        type: 'Q', 
        cx, cy, 
        x, y 
      });
      
      // Update the last control point for subsequent smooth curve commands
      lastCP = { x: cx, y: cy };
      
      // Update current point
      currentPoint.x = x;
      currentPoint.y = y;
    }
    
    return lastCP;
  }

  private handleArcCommand(
    cmd: string, 
    params: number[], 
    currentPoint: { x: number, y: number }
  ): void {
    const isRelative = cmd === 'a';
    
    for (let i = 0; i + 6 < params.length; i += 7) {
      const rx = Math.abs(params[i]);
      const ry = Math.abs(params[i + 1]);
      const xAxisRotation = params[i + 2];
      const largeArcFlag = params[i + 3] ? 1 : 0;
      const sweepFlag = params[i + 4] ? 1 : 0;
      
      let x, y;
      if (isRelative) {
        x = currentPoint.x + params[i + 5];
        y = currentPoint.y + params[i + 6];
      } else {
        x = params[i + 5];
        y = params[i + 6];
      }
      
      // Skip zero-radius arcs
      if (rx === 0 || ry === 0) {
        this.commands.push({ type: 'L', x, y });
      } else {
        this.commands.push({ 
          type: 'A', 
          rx, ry, 
          xAxisRotation, 
          largeArcFlag, 
          sweepFlag, 
          x, y 
        });
      }
      
      // Update current point
      currentPoint.x = x;
      currentPoint.y = y;
    }
  }

  private isLastCommandCubicBezier(): boolean {
    if (this.commands.length === 0) return false;
    const lastCommand = this.commands[this.commands.length - 1];
    return lastCommand.type === 'C';
  }

  private isLastCommandQuadraticBezier(): boolean {
    if (this.commands.length === 0) return false;
    const lastCommand = this.commands[this.commands.length - 1];
    return lastCommand.type === 'Q';
  }

  public draw(): void {
    if (this.commands.length === 0) {
      return;
    }

    this.p.push();

    if (this.transform) {
      applyTransform(this.p, this.transform);
    }

    this.applyStyles();

    let currentSubpath: PathCommand[] = [];
    let currentPathStarted = false;

    for (let i = 0; i < this.commands.length; i++) {
      const cmd = this.commands[i];
      console.log(`Processing command: ${cmd.type}`, cmd);

      if (cmd.type === 'M') {
        if (currentPathStarted) {
          console.log("Ending current subpath...");
          this.drawSubpath(currentSubpath);
        }
        console.log("Starting new subpath...");
        currentSubpath = [cmd];
        currentPathStarted = true;
      } else if (currentPathStarted) {
        currentSubpath.push(cmd);
      }
    }

    if (currentSubpath.length > 0) {
      console.log("Drawing final subpath...");
      this.drawSubpath(currentSubpath);
    }

    console.log("Finished drawing path.");
    this.p.pop();
  }

  private drawSubpath(subpath: PathCommand[]): void {
    if (subpath.length === 0) {
      console.log("Empty subpath, skipping...");
      return;
    }

    console.log("Drawing subpath:", subpath);

    let isClosed = false;
    if (subpath[subpath.length - 1].type === 'Z') {
      isClosed = true;
      console.log("Subpath is closed.");
    }

    this.p.beginShape();

    if (subpath[0].type === 'M') {
      const firstCmd = subpath[0] as PointCommand;
      console.log(`Move to (${firstCmd.x}, ${firstCmd.y})`);
      this.p.vertex(firstCmd.x, firstCmd.y);
    }

    for (let i = 1; i < subpath.length; i++) {
      const cmd = subpath[i];
      switch (cmd.type) {
        case 'L':
          console.log(`Line to (${(cmd as PointCommand).x}, ${(cmd as PointCommand).y})`);
          this.p.vertex((cmd as PointCommand).x, (cmd as PointCommand).y);
          break;
        case 'C': {
          const bezierCmd = cmd as CubicBezierCommand;
          console.log(
            `Cubic Bézier to (${bezierCmd.x}, ${bezierCmd.y}) with control points (${bezierCmd.cp1x}, ${bezierCmd.cp1y}) and (${bezierCmd.cp2x}, ${bezierCmd.cp2y})`
          );
          this.p.bezierVertex(
            bezierCmd.cp1x, bezierCmd.cp1y,
            bezierCmd.cp2x, bezierCmd.cp2y,
            bezierCmd.x, bezierCmd.y
          );
          break;
        }
        case 'Q': {
          const quadCmd = cmd as QuadraticBezierCommand;
          console.log(
            `Quadratic Bézier to (${quadCmd.x}, ${quadCmd.y}) with control point (${quadCmd.cx}, ${quadCmd.cy})`
          );
          this.p.quadraticVertex(
            quadCmd.cx, quadCmd.cy,
            quadCmd.x, quadCmd.y
          );
          break;
        }
        case 'A': {
          const arcCmd = cmd as ArcCommand;
          console.log(
            `Arc to (${arcCmd.x}, ${arcCmd.y}) with radii (${arcCmd.rx}, ${arcCmd.ry}), rotation ${arcCmd.xAxisRotation}, largeArcFlag ${arcCmd.largeArcFlag}, sweepFlag ${arcCmd.sweepFlag}`
          );
          const prevPoint = this.getPreviousPointForCommand(subpath, i);
          if (prevPoint) {
            this.drawArc(prevPoint, arcCmd);
          }
          break;
        }
        case 'Z':
          console.log("Close path command.");
          break;
      }
    }

    this.p.endShape(isClosed ? this.p.CLOSE : undefined);
  }

  private getPreviousPointForCommand(subpath: PathCommand[], currentIndex: number): { x: number, y: number } | null {
    if (currentIndex <= 0 || currentIndex >= subpath.length) return null;
    
    // Find the previous command with a point
    for (let i = currentIndex - 1; i >= 0; i--) {
      const cmd = subpath[i];
      if ('x' in cmd && 'y' in cmd) {
        return { x: cmd.x, y: cmd.y };
      }
    }
    
    return null;
  }

  private drawArc(
    startPoint: { x: number, y: number }, 
    arcCmd: ArcCommand
  ): void {
    const { rx, ry, xAxisRotation, largeArcFlag, sweepFlag, x, y } = arcCmd;
    
    // Convert the SVG arc to bezier curves
    const bezierPoints = this.arcToBezier(
      startPoint.x, startPoint.y, 
      x, y, 
      rx, ry, 
      xAxisRotation * Math.PI / 180, 
      largeArcFlag === 1, 
      sweepFlag === 1
    );
    
    for (let i = 0; i < bezierPoints.length; i += 3) {
      this.p.bezierVertex(
        bezierPoints[i].x, bezierPoints[i].y,
        bezierPoints[i + 1].x, bezierPoints[i + 1].y,
        bezierPoints[i + 2].x, bezierPoints[i + 2].y
      );
    }
  }

  private arcToBezier(
    x1: number, y1: number, 
    x2: number, y2: number, 
    rx: number, ry: number, 
    phi: number, 
    largeArc: boolean, 
    sweep: boolean
  ): Array<{ x: number, y: number }> {
    if (rx === 0 || ry === 0) {
      // Treat as a straight line
      return [];
    }

    // Correction for out-of-range radii
    const dx = x2 - x1;
    const dy = y2 - y1;
    const d = Math.sqrt(dx * dx + dy * dy);
    
    // Ensure radii are large enough
    if (d > 2 * Math.max(rx, ry)) {
      rx = d / 2;
      ry = d / 2;
    }

    // SVG implementation notes F.6.6
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    
    // F.6.5.1: Step 1
    const x1p = cosPhi * (x1 - x2) / 2 + sinPhi * (y1 - y2) / 2;
    const y1p = -sinPhi * (x1 - x2) / 2 + cosPhi * (y1 - y2) / 2;
    
    // F.6.5.2: Step 2
    const lambda = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
    if (lambda > 1) {
      rx *= Math.sqrt(lambda);
      ry *= Math.sqrt(lambda);
    }
    
    // F.6.5.3: Step 3
    const sign = largeArc !== sweep ? 1 : -1;
    const sq = Math.max(0, (rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p) / 
                          (rx * rx * y1p * y1p + ry * ry * x1p * x1p));
    const coef = sign * Math.sqrt(sq);
    
    const cxp = coef * ((rx * y1p) / ry);
    const cyp = coef * -((ry * x1p) / rx);
    
    // F.6.5.4: Step 4
    const cx = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
    const cy = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;
    
    // F.6.5.5: Step 5
    const theta1 = this.angle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
    const dTheta = this.angle(
      (x1p - cxp) / rx, (y1p - cyp) / ry,
      (-x1p - cxp) / rx, (-y1p - cyp) / ry
    ) % (2 * Math.PI);
    
    // Adjust delta angle for sweep direction
    let delta = dTheta;
    if (sweep === false && dTheta > 0) {
      delta = dTheta - 2 * Math.PI;
    } else if (sweep === true && dTheta < 0) {
      delta = dTheta + 2 * Math.PI;
    }
    
    // Convert arc to bezier segments
    return this.arcToBezierSegments(cx, cy, rx, ry, theta1, delta, sinPhi, cosPhi);
  }

  private angle(ux: number, uy: number, vx: number, vy: number): number {
    const dot = ux * vx + uy * vy;
    const len = Math.sqrt((ux * ux + uy * uy) * (vx * vx + vy * vy));
    
    // Handle zero vectors
    if (len === 0) return 0;
    
    let angle = Math.acos(Math.max(-1, Math.min(1, dot / len)));
    if (ux * vy - uy * vx < 0) {
      angle = -angle;
    }
    
    return angle;
  }

  private arcToBezierSegments(
    cx: number, cy: number, 
    rx: number, ry: number, 
    theta1: number, delta: number, 
    sinPhi: number, cosPhi: number
  ): Array<{ x: number, y: number }> {
    const result: Array<{ x: number, y: number }> = [];
    
    // Maximum degrees per segment (90 degrees = π/2 radians)
    const maxSegmentAngle = Math.PI / 2;
    
    // Calculate number of segments
    const segments = Math.max(Math.ceil(Math.abs(delta) / maxSegmentAngle), 1);
    const deltaPerSegment = delta / segments;
    
    for (let i = 0; i < segments; i++) {
      const theta2 = theta1 + deltaPerSegment;
      
      // Calculate Bezier control points
      const bezierPoints = this.singleArcToBezier(
        cx, cy, rx, ry, 
        theta1, theta2, 
        sinPhi, cosPhi
      );
      
      result.push(...bezierPoints);
      
      theta1 = theta2;
    }
    
    return result;
  }

  private singleArcToBezier(
    cx: number, cy: number, 
    rx: number, ry: number, 
    theta1: number, theta2: number, 
    sinPhi: number, cosPhi: number
  ): Array<{ x: number, y: number }> {
    // Calculate Bezier approximation factor
    const alpha = Math.sin(theta2 - theta1) * (Math.sqrt(4 + 3 * Math.tan((theta2 - theta1) / 2) * Math.tan((theta2 - theta1) / 2)) - 1) / 3;
    
    const sinTheta1 = Math.sin(theta1);
    const cosTheta1 = Math.cos(theta1);
    const sinTheta2 = Math.sin(theta2);
    const cosTheta2 = Math.cos(theta2);
    
    // Calculate control points
    const p1x = cx + rx * cosTheta1;
    const p1y = cy + ry * sinTheta1;
    
    const p2x = cx + rx * cosTheta2;
    const p2y = cy + ry * sinTheta2;
    
    const c1x = p1x - alpha * rx * sinTheta1;
    const c1y = p1y + alpha * ry * cosTheta1;
    
    const c2x = p2x + alpha * rx * sinTheta2;
    const c2y = p2y - alpha * ry * cosTheta2;
    
    // Transform points back to original coordinate system
    return [
      { 
        x: cosPhi * c1x - sinPhi * c1y, 
        y: sinPhi * c1x + cosPhi * c1y
      },
      { 
        x: cosPhi * c2x - sinPhi * c2y, 
        y: sinPhi * c2x + cosPhi * c2y
      },
      { 
        x: cosPhi * p2x - sinPhi * p2y, 
        y: sinPhi * p2x + cosPhi * p2y
      }
    ];
  }

  public getDebugInfo(): string[] {
    const pathData = this.xmlElement.getString('d');
    return [
      `Path(${this.commands.length}): ${pathData ? pathData.substring(0, 80) + (pathData.length > 80 ? '...' : '') : 'No path data'}`,
    ];
  }
}