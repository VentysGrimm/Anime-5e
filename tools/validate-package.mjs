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
  "templates/basic-actor-sheet.hbs",
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
    throw new Error("Manifest must declare book-level packFolders for compendium sidebar grouping.");
  }

  const packNames = new Set((manifest.packs ?? []).map((pack) => pack.name));
  const folderPackNames = collectPackFolderNames(manifest.packFolders);

  for (const packName of packNames) {
    if (!folderPackNames.has(packName)) {
      throw new Error(`Manifest pack "${packName}" is not assigned to a packFolders entry.`);
    }
  }

  for (const packName of folderPackNames) {
    if (!packNames.has(packName)) {
      throw new Error(`packFolders references unknown pack "${packName}".`);
    }
  }
}

function collectSourceBackedPacks(relativePath, seen = new Set()) {
  if (seen.has(relativePath)) return new Set();
  seen.add(relativePath);

  const source = readJson(relativePath);
  const packs = new Set(source.pack ? [source.pack] : []);

  for (const includePath of source.includes ?? []) {
    for (const pack of collectSourceBackedPacks(includePath, seen)) {
      packs.add(pack);
    }
  }

  return packs;
}

const sourceBackedPacks = collectSourceBackedPacks("data/core-compendiums.json");
const generatedPackPaths = [];

validatePackFolderCoverage(manifest);

for (const pack of manifest.packs ?? []) {
  if (!pack.name) throw new Error("Manifest pack is missing a name.");
  if (!pack.path) throw new Error(`Manifest pack "${pack.name}" is missing a path.`);

  const normalizedPath = path.normalize(pack.path);
  if (path.isAbsolute(pack.path) || normalizedPath.startsWith("..")) {
    throw new Error(`Manifest pack "${pack.name}" must use a relative package path: ${pack.path}`);
  }

  const absolutePackPath = path.join(root, pack.path);
  const packId = `${manifest.id}.${pack.name}`;
  if (!fs.existsSync(absolutePackPath)) {
    if (sourceBackedPacks.has(packId)) {
      generatedPackPaths.push(pack.path);
      continue;
    }

    throw new Error(`Manifest pack path does not exist: ${pack.name} -> ${pack.path}`);
  }

  if (!fs.statSync(absolutePackPath).isDirectory()) {
    throw new Error(`Manifest pack path is not a directory: ${pack.name} -> ${pack.path}`);
  }
}

const packsById = new Map((manifest.packs ?? []).map((pack) => [`${manifest.id}.${pack.name}`, pack]));
const manifestActorTypes = new Set(Object.keys(manifest.documentTypes?.Actor ?? {}));
const manifestItemTypes = new Set(Object.keys(manifest.documentTypes?.Item ?? {}));
const seenSourceIds = new Set();
const coreSourceCoverage = new Map();
const coreSourceBook = "Anime 5E Fifth Edition Core Rules";
const coreSourceRoot = "data/sources/core/";

const coreIssue98Requirements = [
  { label: "Core Attributes", packs: ["anime5e.attributes"], types: ["attribute"] },
  { label: "Core Defects", packs: ["anime5e.defects"], types: ["defect"] },
  { label: "Core Enhancements", packs: ["anime5e.enhancements"], types: ["enhancement"] },
  { label: "Core Limiters", packs: ["anime5e.limiters"], types: ["limiter"] },
  {
    label: "Core Race/Species",
    packs: ["anime5e.character-options"],
    types: ["species"],
    folders: ["Species - Core Rules", "Species - DnD"]
  },
  { label: "Core Classes", packs: ["anime5e.character-options"], types: ["class"], folders: ["Classes - Core Rules"] },
  { label: "Core Skills", packs: ["anime5e.character-options"], types: ["skill"], folders: ["Skills - Core Rules"] },
  { label: "Core Weapons", packs: ["anime5e.equipment"], types: ["weapon"], folders: ["Weapons"] },
  {
    label: "Core Armour and Shields",
    packs: ["anime5e.equipment"],
    types: ["armor", "shield"],
    folders: ["Armour", "Shields"]
  },
  {
    label: "Core Gear",
    packs: ["anime5e.equipment"],
    folders: ["Adventuring Gear", "Daily Devices", "Item Attributes"]
  },
  {
    label: "Core Items of Power",
    packs: ["anime5e.equipment"],
    folders: ["Items of Power", "Protective Devices", "Armaments"]
  },
  { label: "Core Monsters/NPCs", packs: ["anime5e.monsters", "anime5e.npcs"], types: ["monster", "npc"] }
];

const table18AllowedEnhancements = new Map([
  ["Cognition", "Area"],
  ["Control Environment", "Area (2+), Duration, Range"],
  ["Dynamic Powers", "Area, Duration, Range, Targets"],
  ["Healing", "Area, Range, Targets"],
  ["Mimic", "Duration, Range"],
  ["Mind Control", "Area, Duration, Range, Targets"],
  ["Nullify", "Area, Duration, Range, Targets"],
  ["Pocket Dimension", "Duration"],
  ["Portal", "Area, Duration, Range, Targets"],
  ["Sixth Sense", "Area (3+)"],
  ["Size Change", "Duration"],
  ["Telepathy", "Area (2+), Duration, Range, Targets"],
  ["Teleport", "Area, Range, Targets"],
  ["Transfer", "Duration, Range, Targets"],
  ["Unique Attribute", "Area, Duration, Range, Targets"],
  ["Unknown Power", "Area, Duration, Range, Targets"]
]);

const coreAttributeEnhancementNames = ["Area", "Duration", "Potent", "Range", "Targets"];
const coreAttributeLimiterNames = [
  "Activation",
  "Assisted",
  "Backlash",
  "Charges",
  "Concentration",
  "Consumable",
  "Dependent",
  "Deplete",
  "Detectable",
  "Emotional",
  "Environmental",
  "Equipment",
  "Imbue",
  "Irreversible",
  "Maximum",
  "Object",
  "Permanent",
  "Recovery",
  "Semi-Permanent",
  "Unique Limiter",
  "Unpredictable"
];

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
  system.sourceAbbreviation = entry.sourceAbbreviation ?? source.sourceAbbreviation ?? system.sourceAbbreviation ?? "";
  system.sourceModuleId = entry.sourceModuleId ?? source.sourceModuleId ?? system.sourceModuleId ?? "";
  system.sourceCategory = entry.sourceCategory ?? source.contentCategory ?? system.sourceCategory ?? type ?? "";
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
          abbreviation: system.sourceAbbreviation,
          moduleId: system.sourceModuleId,
          category: system.sourceCategory,
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

function documentSourceId(document) {
  return document.system?.sourceId
    ?? document.system?.source?.sourceId;
}

function documentImportId(document) {
  return document.system?.importId
    ?? document.system?.source?.importId;
}

function documentFlagImportId(document) {
  return document.flags?.[manifest.id]?.source?.importId;
}

function documentSourceMetadata(document) {
  const flagSource = document.flags?.[manifest.id]?.source ?? {};
  const systemSource = document.system?.source;
  const systemSourceObject = systemSource && typeof systemSource === "object" ? systemSource : {};
  const systemSourceBook = typeof systemSource === "string" ? systemSource : null;

  return {
    book: flagSource.book ?? systemSourceObject.book ?? systemSourceBook ?? "",
    page: flagSource.page ?? systemSourceObject.page ?? document.system?.sourcePage ?? null,
    abbreviation: flagSource.abbreviation ?? systemSourceObject.abbreviation ?? document.system?.sourceAbbreviation ?? "",
    moduleId: flagSource.moduleId ?? systemSourceObject.moduleId ?? document.system?.sourceModuleId ?? "",
    category: flagSource.category ?? systemSourceObject.category ?? document.system?.sourceCategory ?? document.type ?? "",
    importId: flagSource.importId ?? systemSourceObject.importId ?? document.system?.importId ?? null
  };
}

function sourcePathIsCore(relativePath) {
  return relativePath.startsWith(coreSourceRoot);
}

function getCoreCoverage(packId) {
  if (!coreSourceCoverage.has(packId)) {
    coreSourceCoverage.set(packId, {
      documents: 0,
      folders: new Set(),
      types: new Set()
    });
  }

  return coreSourceCoverage.get(packId);
}

function noteCoreSourceCoverage(relativePath, source, documents) {
  if (!sourcePathIsCore(relativePath) || !source.pack) return;

  const coverage = getCoreCoverage(source.pack);
  for (const folder of source.folders ?? []) {
    coverage.folders.add(folder.name);
  }

  for (const document of documents) {
    coverage.documents += 1;
    if (document.type) coverage.types.add(document.type);
    if (document.folder) coverage.folders.add(document.folder);

    const metadata = documentSourceMetadata(document);
    if (metadata.book !== coreSourceBook) {
      throw new Error(`${relativePath} -> ${document.name} is not tagged as ${coreSourceBook}.`);
    }

    if (metadata.page === null || metadata.page === undefined || metadata.page === "") {
      throw new Error(`${relativePath} -> ${document.name} is missing Core Rules source page metadata.`);
    }
  }
}

function validateCoreIssue98Coverage() {
  for (const requirement of coreIssue98Requirements) {
    const coverages = requirement.packs.map((packId) => coreSourceCoverage.get(packId));
    const totalDocuments = coverages.reduce((sum, coverage) => sum + (coverage?.documents ?? 0), 0);

    if (!totalDocuments) {
      throw new Error(`${requirement.label} has no Core Rules source-backed documents.`);
    }

    for (const type of requirement.types ?? []) {
      if (!coverages.some((coverage) => coverage?.types.has(type))) {
        throw new Error(`${requirement.label} is missing Core Rules document type ${type}.`);
      }
    }

    for (const folder of requirement.folders ?? []) {
      if (!coverages.some((coverage) => coverage?.folders.has(folder))) {
        throw new Error(`${requirement.label} is missing Core Rules folder ${folder}.`);
      }
    }
  }
}

function validateCoreCustomizationCoverage() {
  const attributes = getSourceDocuments(readJson("data/sources/core/attributes/index.json"));
  const enhancements = getSourceDocuments(readJson("data/sources/core/enhancements/index.json"));
  const limiters = getSourceDocuments(readJson("data/sources/core/limiters/index.json"));
  const attributesByName = new Map(attributes.map((document) => [document.name, document]));
  const attributeEnhancementNames = new Set(enhancements
    .filter((document) => document.type === "enhancement" && document.system?.category === "Attribute Enhancement")
    .map((document) => document.name));
  const attributeLimiterNames = new Set(limiters
    .filter((document) => document.type === "limiter" && document.system?.category === "Attribute Limiter")
    .map((document) => document.name));

  for (const [name, allowedEnhancements] of table18AllowedEnhancements) {
    const attribute = attributesByName.get(name);
    if (!attribute) throw new Error(`Table 18 Attribute is missing from Core Attributes: ${name}.`);
    if (attribute.system?.allowedEnhancements !== allowedEnhancements) {
      throw new Error(`${name} Table 18 allowedEnhancements expected "${allowedEnhancements}", got "${attribute.system?.allowedEnhancements ?? ""}".`);
    }
  }

  for (const name of coreAttributeEnhancementNames) {
    if (!attributeEnhancementNames.has(name)) throw new Error(`Core Attribute Enhancement is missing: ${name}.`);
  }

  for (const name of coreAttributeLimiterNames) {
    if (!attributeLimiterNames.has(name)) throw new Error(`Core Attribute Limiter is missing: ${name}.`);
  }
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

  const documents = getSourceDocuments(source);
  noteCoreSourceCoverage(relativePath, source, documents);

  for (const document of documents) {
    sourceDocuments += 1;

    if (!document.name) {
      throw new Error(`${relativePath} contains a document without a name.`);
    }

    if ((pack.type === "Actor" || pack.type === "Item") && !document.type) {
      throw new Error(`${relativePath} contains a ${pack.type} document without a type.`);
    }

    if (pack.type === "Actor") {
      if (!manifestActorTypes.has(document.type)) {
        throw new Error(`${document.name} uses actor type ${document.type}, but system.json documentTypes does not declare it.`);
      }
    }

    if (pack.type === "Item") {
      if (!manifestItemTypes.has(document.type)) {
        throw new Error(`${document.name} uses item type ${document.type}, but system.json documentTypes does not declare it.`);
      }
    }

    if (document.folder && !folderNames.has(document.folder)) {
      throw new Error(`${document.name} references missing folder ${document.folder}.`);
    }

    const sourceId = document.flags?.[manifest.id]?.sourceId ?? documentSourceId(document);
    const systemSourceId = documentSourceId(document);
    const importId = documentImportId(document) ?? documentFlagImportId(document);
    const flagImportId = documentFlagImportId(document);

    if (!sourceId || !importId || !flagImportId) {
      throw new Error(`${document.name} is missing sourceId/importId metadata.`);
    }

    if ((pack.type === "Actor" || pack.type === "Item") && sourceId !== systemSourceId) {
      throw new Error(`${document.name} has mismatched sourceId/importId metadata.`);
    }

    if (sourceId !== importId || sourceId !== flagImportId) {
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
validateCoreIssue98Coverage();
validateCoreCustomizationCoverage();

console.log(
  `Validated ${manifest.title} ${manifest.version}: ` +
  `${compendiumStats.jsonFiles} compendium JSON files, ` +
  `${manifest.packs?.length ?? 0} packs` +
  (generatedPackPaths.length ? ` (${generatedPackPaths.length} source-backed generated), ` : ", ") +
  `${compendiumStats.sourceDocuments} source documents.`
);
