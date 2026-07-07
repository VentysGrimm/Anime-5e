export const CORE_RULES_REFERENCE_PACK = "anime5e.rules-reference";

function sourceIdFromIndexEntry(entry) {
  return String(
    foundry.utils.getProperty(entry, "flags.anime5e.sourceId")
      ?? foundry.utils.getProperty(entry, "flags.anime5e.source.importId")
      ?? ""
  ).trim().toLowerCase();
}

export async function openCoreRulesReference(sourceId) {
  const pack = game.packs.get(CORE_RULES_REFERENCE_PACK);
  if (!pack) {
    ui.notifications?.warn("Anime 5e rules-reference pack is not available. Import or refresh the core compendiums first.");
    return null;
  }

  const normalizedSourceId = String(sourceId ?? "").trim().toLowerCase();
  if (!normalizedSourceId) {
    pack.render?.(true);
    return null;
  }

  const index = Array.from(await pack.getIndex({
    fields: ["flags.anime5e.sourceId", "flags.anime5e.source.importId"]
  }));
  const match = index.find((entry) => sourceIdFromIndexEntry(entry) === normalizedSourceId);
  if (!match) {
    ui.notifications?.warn(`No Anime 5e rules reference found for ${sourceId}.`);
    pack.render?.(true);
    return null;
  }

  const document = await pack.getDocument(match._id);
  document?.sheet?.render(true);
  return document ?? null;
}
