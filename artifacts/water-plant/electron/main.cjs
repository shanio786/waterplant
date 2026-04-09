const { app, BrowserWindow, shell, dialog, ipcMain } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const os = require("os");
const fs = require("fs");
const crypto = require("crypto");

const isDev = process.env.NODE_ENV === "development";

// ─── Portable Data Folder (next to EXE) ──────────────────────────────────────
// electron-builder portable apps extract to TEMP — use PORTABLE_EXECUTABLE_DIR
// to get the real folder where the .exe was double-clicked from.
if (!isDev) {
  try {
    const exeDir =
      process.env.PORTABLE_EXECUTABLE_DIR ||   // set by electron-builder portable wrapper
      path.dirname(process.execPath) ||         // fallback
      path.dirname(app.getPath("exe"));
    const dataDir = path.join(exeDir, "WaterPlantData");
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    app.setPath("userData", dataDir);
  } catch (e) {
    // fall back to default AppData if path cannot be set
  }
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── Secret Key (change this to your own secret before distributing) ──────────
const SECRET_KEY = "DEVORIA-TECH-WPM-2026-SECRET-XK9";
// ─────────────────────────────────────────────────────────────────────────────

// ─── Machine ID Generation ───────────────────────────────────────────────────
function getRawMachineId() {
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
  return crypto.createHash("sha256").update(raw).digest("hex").toUpperCase();
}

// Display format: XXXX-XXXX-XXXX-XXXX (first 16 chars, grouped)
function formatId(hash) {
  return hash.slice(0, 16).match(/.{4}/g).join("-");
}

// Generate expected activation code from machine ID
function generateActivationCode(machineId) {
  return crypto
    .createHmac("sha256", SECRET_KEY)
    .update(machineId)
    .digest("hex")
    .toUpperCase()
    .slice(0, 16)
    .match(/.{4}/g)
    .join("-");
}
// ─────────────────────────────────────────────────────────────────────────────

// ─── License File ────────────────────────────────────────────────────────────
function getLicensePath() {
  return path.join(app.getPath("userData"), "activation.dat");
}

function readLicense() {
  const p = getLicensePath();
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function saveLicense(machineId, code) {
  fs.writeFileSync(
    getLicensePath(),
    JSON.stringify({ machineId, code, activatedAt: new Date().toISOString() }),
    "utf8"
  );
}

function checkActivation() {
  if (isDev) return { activated: true }; // Skip in dev

  const rawId = getRawMachineId();
  const displayId = formatId(rawId);
  const license = readLicense();

  if (!license) {
    return { activated: false, rawId, displayId };
  }

  // Verify the saved code is correct for this machine
  const idForCode = displayId.replace(/-/g, "");
  const expected = generateActivationCode(idForCode);
  const savedNormalized = (license.code || "").replace(/-/g, "").toUpperCase().slice(0, 16);
  const expectedNormalized = expected.replace(/-/g, "");

  if (savedNormalized === expectedNormalized) {
    return { activated: true, rawId, displayId };
  }

  // Machine changed or tampered — invalid
  return { activated: false, rawId, displayId };
}
// ─────────────────────────────────────────────────────────────────────────────

let mainWindow;
let activationStatus = { activated: false };

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

// ─── IPC Handlers ─────────────────────────────────────────────────────────
ipcMain.handle("get-machine-status", () => {
  return activationStatus;
});

ipcMain.handle("submit-activation", (_event, inputCode) => {
  if (!activationStatus.displayId) return { success: false, message: "Machine ID not available" };

  const idForCode = activationStatus.displayId.replace(/-/g, "");
  const expected = generateActivationCode(idForCode);
  const inputNorm = (inputCode || "").replace(/[-\s]/g, "").toUpperCase().slice(0, 16);
  const expectedNorm = expected.replace(/-/g, "");

  if (inputNorm === expectedNorm) {
    saveLicense(activationStatus.rawId, inputCode);
    activationStatus = { ...activationStatus, activated: true };
    return { success: true };
  }

  return { success: false, message: "Invalid activation code. Please contact Devoria Tech." };
});
// ─────────────────────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  activationStatus = checkActivation();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
