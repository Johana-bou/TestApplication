// electron/preload.js
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  printPDF: (base64Data, fileName = 'document.pdf') => 
    ipcRenderer.invoke('print-pdf', { base64Data, fileName }),
  downloadPDF: (base64Data, fileName = 'document.pdf') => 
    ipcRenderer.invoke('download-pdf', { base64Data, fileName })
});