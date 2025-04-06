import p5 from 'p5';
import { Root } from './svg/root';
import { initFileUploadHandler } from './fileUploadHandler';

const sketch = (p: p5) => {
  let svg: Root | undefined;
  let xml: p5.XML | undefined;
  let debugContainer: HTMLElement | null;
  let needsRedraw = true;

  const requestRedraw = () => {
    needsRedraw = true;
  };

  p.preload = () => {
    xml = p.loadXML('svg/assets/example.svg') as p5.XML;
  };

  const loadSVGFromFile = (svgContent: string) => {
    try {
      const parser = new DOMParser();
      const svgDocument = parser.parseFromString(svgContent, 'text/xml');

      const XML = p5.XML as unknown as new (xml: Element) => p5.XML;

      xml = new XML(svgDocument.documentElement as any);
      console.log('Parsed XML:', xml); // Debug log to verify XML content

      svg = new Root(p, xml);
      console.log('Initialized Root:', svg); // Debug log to verify Root initialization

      p.resizeCanvas(svg.width, svg.height);
      requestRedraw();
    } catch (error) {
      console.error('Error loading SVG:', error);
    }
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

    // Initialize file upload handler
    initFileUploadHandler(loadSVGFromFile);
  };

  p.draw = () => {
    if (!needsRedraw || !svg) {
      return;
    }

    needsRedraw = false;
    p.background(255);

    console.log('Calling svg.draw()'); // Debug log to verify draw call
    svg.draw();

    if (debugContainer) {
      debugContainer.innerHTML = '';
      const debugInfo = svg.getDebugInfo();
      console.log('Debug Info:', debugInfo); // Debug log to verify debug info

      for (const info of debugInfo) {
        const div = document.createElement('div');
        div.textContent = info;
        debugContainer.appendChild(div);
      }
    }
  };

  window.addEventListener('resize', () => {
    requestRedraw();
  });
};

new p5(sketch);