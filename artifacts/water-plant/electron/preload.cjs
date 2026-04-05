const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
  getMachineStatus: () => ipcRenderer.invoke("get-machine-status"),
  submitActivation: (code) => ipcRenderer.invoke("submit-activation", code),
});
