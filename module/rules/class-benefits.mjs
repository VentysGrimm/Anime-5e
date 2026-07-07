const CLASS_GRANT_FLAG_SCOPE = "anime5e";
const CLASS_GRANT_FLAG_KEY = "classGrant";
const MANAGED_GRANT_IMAGE = "icons/svg/upgrade.svg";
const CLASS_GRANT_SOURCE = "Anime 5E Core Class Progression";

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function positiveNumber(value) {
  return Math.max(0, numberOrZero(value));
}

function normalizeDash(value) {
  return String(value ?? "").replace(/[–—]/g, "-");
}

function stripLeadingRank(value) {
  const text = normalizeDash(value).trim();
  const match = text.match(/^\+?\s*(\d+)\s+(.+)$/);
  return {
    rank: match ? positiveNumber(match[1]) : 0,
    label: match ? match[2].trim() : text
  };
}

function stripParenthetical(value) {
  return normalizeDash(value).replace(/\s*\([^)]*\)/g, "").trim();
}

function slugify(value) {
  return normalizeDash(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizedKey(value) {
  return normalizeDash(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function sourceIdForClassAttribute(name) {
  const slug = slugify(stripParenthetical(name));
  return slug ? `core.attribute.${slug}` : "";
}

function sourceIdForItem(item) {
  return String(
    item?.system?.sourceId
      ?? item?.flags?.anime5e?.sourceId
      ?? item?.flags?.anime5e?.source?.importId
      ?? item?.system?.importId
      ?? ""
  ).trim();
}

function classGrantFlag(item) {
  return item?.flags?.[CLASS_GRANT_FLAG_SCOPE]?.[CLASS_GRANT_FLAG_KEY] ?? {};
}

export function isClassGrantedBenefitItem(item) {
  return classGrantFlag(item).managed === true;
}

function parseBenefit(benefit = {}) {
  const stripped = stripLeadingRank(benefit.label || benefit.type || "Class Benefit");
  const rank = positiveNumber(benefit.rank) || stripped.rank;
  const name = stripped.label || benefit.label || benefit.type || "Class Benefit";
  const sourceId = benefit.type === "attribute" ? sourceIdForClassAttribute(name) : "";
  const key = `${benefit.type || "benefit"}:${slugify(name) || normalizedKey(name) || "class-benefit"}`;

  return {
    key,
    type: benefit.type || "benefit",
    name,
    label: normalizeDash(benefit.label || name),
    rank,
    points: positiveNumber(benefit.points),
    notes: String(benefit.notes ?? "").trim(),
    sourceId
  };
}

function classItems(items = []) {
  return (items ?? []).filter((item) => item?.type === "class" && !isClassGrantedBenefitItem(item));
}

function collectClassBenefitGrants(items = []) {
  return classItems(items).flatMap((classItem) => {
    const system = classItem.system ?? {};
    const classLevel = Math.min(20, positiveNumber(system.level));
    const progression = Array.isArray(system.progression) ? system.progression : [];
    if (!classLevel || !progression.length) return [];

    return progression
      .filter((row) => positiveNumber(row.level) > 0 && positiveNumber(row.level) <= classLevel)
      .flatMap((row) => {
        const benefits = Array.isArray(row.benefits) ? row.benefits : [];
        return benefits.map((benefit) => ({
          ...parseBenefit(benefit),
          className: classItem.name ?? "Class",
          classItemId: classItem.id ?? "",
          level: positiveNumber(row.level)
        }));
      });
  });
}

function manualRankForGrant(items, grant) {
  return (items ?? [])
    .filter((item) => item?.type === "attribute" && !isClassGrantedBenefitItem(item))
    .filter((item) => {
      const itemSourceId = sourceIdForItem(item);
      if (grant.sourceId && itemSourceId === grant.sourceId) return true;
      return normalizedKey(item?.name) === normalizedKey(grant.name);
    })
    .reduce((total, item) => total + positiveNumber(item.system?.rank), 0);
}

function managedRankForGrant(items, grant) {
  return (items ?? [])
    .filter((item) => isClassGrantedBenefitItem(item) && classGrantFlag(item).key === grant.key)
    .reduce((total, item) => total + positiveNumber(item.system?.rank), 0);
}

function managedGrantDescription(grant) {
  const sourceRows = grant.sources
    .map((source) => `<li>${source.className} L${source.level}: ${source.label}${source.points ? ` [${source.points}]` : ""}</li>`)
    .join("");
  const overlap = grant.manualRank > 0
    ? `<p><strong>Manual overlap:</strong> ${grant.manualRank} matching purchased Rank${grant.manualRank === 1 ? "" : "s"} detected. Keep the purchased item if it should stack; otherwise reallocate those discretionary points.</p>`
    : "";

  return `<p><strong>Class-granted Attribute.</strong> Managed from owned Class progression and excluded from discretionary point spending.</p><ul>${sourceRows}</ul>${overlap}`;
}

function groupManagedAttributeGrants(grants, items) {
  const groups = new Map();
  for (const grant of grants.filter((entry) => entry.type === "attribute")) {
    const group = groups.get(grant.key) ?? {
      key: grant.key,
      type: "attribute",
      name: grant.name,
      sourceId: grant.sourceId,
      rank: 0,
      points: 0,
      sources: []
    };
    group.rank += grant.rank;
    group.points += grant.points;
    group.sources.push(grant);
    groups.set(grant.key, group);
  }

  return [...groups.values()].map((group) => {
    const managedRank = managedRankForGrant(items, group);
    const manualRank = manualRankForGrant(items, group);
    const classNames = [...new Set(group.sources.map((source) => source.className))];
    const duplicateGrant = group.sources.length > 1;
    const multiclassGrant = classNames.length > 1;
    const needsSync = managedRank !== group.rank;
    const reallocationPoints = manualRank > 0 ? group.points : 0;
    const statusLabel = needsSync
      ? "Pending Sync"
      : manualRank > 0
        ? "Synced, Manual Overlap"
        : "Synced";

    return {
      ...group,
      classNames,
      managedRank,
      manualRank,
      missingRank: Math.max(0, group.rank - managedRank),
      duplicateGrant,
      multiclassGrant,
      reallocationPoints,
      statusLabel,
      description: managedGrantDescription({ ...group, manualRank })
    };
  });
}

function allocationRows(grants) {
  return grants
    .filter((grant) => grant.type !== "attribute" && grant.type !== "bonusPoints")
    .map((grant) => ({
      ...grant,
      statusLabel: "Choose Allocation",
      detail: `${grant.className} L${grant.level}`
    }));
}

function reallocationRows(managedAttributes) {
  return managedAttributes
    .filter((grant) => grant.manualRank > 0 || grant.multiclassGrant || grant.duplicateGrant)
    .map((grant) => ({
      key: grant.key,
      name: grant.name,
      rank: grant.rank,
      points: grant.points,
      manualRank: grant.manualRank,
      reallocationPoints: grant.reallocationPoints,
      classNames: grant.classNames.join(", "),
      statusLabel: grant.manualRank > 0 ? "Manual Reallocation" : "Duplicate Review"
    }));
}

export function buildClassBenefitPlan(items = []) {
  const grants = collectClassBenefitGrants(items);
  const managedAttributes = groupManagedAttributeGrants(grants, items);
  const choices = allocationRows(grants);
  const reallocations = reallocationRows(managedAttributes);
  const pendingSync = managedAttributes.filter((grant) => grant.managedRank !== grant.rank).length;
  const warnings = [];

  if (pendingSync) warnings.push(`${pendingSync} class-granted Attribute ${pendingSync === 1 ? "item needs" : "items need"} sync.`);
  if (choices.length) warnings.push(`${choices.length} class-granted choice ${choices.length === 1 ? "benefit needs" : "benefits need"} allocation.`);
  if (reallocations.length) warnings.push(`${reallocations.length} duplicate or overlapping class grant ${reallocations.length === 1 ? "needs" : "need"} review.`);

  return {
    grants,
    managedAttributes,
    choices,
    reallocations,
    pendingSync,
    warnings,
    hasManagedAttributes: managedAttributes.length > 0,
    hasChoices: choices.length > 0,
    hasReallocations: reallocations.length > 0
  };
}

function managedAttributeData(grant) {
  return {
    name: grant.name,
    type: "attribute",
    img: MANAGED_GRANT_IMAGE,
    system: {
      description: grant.description,
      rank: grant.rank,
      cost: 0,
      source: CLASS_GRANT_SOURCE,
      sourceId: grant.sourceId,
      sourceCategory: "Class Benefit",
      importId: `class-grant.${grant.key}`,
      overrideNotes: "Class-granted; excluded from discretionary point spending."
    },
    flags: {
      anime5e: {
        classGrant: {
          managed: true,
          key: grant.key,
          rank: grant.rank,
          points: grant.points,
          classNames: grant.classNames,
          sourceIds: grant.sources.map((source) => source.classItemId).filter(Boolean)
        }
      }
    }
  };
}

function dataNeedsUpdate(item, data) {
  const flag = classGrantFlag(item);
  return item.name !== data.name
    || positiveNumber(item.system?.rank) !== data.system.rank
    || item.system?.description !== data.system.description
    || item.system?.sourceId !== data.system.sourceId
    || flag.rank !== data.flags.anime5e.classGrant.rank
    || flag.points !== data.flags.anime5e.classGrant.points;
}

export async function syncClassGrantedBenefits(actor) {
  if (!actor?.isOwner) return { created: 0, updated: 0, deleted: 0, plan: buildClassBenefitPlan(actor?.items?.contents ?? []) };

  const items = actor.items?.contents ?? [];
  const plan = buildClassBenefitPlan(items);
  const desired = new Map(plan.managedAttributes.map((grant) => [grant.key, managedAttributeData(grant)]));
  const existing = items.filter(isClassGrantedBenefitItem);
  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const item of existing) {
    const key = classGrantFlag(item).key;
    if (!desired.has(key)) {
      await item.delete();
      deleted += 1;
      continue;
    }

    const data = desired.get(key);
    desired.delete(key);
    if (dataNeedsUpdate(item, data)) {
      await item.update({
        name: data.name,
        img: data.img,
        system: data.system,
        flags: data.flags
      });
      updated += 1;
    }
  }

  const toCreate = [...desired.values()];
  if (toCreate.length) {
    await actor.createEmbeddedDocuments("Item", toCreate);
    created += toCreate.length;
  }

  return { created, updated, deleted, plan };
}
