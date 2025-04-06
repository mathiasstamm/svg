import p5 from 'p5';
import { Root } from './svg/root';

const sketch = (p: p5) => {
  let svg: Root | undefined;
  let xml: p5.XML | undefined;
  let debugContainer: HTMLElement | null;

  p.preload = () => {
    xml = p.loadXML('assets/example.svg') as p5.XML;
  };

  p.setup = () => {
    if (!xml) {
      console.error('SVG file not loaded');
      return;
    }

    svg = new Root(p, xml);
    p.createCanvas(svg.width, svg.height);

    // Create a debug container below the canvas
    debugContainer = document.createElement('div');
    debugContainer.id = 'debug-container';
    debugContainer.style.marginTop = '10px';
    debugContainer.style.padding = '10px';
    debugContainer.style.border = '1px solid #ccc';
    debugContainer.style.fontFamily = 'monospace';
    debugContainer.style.fontSize = '12px';
    debugContainer.style.backgroundColor = '#f9f9f9';
    document.body.appendChild(debugContainer);
  };

  p.draw = () => {
    if (!svg) {
      return;
    }

    p.background(255);
    svg.draw();

    // Update debug information
    if (debugContainer) {
      debugContainer.innerHTML = ''; // Clear previous debug info
      const debugInfo = svg.getDebugInfo(); // Assuming Root has a method to get debug info
      
      for (const info of debugInfo) {
        const div = document.createElement('div');
        div.textContent = info;
        debugContainer.appendChild(div);
      }
    }
  };
};

new p5(sketch);