import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const publicDir = path.join(root, "public");

async function collectHtmlFiles(dir, relative = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const rel = relative ? `${relative}/${entry.name}` : entry.name;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await collectHtmlFiles(abs, rel)));
    } else if (entry.name.endsWith(".html")) {
      files.push(rel.replaceAll("\\", "/"));
    }
  }
  return files.sort();
}

const htmlFiles = await collectHtmlFiles(publicDir);

if (htmlFiles.length === 0) {
  throw new Error("No HTML files found in public/");
}

function candidatePaths(rawValue) {
  if (/^(?:https?:|mailto:|tel:|data:|#)/i.test(rawValue)) return [];

  const value = rawValue.split(/[?#]/, 1)[0];
  if (!value) return [];

  const normalized = value.startsWith("/") ? value.slice(1) : value;
  if (!normalized) return ["index.html"];

  const candidates = [];
  if (path.extname(normalized)) {
    candidates.push(normalized);
  } else {
    const trimmed = normalized.replace(/\/$/, "");
    candidates.push(`${trimmed}.html`, `${trimmed}/index.html`, `${trimmed}/index.htm`);
  }
  return candidates;
}

async function assertLocalTarget(sourceFile, rawValue) {
  const candidates = candidatePaths(rawValue);
  if (candidates.length === 0) return;

  for (const candidate of candidates) {
    try {
      await access(path.join(publicDir, candidate));
      return;
    } catch {
      // try next
    }
  }
  throw new Error(`${sourceFile} links to missing local file: ${rawValue}`);
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
    await assertLocalTarget(file, match[1]);
  }

  for (const retiredSurface of ["radiochron-fleet"]) {
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
  "radiochron-agent",
  "radiochron-electron",
  "radiochron-site",
]) {
  const url = `https://github.com/sergii-ziborov/${repository}`;
  if (!index.includes(url)) throw new Error(`index.html is missing repository link: ${url}`);
}

if (!index.includes("/blog/")) {
  throw new Error("index.html is missing the blog link");
}

const sharedNav = [
  '/#verdict',
  '/#chronicle',
  '/electron',
  '/#surfaces',
  '/#tools',
  '/#straight',
  '/#roadmap',
  '/blog/',
  '/electron#download',
  '/privacy',
  'https://github.com/sergii-ziborov/radiochron',
];
for (const file of htmlFiles) {
  const source = await readFile(path.join(publicDir, file), "utf8");
  const nav = source.match(/<nav>[\s\S]*?<\/nav>/);
  if (!nav) throw new Error(`${file} is missing <nav>`);
  for (const href of sharedNav) {
    if (!nav[0].includes(`href="${href}"`)) {
      throw new Error(`${file} nav is missing shared link: ${href}`);
    }
  }
}

const electron = await readFile(path.join(publicDir, "electron.html"), "utf8");
if (!electron.includes("desktop-v0.2.0-beta.3")) {
  throw new Error("electron.html does not point to the current Desktop beta");
}
const assignedNumbers = JSON.parse(
  await readFile(path.join(publicDir, "data", "bluetooth-assigned-numbers.json"), "utf8")
);
if (
  assignedNumbers.schema_version !== 1
  || assignedNumbers.metadata?.counts?.companies < 3990
  || assignedNumbers.metadata?.counts?.services < 120
  || assignedNumbers.metadata?.counts?.appearances < 100
  || assignedNumbers.companies?.["76"] !== "Apple, Inc."
  || assignedNumbers.appearances?.["962"] !== "Mouse"
) {
  throw new Error("Bluetooth assigned-numbers snapshot is missing or incomplete");
}
for (const asset of [
  "RadioChron-Desktop-0.2.0-Windows-x64.exe",
  "RadioChron-Desktop-0.2.0-macOS-Apple-Silicon.dmg",
  "RadioChron-Desktop-0.2.0-macOS-Intel.dmg",
]) {
  if (!electron.includes(asset)) throw new Error(`electron.html is missing download: ${asset}`);
}

for (const screenshot of [
  "overview",
  "map",
  "analytics",
  "wifi-presence",
  "network",
  "bluetooth-map",
  "bluetooth-sensor-detail",
  "bluetooth-devices",
  "bluetooth-analytics",
  "bluetooth-presence",
  "channels",
]) {
  const shotPath = `/screenshots/radiochron-desktop-${screenshot}.png`;
  if (!index.includes(shotPath) || !electron.includes(shotPath)) {
    throw new Error(`desktop screenshot is not shown on both product pages: ${shotPath}`);
  }
}

if (/<script\s+[^>]*src=/i.test(index)) {
  throw new Error("The static site must not load client-side scripts");
}

const blogPost = "blog/wifi-looks-fine-after-outage-flight-recorder/index.html";
if (!htmlFiles.includes(blogPost)) {
  throw new Error(`missing research post: ${blogPost}`);
}

console.log(`Verified ${htmlFiles.length} HTML files and their local links.`);
