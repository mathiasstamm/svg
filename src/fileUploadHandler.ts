export function initFileUploadHandler(onLoadCallback: (xml: string) => void) {
  document.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  document.addEventListener('drop', (event) => {
    event.preventDefault();

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = () => {
          try {
            if (reader.result) {
              onLoadCallback(reader.result as string);
            } else {
              throw new Error('FileReader result is empty.');
            }
          } catch (error) {
            console.error('Error reading file:', error);
          }
        };
        reader.onerror = () => {
          console.error('Error occurred while reading the file:', reader.error);
        };
        reader.readAsText(file);
      } else {
        alert('Please upload a valid SVG file.');
      }
    }
  });
}
