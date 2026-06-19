const SYSTEM_ID = "anime5e";
const CORE_COMPENDIUM_MANIFEST = "data/core-compendiums.json";

function getProperty(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

async function loadJson(relativePath) {
  const response = await fetch(`systems/${SYSTEM_ID}/${relativePath}`);
  if (!response.ok) {
    throw new Error(`Unable to load ${relativePath}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadCompendiumSources(manifestPath = CORE_COMPENDIUM_MANIFEST, seen = new Set()) {
  if (seen.has(manifestPath)) return [];
  seen.add(manifestPath);

  const manifest = await loadJson(manifestPath);
  const ownSources = manifest.pack ? [manifest] : [];
  const includedSources = [];

  for (const includePath of manifest.includes ?? []) {
    includedSources.push(...await loadCompendiumSources(includePath, seen));
  }

  return [...ownSources, ...includedSources];
}

function getDocumentImplementation(documentType) {
  const documentClass = CONFIG[documentType]?.documentClass ?? globalThis[documentType];
  const implementation = documentClass?.implementation ?? documentClass;

  if (!implementation?.createDocuments) {
    throw new Error(`No document implementation is available for ${documentType}`);
  }

  return implementation;
}

function getPackFolders(pack) {
  const folders = pack.folders;
  if (!folders) return [];
  if (Array.isArray(folders)) return folders;
  if (Array.isArray(folders.contents)) return folders.contents;
  if (typeof folders.values === "function") return Array.from(folders.values());
  return [];
}

function slugifySourceSegment(value) {
  return value
    .toLowerCase()
    .replaceAll("&", "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildSourceId(prefix, name) {
  if (!prefix) return null;
  return `${prefix}.${slugifySourceSegment(name)}`;
}

function formatAttributeCost(entry) {
  if (entry.costLabel) return entry.costLabel;
  if (Number.isFinite(entry.cost)) return `${entry.cost} Point${entry.cost === 1 ? "" : "s"}/Rank`;
  return "";
}

function buildEntryDescription(source, entry, system) {
  if (entry.description) return entry.description;

  const book = system.source;
  const page = system.sourcePage;
  const paragraphs = [];

  if (book) {
    const sourceText = page ? `${escapeHtml(book)}, p. ${escapeHtml(page)}` : escapeHtml(book);
    paragraphs.push(`<p><strong>Source:</strong> ${sourceText}.</p>`);
  }

  const details = [];
  const type = entry.type ?? source.documentTemplate?.type;
  if (type === "attribute") {
    const cost = formatAttributeCost(entry);
    if (cost) details.push(`<strong>Attribute Cost:</strong> ${escapeHtml(cost)}.`);
    if (entry.ability) details.push(`<strong>Relevant Ability:</strong> ${escapeHtml(entry.ability)}.`);
    if (entry.scope) details.push(`<strong>Scope:</strong> ${escapeHtml(entry.scope)}.`);
    if (entry.progression) details.push(`<strong>Progression:</strong> ${escapeHtml(entry.progression)}.`);
  } else if (type === "defect") {
    if (entry.category) details.push(`<strong>Category:</strong> ${escapeHtml(entry.category)}.`);
    if (entry.points) details.push(`<strong>Points:</strong> ${escapeHtml(entry.points)}.`);
    if (entry.progression) details.push(`<strong>Progression:</strong> ${escapeHtml(entry.progression)}.`);
  }

  if (details.length) paragraphs.push(`<p>${details.join(" ")}</p>`);
  if (entry.summary) paragraphs.push(`<p><strong>Rules Summary:</strong> ${escapeHtml(entry.summary)}</p>`);

  return paragraphs.join("");
}

function buildDocumentFromEntry(source, entry) {
  const template = source.documentTemplate ?? {};
  const document = foundry.utils.deepClone(template);
  const type = entry.type ?? template.type;
  const sourceId = entry.sourceId ?? buildSourceId(source.sourceIdPrefix, entry.name);

  if (!sourceId) {
    throw new Error(`Compendium entry "${entry.name}" is missing a sourceId or sourceIdPrefix.`);
  }

  document.name = entry.name;
  document.type = type;
  document.folder = entry.folder ?? template.folder;
  document.img = entry.img ?? template.img;

  const system = {
    ...(document.system ?? {}),
    ...(entry.system ?? {})
  };

  system.description = buildEntryDescription(source, entry, {
    ...system,
    source: entry.source ?? source.sourceBook ?? system.source ?? "",
    sourcePage: entry.sourcePage ?? system.sourcePage ?? null
  });
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

  document.system = system;
  document.flags ??= {};
  document.flags[SYSTEM_ID] = {
    ...(document.flags[SYSTEM_ID] ?? {}),
    sourceId,
    source: {
      book: system.source,
      page: system.sourcePage,
      importId: system.importId
    }
  };

  return document;
}

function getSourceDocuments(source) {
  const documents = source.documents ?? [];
  const entries = (source.entries ?? []).map((entry) => buildDocumentFromEntry(source, entry));
  return [...documents, ...entries];
}

async function withUnlockedPack(pack, operation) {
  const wasLocked = pack.locked;
  if (wasLocked) await pack.configure({ locked: false });

  try {
    return await operation();
  } finally {
    if (wasLocked) await pack.configure({ locked: true });
  }
}

async function ensurePackFolders(pack, folderDefinitions, documentType) {
  const foldersByName = new Map(getPackFolders(pack).map((folder) => [folder.name, folder]));
  const missing = folderDefinitions.filter((folder) => !foldersByName.has(folder.name));

  if (missing.length) {
    const folderImplementation = Folder.implementation ?? Folder;
    const created = await folderImplementation.createDocuments(
      missing.map((folder) => ({
        name: folder.name,
        type: documentType,
        color: folder.color ?? null,
        sorting: folder.sorting ?? "a",
        flags: {
          [SYSTEM_ID]: {
            sourceId: folder.sourceId ?? `folder.${pack.name}.${folder.name.toLowerCase().replaceAll(" ", "-")}`
          }
        }
      })),
      { pack: pack.collection }
    );

    for (const folder of created) {
      foldersByName.set(folder.name, folder);
    }
  }

  return foldersByName;
}

function prepareDocument(sourceDocument, foldersByName) {
  const document = foundry.utils.deepClone(sourceDocument);
  const logicalFolder = document.folder;
  const folder = logicalFolder ? foldersByName.get(logicalFolder) : null;

  if (logicalFolder && !folder) {
    throw new Error(`Missing compendium folder "${logicalFolder}" for ${document.name}`);
  }

  if (folder) document.folder = folder.id;

  document.flags ??= {};
  document.flags[SYSTEM_ID] ??= {};
  document.flags[SYSTEM_ID].sourceId ??= document.system?.sourceId;

  return document;
}

function findExistingIndexEntry(index, document) {
  const sourceId = document.flags?.[SYSTEM_ID]?.sourceId ?? document.system?.sourceId;
  if (sourceId) {
    const bySourceId = index.find((entry) => getProperty(entry, `flags.${SYSTEM_ID}.sourceId`) === sourceId);
    if (bySourceId) return bySourceId;
    return null;
  }

  return index.find((entry) => entry.name === document.name && entry.type === document.type);
}

async function importSourceIntoPack(source) {
  const pack = game.packs.get(source.pack);
  if (!pack) throw new Error(`Compendium pack is not declared: ${source.pack}`);

  const documentType = source.documentType ?? pack.documentName;
  const documentImplementation = getDocumentImplementation(documentType);

  return withUnlockedPack(pack, async () => {
    const foldersByName = await ensurePackFolders(pack, source.folders ?? [], documentType);
    const index = Array.from(await pack.getIndex({
      fields: ["name", "type", "folder", `flags.${SYSTEM_ID}.sourceId`]
    }));

    const documents = getSourceDocuments(source).map((document) => prepareDocument(document, foldersByName));
    const toCreate = [];
    const toUpdate = [];

    for (const document of documents) {
      const existing = findExistingIndexEntry(index, document);
      if (existing) toUpdate.push({ ...document, _id: existing._id });
      else toCreate.push(document);
    }

    const created = toCreate.length
      ? await documentImplementation.createDocuments(toCreate, { pack: pack.collection })
      : [];
    const updated = toUpdate.length
      ? await documentImplementation.updateDocuments(toUpdate, { pack: pack.collection })
      : [];

    return {
      pack: source.pack,
      created: created.length,
      updated: updated.length,
      folders: foldersByName.size
    };
  });
}

export async function importCoreCompendiumData() {
  if (!game.user?.isGM) {
    ui.notifications?.warn("Only a GM can import Anime 5e compendium data.");
    return [];
  }

  const sources = await loadCompendiumSources();
  const results = [];

  for (const source of sources) {
    results.push(await importSourceIntoPack(source));
  }

  const totalCreated = results.reduce((sum, result) => sum + result.created, 0);
  const totalUpdated = results.reduce((sum, result) => sum + result.updated, 0);
  ui.notifications?.info(`Anime 5e compendiums imported: ${totalCreated} created, ${totalUpdated} updated.`);
  console.log(`${SYSTEM_ID} | Core compendium import complete`, results);

  return results;
}
