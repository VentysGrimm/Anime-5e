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

    const documents = (source.documents ?? []).map((document) => prepareDocument(document, foldersByName));
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
