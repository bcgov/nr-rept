export const triggerBrowserDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const openBlobInNewTab = (blob: Blob) => {
  const url = window.URL.createObjectURL(blob);
  // Don't revoke immediately — the new tab needs the URL to remain valid while
  // it loads. Browsers release the object URL when the tab is closed or the
  // document is unloaded.
  window.open(url, '_blank', 'noopener,noreferrer');
};
