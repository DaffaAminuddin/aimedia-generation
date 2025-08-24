// Sanitize a string to be used as a filename.
export const sanitizeFilename = (text: string, maxLength: number = 50): string => {
  if (!text) {
    return 'untitled';
  }
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (a-z, 0-9, _), except spaces and hyphens.
    .replace(/[\s-]+/g, '_')   // Replace spaces and hyphens with a single underscore.
    .substring(0, maxLength);
};

// Programmatically triggers a file download in the browser.
export const downloadFile = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  // Append to the document, click, and then remove.
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
