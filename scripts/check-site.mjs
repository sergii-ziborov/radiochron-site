import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");
const htmlFiles = (await readdir(publicDir))
  .filter((name) => name.endsWith(".html"))
  .sort();

if (htmlFiles.length === 0) {
  throw new Error("No HTML files found in public/");
}

function localTarget(rawValue) {
  if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(rawValue)) return null;

  const value = rawValue.split(/[?#]/, 1)[0];
  if (!value) return null;

  const normalized = value.startsWith("/") ? value.slice(1) : value;
  if (!normalized) return "index.html";
  if (path.extname(normalized)) return normalized;
  return `${normalized.replace(/\/$/, "")}.html`;
}

for (const file of htmlFiles) {
  const source = await readFile(path.join(publicDir, file), "utf8");
  const required = [
    [/<title>[^<]+<\/title>/i, "a non-empty title"],
    [/<link\s+rel=["']canonical["'][^>]+>/i, "a canonical link"],
    [/<link\s+rel=["']stylesheet["'][^>]+>/i, "a stylesheet link"],
  ];

  for (const [pattern, label] of required) {
    if (!pattern.test(source)) throw new Error(`${file} is missing ${label}`);
  }

  for (const match of source.matchAll(/(?:href|src)=["']([^"']+)["']/gi)) {
    const target = localTarget(match[1]);
    if (!target) continue;
    try {
      await access(path.join(publicDir, target));
    } catch {
      throw new Error(`${file} links to missing local file: ${match[1]}`);
    }
  }

  for (const retiredSurface of ["radiochron-agent", "radiochron-fleet"]) {
    if (source.includes(retiredSurface)) {
      throw new Error(`${file} still promotes retired surface: ${retiredSurface}`);
    }
  }
}

const index = await readFile(path.join(publicDir, "index.html"), "utf8");
for (const repository of [
  "radiochron",
  "radiochron-mcp",
  "radiochron-js",
  "radiochron-electron",
  "radiochron-site",
]) {
  const url = `https://github.com/sergii-ziborov/${repository}`;
  if (!index.includes(url)) throw new Error(`index.html is missing repository link: ${url}`);
}


const electron = await readFile(path.join(publicDir, "electron.html"), "utf8");
for (const asset of [
  "RadioChron-Desktop-0.2.0-Windows-x64.exe",
  "RadioChron-Desktop-0.2.0-macOS-Apple-Silicon.dmg",
  "RadioChron-Desktop-0.2.0-macOS-Intel.dmg",
]) {
  if (!electron.includes(asset)) throw new Error(`electron.html is missing download: ${asset}`);
}

for (const screenshot of ["overview", "map", "network", "bluetooth", "channels"]) {
  const path = `/screenshots/radiochron-desktop-${screenshot}.png`;
  if (!index.includes(path) || !electron.includes(path)) {
    throw new Error(`desktop screenshot is not shown on both product pages: ${path}`);
  }
}

if (/<script\s+[^>]*src=/i.test(index)) {
  throw new Error("The static site must not load client-side scripts");
}

console.log(`Verified ${htmlFiles.length} HTML files and their local links.`);
