const { app, BrowserWindow, shell, dialog } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");

const isDev = process.env.NODE_ENV === "development";

// ─── Machine ID Lock ─────────────────────────────────────────────────────────
function getMachineFingerprint() {
  const interfaces = os.networkInterfaces();
  const macs = [];
  for (const iface of Object.values(interfaces)) {
    for (const info of iface) {
      if (!info.internal && info.mac && info.mac !== "00:00:00:00:00:00") {
        macs.push(info.mac);
      }
    }
  }
  macs.sort();
  const raw = [
    os.hostname(),
    os.cpus()[0]?.model || "",
    macs.join(","),
    os.platform(),
    os.arch(),
  ].join("|");
  return crypto.createHash("sha256").update(raw).digest("hex");
}

function getLicensePath() {
  return path.join(app.getPath("userData"), "license.dat");
}

function checkMachineLock() {
  if (isDev) return true; // Skip lock in development

  const licensePath = getLicensePath();
  const currentId = getMachineFingerprint();

  if (!fs.existsSync(licensePath)) {
    // First run — lock this machine
    fs.writeFileSync(licensePath, currentId, "utf8");
    return true;
  }

  const savedId = fs.readFileSync(licensePath, "utf8").trim();
  return savedId === currentId;
}
// ─────────────────────────────────────────────────────────────────────────────

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    title: "Water Plant Manager",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.cjs"),
    },
    icon: path.join(__dirname, "../public/icon.png"),
    // Hide menu bar (cleaner look)
    autoHideMenuBar: true,
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:21762/");
    mainWindow.webContents.openDevTools();
  } else {
    const indexPath = path.join(__dirname, "../dist/index.html");
    mainWindow.loadURL(pathToFileURL(indexPath).toString());
  }

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Machine lock check
  if (!checkMachineLock()) {
    dialog.showErrorBox(
      "Unauthorized — License Error",
      "This software is licensed for use on a specific computer only.\n\n" +
      "It cannot be used on a different machine.\n\n" +
      "Contact Devoria Tech for assistance:\n+92 311 7597815"
    );
    app.quit();
    return;
  }

  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
