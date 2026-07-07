const SOURCE_BOOK = "Anime 5E Fifth Edition Core Rules";

const DYNAMIC_POWER_SOURCE_IDS = new Set([
  "core.attribute.dynamic-powers",
  "core.attribute.dynamic-powers-lesser",
  "core.power.dynamic-powers",
  "core.power.dynamic-power-lesser",
  "core.power.dynamic-powers-lesser"
]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceIdForItem(item) {
  const system = item?.system ?? {};

  return String(
    system.sourceId
      ?? system.importId
      ?? item?.flags?.anime5e?.sourceId
      ?? item?.flags?.anime5e?.source?.importId
      ?? ""
  ).trim().toLowerCase();
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function rankForItem(item) {
  return Math.max(0, Math.trunc(numberOrZero(item?.system?.rank)));
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceLabelForItem(item) {
  const system = item?.system ?? {};
  const source = system.source || SOURCE_BOOK;
  const page = system.sourcePage ? `PDF p. ${system.sourcePage}` : "";

  return [source, page].filter(Boolean).join(", ");
}

export function isDynamicPowerItem(item) {
  if (!item) return false;
  const sourceId = sourceIdForItem(item);
  if (DYNAMIC_POWER_SOURCE_IDS.has(sourceId)) return true;

  const name = String(item.name ?? "").toLowerCase();
  const category = String(item.system?.category ?? "").toLowerCase();
  return /dynamic powers?/.test(name) || /dynamic powers?/.test(category);
}

export function getDynamicPowerExpressionContext(item) {
  const rank = rankForItem(item);
  const lesser = /lesser/i.test(item?.name ?? "") || sourceIdForItem(item).includes("lesser");

  return {
    id: item?.id ?? "",
    name: item?.name ?? "Dynamic Powers",
    rank,
    maxEffectRank: Math.max(1, rank),
    type: lesser ? "Lesser Dynamic Powers" : "Dynamic Powers",
    scope: lesser ? "Limited theme or expression" : "Major concept, force, or sphere",
    energyGuidance: item?.system?.energyCost || "DM-approved Energy cost by expressed effect Rank",
    source: sourceLabelForItem(item),
    effect: stripHtml(item?.system?.effect),
    repeatedEffects: stripHtml(item?.system?.repeatedEffects),
    activationLimits: stripHtml(item?.system?.activationLimits),
    trackingNotes: stripHtml(item?.system?.trackingNotes)
  };
}

export function getDynamicPowerExpressionEntries(items = []) {
  return items
    .filter(isDynamicPowerItem)
    .map(getDynamicPowerExpressionContext);
}

export function buildDynamicPowerTrackingNote({ expression = "", effectRank = 0, energyCost = 0, notes = "" } = {}) {
  const parts = [
    hasText(expression) ? `Expression: ${expression.trim()}` : "",
    effectRank > 0 ? `Effect Rank ${effectRank}` : "",
    energyCost > 0 ? `Energy ${energyCost}` : "Energy DM-approved",
    hasText(notes) ? `Notes: ${notes.trim()}` : ""
  ].filter(Boolean);

  return `<p>${escapeHtml(parts.join("; "))}</p>`;
}

export function buildDynamicPowerExpressionChatContent({
  actor = null,
  item = null,
  expression = "",
  effectRank = 0,
  energyCost = 0,
  notes = "",
  energyLine = ""
} = {}) {
  const context = getDynamicPowerExpressionContext(item);
  const details = [
    { label: "Actor", value: actor?.name ?? "" },
    { label: "Power", value: context.name },
    { label: "Type", value: context.type },
    { label: "Power Rank", value: context.rank || "" },
    { label: "Effect Rank", value: effectRank || "" },
    { label: "Energy", value: energyCost > 0 ? energyCost : context.energyGuidance },
    { label: "Source", value: context.source }
  ].filter((detail) => detail.value !== undefined && detail.value !== null && detail.value !== "");
  const rows = details
    .map((detail) => `<dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>`)
    .join("");
  const expressionLine = hasText(expression)
    ? `<p><strong>Expression:</strong> ${escapeHtml(expression.trim())}</p>`
    : "";
  const notesLine = hasText(notes)
    ? `<p><strong>Notes:</strong> ${escapeHtml(notes.trim())}</p>`
    : "";
  const limitLines = [
    context.activationLimits ? `<p><strong>Limits:</strong> ${escapeHtml(context.activationLimits)}</p>` : "",
    context.repeatedEffects ? `<p><strong>Repeat Tracking:</strong> ${escapeHtml(context.repeatedEffects)}</p>` : ""
  ].join("");

  return `
    <article class="anime5e chat-card roll-card dynamic-power-card">
      <h3>${escapeHtml(context.name)} Expression</h3>
      ${expressionLine}
      ${energyLine}
      ${notesLine}
      ${limitLines}
      <dl class="roll-summary">${rows}</dl>
    </article>
  `;
}
