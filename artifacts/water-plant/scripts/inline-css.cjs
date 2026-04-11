const fs = require("fs");
const path = require("path");

const distDir = path.join(__dirname, "..", "dist");
const htmlPath = path.join(distDir, "index.html");

let html = fs.readFileSync(htmlPath, "utf-8");

html = html.replace(/<link rel="preconnect"[^>]*>\s*/g, "");
html = html.replace(/<link[^>]*fonts\.googleapis\.com[^>]*>\s*/g, "");
html = html.replace(/ crossorigin(?:="[^"]*")?/g, "");

const assetsDir = path.join(distDir, "assets");
const cssFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".css"));

for (const cssFile of cssFiles) {
  const cssPath = path.join(assetsDir, cssFile);
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  const escaped = cssFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const linkRegex = new RegExp(
    `<link[^>]*href=["'][^"']*${escaped}["'][^>]*>`
  );
  html = html.replace(linkRegex, `<style>${cssContent}</style>`);
  fs.unlinkSync(cssPath);
}

fs.writeFileSync(htmlPath, html, "utf-8");
console.log("CSS inlined into index.html successfully!");
