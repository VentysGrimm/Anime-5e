import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const requiredFiles = [
  "system.json",
  "lang/en.json",
  "scripts/anime5e.mjs",
  "module/apps/compendium-import-dialog.mjs",
  "module/data/compendiums.mjs",
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

const packsById = new Map((manifest.packs ?? []).map((pack) => [`${manifest.id}.${pack.name}`, pack]));
const manifestItemTypes = new Set(Object.keys(manifest.documentTypes?.Item ?? {}));
const seenSourceIds = new Set();

function slugifySourceSegment(value) {
  return value
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSourceId(prefix, name) {
  if (!prefix) return null;
  return `${prefix}.${slugifySourceSegment(name)}`;
}

function buildDocumentFromEntry(source, entry) {
  const template = source.documentTemplate ?? {};
  const type = entry.type ?? template.type;
  const sourceId = entry.sourceId ?? buildSourceId(source.sourceIdPrefix, entry.name);

  if (!sourceId) {
    throw new Error(`Compendium entry "${entry.name}" is missing a sourceId or sourceIdPrefix.`);
  }

  const system = {
    ...(template.system ?? {}),
    ...(entry.system ?? {})
  };

  system.description = entry.description ?? system.description ?? "";
  system.rank = entry.rank ?? system.rank ?? 1;
  system.cost = entry.cost ?? system.cost ?? 0;
  system.source = entry.source ?? source.sourceBook ?? system.source ?? "";
  system.sourceId = sourceId;
  system.sourcePage = entry.sourcePage ?? system.sourcePage ?? null;
  system.importId = entry.importId ?? sourceId;

  if (type === "attribute") {
    system.category = entry.category ?? system.category ?? "";
    system.progression = entry.progression ?? system.progression ?? "";
  }

  if (type === "defect") {
    system.pointsReturned = entry.pointsReturned ?? system.pointsReturned ?? 0;
  }

  return {
    ...template,
    name: entry.name,
    type,
    folder: entry.folder ?? template.folder,
    img: entry.img ?? template.img,
    system,
    flags: {
      ...(template.flags ?? {}),
      [manifest.id]: {
        ...(template.flags?.[manifest.id] ?? {}),
        sourceId,
        source: {
          book: system.source,
          page: system.sourcePage,
          importId: system.importId
        }
      }
    }
  };
}

function getSourceDocuments(source) {
  return [
    ...(source.documents ?? []),
    ...(source.entries ?? []).map((entry) => buildDocumentFromEntry(source, entry))
  ];
}

function validateCompendiumSource(relativePath, seen = new Set()) {
  if (seen.has(relativePath)) return { jsonFiles: 0, sourceDocuments: 0 };
  seen.add(relativePath);

  const source = readJson(relativePath);
  let jsonFiles = 1;
  let sourceDocuments = 0;

  for (const includePath of source.includes ?? []) {
    const absoluteIncludePath = path.join(root, includePath);
    if (!fs.existsSync(absoluteIncludePath)) {
      throw new Error(`Missing compendium include: ${includePath}`);
    }
    const result = validateCompendiumSource(includePath, seen);
    jsonFiles += result.jsonFiles;
    sourceDocuments += result.sourceDocuments;
  }

  if (!source.pack) return { jsonFiles, sourceDocuments };

  const pack = packsById.get(source.pack);
  if (!pack) throw new Error(`Compendium source references undeclared pack: ${source.pack}`);
  if (source.documentType && source.documentType !== pack.type) {
    throw new Error(`${relativePath} documentType ${source.documentType} does not match pack type ${pack.type}`);
  }

  const folderNames = new Set((source.folders ?? []).map((folder) => folder.name));

  for (const document of getSourceDocuments(source)) {
    sourceDocuments += 1;

    if (!document.name || !document.type) {
      throw new Error(`${relativePath} contains a document without name/type.`);
    }

    if (pack.type === "Item") {
      if (!manifestItemTypes.has(document.type)) {
        throw new Error(`${document.name} uses item type ${document.type}, but system.json documentTypes does not declare it.`);
      }
    }

    if (document.folder && !folderNames.has(document.folder)) {
      throw new Error(`${document.name} references missing folder ${document.folder}.`);
    }

    const sourceId = document.flags?.[manifest.id]?.sourceId;
    const systemSourceId = document.system?.sourceId;
    const importId = document.system?.importId;
    const flagImportId = document.flags?.[manifest.id]?.source?.importId;

    if (!sourceId || !systemSourceId || !importId || !flagImportId) {
      throw new Error(`${document.name} is missing sourceId/importId metadata.`);
    }

    if (sourceId !== systemSourceId || sourceId !== importId || sourceId !== flagImportId) {
      throw new Error(`${document.name} has mismatched sourceId/importId metadata.`);
    }

    if (seenSourceIds.has(sourceId)) {
      throw new Error(`Duplicate compendium sourceId: ${sourceId}`);
    }
    seenSourceIds.add(sourceId);
  }

  return { jsonFiles, sourceDocuments };
}

const compendiumStats = validateCompendiumSource("data/core-compendiums.json");

console.log(
  `Validated ${manifest.title} ${manifest.version}: ` +
  `${compendiumStats.jsonFiles} compendium JSON files, ` +
  `${manifest.packs?.length ?? 0} packs, ` +
  `${compendiumStats.sourceDocuments} source documents.`
);
