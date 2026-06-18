import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "system.json",
  "template.json",
  "lang/en.json",
  "scripts/anime5e.mjs",
  "module/documents/actor-data.mjs",
  "module/documents/item-data.mjs",
  "module/sheets/actor-sheet.mjs",
  "module/sheets/item-sheet.mjs",
  "templates/actor-sheet.hbs",
  "templates/item-sheet.hbs",
  "styles/anime5e.css"
];

function readJson(relativePath) {
  const absolutePath = path.join(root, relativePath);
  return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
}

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(root, relativePath))) {
    throw new Error(`Missing required file: ${relativePath}`);
  }
}

const manifest = readJson("system.json");
readJson("template.json");
readJson("lang/en.json");

for (const esmodule of manifest.esmodules ?? []) {
  if (!fs.existsSync(path.join(root, esmodule))) {
    throw new Error(`Manifest esmodule does not exist: ${esmodule}`);
  }
}

for (const stylesheet of manifest.styles ?? []) {
  if (!fs.existsSync(path.join(root, stylesheet))) {
    throw new Error(`Manifest stylesheet does not exist: ${stylesheet}`);
  }
}

for (const language of manifest.languages ?? []) {
  if (!fs.existsSync(path.join(root, language.path))) {
    throw new Error(`Manifest language file does not exist: ${language.path}`);
  }
}

if (manifest.id !== "anime5e") {
  throw new Error(`Unexpected system id: ${manifest.id}`);
}

if (!manifest.compatibility || manifest.compatibility.minimum !== "14") {
  throw new Error("Foundry v14 minimum compatibility is not declared.");
}

console.log(`Validated ${manifest.title} ${manifest.version}.`);
