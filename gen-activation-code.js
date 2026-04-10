const crypto = require("crypto");
const SECRET_KEY = "DEVORIA-TECH-WPM-2026-SECRET-XK9";

const machineId = process.argv[2];
if (!machineId) {
  console.log("==================================================");
  console.log("  Water Plant Manager - Activation Code Generator");
  console.log("  Devoria Tech");
  console.log("==================================================");
  console.log("");
  console.log("Usage:");
  console.log("  node gen-activation-code.js XXXX-XXXX-XXXX-XXXX");
  console.log("");
  console.log("Example:");
  console.log("  node gen-activation-code.js 4DD4-90B0-2F4B-551C");
  process.exit(1);
}

const idForCode = machineId.replace(/-/g, "").toUpperCase();

const code = crypto
  .createHmac("sha256", SECRET_KEY)
  .update(idForCode)
  .digest("hex")
  .toUpperCase()
  .slice(0, 16)
  .match(/.{4}/g)
  .join("-");

console.log("");
console.log("==================================================");
console.log("  Machine ID  :", machineId.toUpperCase());
console.log("  Activation  :", code);
console.log("==================================================");
console.log("");
console.log("Yeh code customer ko de dein.");
