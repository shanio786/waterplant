/**
 * Devoria Tech — Activation Code Generator
 * 
 * Usage:
 *   node generate-activation.cjs XXXX-XXXX-XXXX-XXXX
 * 
 * Replace XXXX-XXXX-XXXX-XXXX with the Machine ID the client sends you.
 */

const crypto = require("crypto");

// ⚠️ Must match the SECRET_KEY in electron/main.cjs
const SECRET_KEY = "DEVORIA-TECH-WPM-2026-SECRET-XK9";

const input = process.argv[2];

if (!input) {
  console.log("\n❌ Machine ID dena zaroori hai!");
  console.log("\nUsage:");
  console.log("  node generate-activation.cjs XXXX-XXXX-XXXX-XXXX\n");
  process.exit(1);
}

const machineId = input.replace(/[-\s]/g, "").toUpperCase();

const code = crypto
  .createHmac("sha256", SECRET_KEY)
  .update(machineId)
  .digest("hex")
  .toUpperCase()
  .slice(0, 16)
  .match(/.{4}/g)
  .join("-");

console.log("\n✅ Activation Code Generated:");
console.log("━".repeat(40));
console.log(`   Machine ID : ${input.toUpperCase()}`);
console.log(`   Activation : ${code}`);
console.log("━".repeat(40));
console.log("\nYeh code client ko WhatsApp pe bhej dein.\n");
