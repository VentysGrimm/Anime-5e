import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moduleRoot = path.resolve(process.argv[2] ?? path.join(repoRoot, "module-template"));
const requiredDirectories = ["packs", "scripts", "assets", "lang", "docs"];
const errors = [];
let sourceFileCount = 0;
let sourceDocumentCount = 0;

function relativeToModule(absolutePath) {
  return path.relative(moduleRoot, absolutePath).replaceAll(path.sep, "/") || ".";
}

function fail(message) {
  errors.push(message);
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function readJson(relativePath) {
  const absolutePath = path.join(moduleRoot, relativePath);
  if (!fs.existsSync(absolutePath)) {
    fail(`Missing JSON file: ${relativePath}`);
    return null;
  }

  try {
    return JSON.parse(fs.readFileSync(absolutePath, "utf8"));
  } catch (error) {
    fail(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function sourceObjectFromSystem(system = {}) {
  return system.source && typeof system.source === "object" ? system.source : {};
}

function sourceBookFromSystem(system = {}) {
  return typeof system.source === "string" ? system.source : null;
}

function getDocumentMetadata(source, document, manifest) {
  const system = document.system ?? {};
  const systemSource = sourceObjectFromSystem(system);
  const flagSource = document.flags?.anime5e?.source ?? {};

  return {
    book: flagSource.book ?? systemSource.book ?? sourceBookFromSystem(system) ?? document.source ?? source.sourceBook,
    page: flagSource.page ?? systemSource.page ?? system.sourcePage ?? document.sourcePage ?? source.sourcePage,
    abbreviation: flagSource.abbreviation ?? systemSource.abbreviation ?? system.sourceAbbreviation ?? document.sourceAbbreviation ?? source.sourceAbbreviation,
    moduleId: flagSource.moduleId ?? systemSource.moduleId ?? system.sourceModuleId ?? document.sourceModuleId ?? source.sourceModuleId ?? manifest.id,
    category: flagSource.category ?? systemSource.category ?? system.sourceCategory ?? document.sourceCategory ?? source.contentCategory ?? document.type,
    sourceId: document.flags?.anime5e?.sourceId ?? systemSource.sourceId ?? system.sourceId ?? document.sourceId,
    importId: flagSource.importId ?? systemSource.importId ?? system.importId ?? document.importId,
    rank: system.rank ?? document.rank,
    cost: system.cost ?? document.cost
  };
}

function validatePackDirectories(manifest) {
  for (const directory of requiredDirectories) {
    const absolutePath = path.join(moduleRoot, directory);
    if (!fs.existsSync(absolutePath) || !fs.statSync(absolutePath).isDirectory()) {
      fail(`Missing required module directory: ${directory}`);
    }
  }

  for (const pack of manifest.packs ?? []) {
    if (!pack.name) fail("A module pack is missing a name.");
    if (!pack.path) fail(`Module pack "${pack.name ?? "(unnamed)"}" is missing a path.`);
    if (!pack.type) fail(`Module pack "${pack.name ?? "(unnamed)"}" is missing a type.`);
    if (!pack.path) continue;

    const normalized = path.normalize(pack.path);
    if (path.isAbsolute(pack.path) || normalized.startsWith("..")) {
      fail(`Module pack "${pack.name}" must use a relative path: ${pack.path}`);
      continue;
    }

    const absolutePackPath = path.join(moduleRoot, pack.path);
    if (!fs.existsSync(absolutePackPath) || !fs.statSync(absolutePackPath).isDirectory()) {
      fail(`Module pack path does not exist: ${pack.name} -> ${pack.path}`);
    }
  }
}

function collectPackFolderNames(folders = []) {
  const names = new Set();
  for (const folder of folders) {
    for (const packName of folder.packs ?? []) names.add(packName);
    for (const nestedName of collectPackFolderNames(folder.folders ?? [])) names.add(nestedName);
  }

  return names;
}

function validatePackFolderCoverage(manifest) {
  if (!Array.isArray(manifest.packFolders) || !manifest.packFolders.length) {
    fail("module.json must declare book-level packFolders for compendium sidebar grouping.");
    return;
  }

  const packNames = new Set((manifest.packs ?? []).map((pack) => pack.name));
  const folderPackNames = collectPackFolderNames(manifest.packFolders);

  for (const packName of packNames) {
    if (!folderPackNames.has(packName)) {
      fail(`Module pack "${packName}" is not assigned to a packFolders entry.`);
    }
  }

  for (const packName of folderPackNames) {
    if (!packNames.has(packName)) {
      fail(`packFolders references unknown pack "${packName}".`);
    }
  }
}

function validateManifest(manifest) {
  if (!manifest) return;
  if (!manifest.id) fail("module.json is missing id.");
  if (!manifest.title) fail("module.json is missing title.");
  if (!manifest.version) fail("module.json is missing version.");

  const systems = manifest.relationships?.systems ?? [];
  if (!systems.some((system) => system.id === "anime5e")) {
    fail("module.json must declare an Anime 5e system dependency in relationships.systems.");
  }

  if (!Array.isArray(manifest.packs) || !manifest.packs.length) {
    fail("module.json must declare at least one compendium pack.");
  }

  validatePackDirectories(manifest);
  validatePackFolderCoverage(manifest);
}

function expectedPackIds(manifest) {
  return new Set((manifest.packs ?? []).map((pack) => `${manifest.id}.${pack.name}`));
}

function getSourceDocuments(source) {
  return [...(source.documents ?? []), ...(source.entries ?? [])];
}

function validateSourceDocument(relativePath, source, document, manifest) {
  const label = `${relativePath} -> ${document.name ?? "(unnamed document)"}`;
  const metadata = getDocumentMetadata(source, document, manifest);

  if (!document.name) fail(`${label} is missing name.`);
  if (!hasValue(metadata.book)) fail(`${label} is missing source book.`);
  if (!hasValue(metadata.page)) fail(`${label} is missing source page.`);
  if (!hasValue(metadata.abbreviation)) fail(`${label} is missing source abbreviation.`);
  if (!hasValue(metadata.moduleId)) fail(`${label} is missing source module id.`);
  if (!hasValue(metadata.category)) fail(`${label} is missing source category.`);
  if (!hasValue(metadata.sourceId)) fail(`${label} is missing sourceId.`);
  if (!hasValue(metadata.importId)) fail(`${label} is missing importId.`);

  if (hasValue(metadata.sourceId) && hasValue(metadata.importId) && metadata.sourceId !== metadata.importId) {
    fail(`${label} has mismatched sourceId/importId metadata.`);
  }

  if ((source.documentType ?? "").toLowerCase() === "item") {
    if (!hasValue(document.type)) fail(`${label} is an Item source document without an item type.`);
    if (!hasValue(metadata.rank)) fail(`${label} is missing rank.`);
    if (!hasValue(metadata.cost)) fail(`${label} is missing cost.`);
  }
}

function validateSource(relativePath, source, manifest, packIds, seen = new Set()) {
  if (!source || seen.has(relativePath)) return;
  seen.add(relativePath);
  sourceFileCount += 1;

  for (const includePath of source.includes ?? []) {
    const include = readJson(includePath);
    validateSource(includePath, include, manifest, packIds, seen);
  }

  if (!source.pack) return;

  if (!packIds.has(source.pack)) {
    fail(`${relativePath} references pack ${source.pack}, but module.json does not declare it.`);
  }

  if (!source.documentType) {
    fail(`${relativePath} is missing documentType.`);
  }

  const folderNames = new Set((source.folders ?? []).map((folder) => folder.name));
  for (const document of getSourceDocuments(source)) {
    sourceDocumentCount += 1;
    validateSourceDocument(relativePath, source, document, manifest);

    if (document.folder && !folderNames.has(document.folder)) {
      fail(`${relativePath} -> ${document.name ?? "(unnamed document)"} references missing folder ${document.folder}.`);
    }
  }
}

const manifest = readJson("module.json");
validateManifest(manifest);

if (manifest) {
  const sourceManifest = readJson("data/source-manifest.json");
  validateSource("data/source-manifest.json", sourceManifest, manifest, expectedPackIds(manifest));
}

if (errors.length) {
  console.error(`Anime 5e content module validation failed for ${relativeToModule(moduleRoot)}:`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(
    `Validated Anime 5e content module ${manifest.title} ${manifest.version}: ` +
    `${manifest.packs.length} packs, ${sourceFileCount} source JSON files, ${sourceDocumentCount} source documents.`
  );
}
