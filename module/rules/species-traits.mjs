import { ABILITY_KEYS } from "./attribute-effects.mjs";

const SPECIES_GRANT_FLAG_SCOPE = "anime5e";
const SPECIES_GRANT_FLAG_KEY = "speciesGrant";
const MANAGED_ATTRIBUTE_IMAGE = "icons/svg/aura.svg";
const MANAGED_DEFECT_IMAGE = "icons/svg/downgrade.svg";
const SPECIES_GRANT_SOURCE = "Anime 5E Species Trait";

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

function slugify(value) {
  return normalizeDash(value)
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeAbility(value) {
  const text = String(value ?? "").trim().toLowerCase();
  if (!text) return null;
  return ABILITY_KEYS.find((key) => key === text) ?? ABILITY_KEYS.find((key) => key.startsWith(text.slice(0, 3))) ?? null;
}

function traitSourceId(type, name) {
  const prefix = type === "defect" ? "core.defect" : "core.attribute";
  const slug = slugify(name);
  return slug ? `${prefix}.${slug}` : "";
}

function speciesGrantFlag(item) {
  return item?.flags?.[SPECIES_GRANT_FLAG_SCOPE]?.[SPECIES_GRANT_FLAG_KEY] ?? {};
}

export function isSpeciesGrantedTraitItem(item) {
  return speciesGrantFlag(item).managed === true;
}

function speciesSourceId(item) {
  return String(item?.system?.sourceId ?? item?.flags?.anime5e?.sourceId ?? item?.flags?.anime5e?.source?.importId ?? "").trim();
}

export function getAppliedSpeciesItems(system = {}, items = []) {
  const species = (items ?? []).filter((item) => item?.type === "species" && !isSpeciesGrantedTraitItem(item));
  const appliedRef = String(system.creation?.speciesApplied ?? "");
  const identityRace = String(system.identity?.race ?? "").trim();
  const applied = species.filter((item) => {
    if (appliedRef && (appliedRef === item.uuid || appliedRef === item.id)) return true;
    return identityRace && identityRace === item.name;
  });

  if (applied.length) return applied;
  return species.length === 1 ? [species[0]] : [];
}

function traitKey(species, type, trait) {
  return `${speciesSourceId(species) || slugify(species.name)}:${type}:${slugify(`${trait.name} ${trait.detail ?? ""}`)}`;
}

function managedTraitDescription(species, type, trait) {
  const detail = trait.detail ? `<p><strong>Detail:</strong> ${normalizeDash(trait.detail)}</p>` : "";
  const notes = trait.notes ? `<p><strong>Notes:</strong> ${normalizeDash(trait.notes)}</p>` : "";
  const points = numberOrZero(trait.points);
  return `<p><strong>Species-granted ${type === "defect" ? "Defect" : "Attribute"}.</strong> Managed from ${species.name} and excluded from separate discretionary point spending.</p>${detail}<p><strong>Source points:</strong> ${points}</p>${notes}`;
}

function normalizeTrait(species, type, trait) {
  const rank = positiveNumber(trait.rank) || 1;
  const points = numberOrZero(trait.points);
  const name = normalizeDash(trait.name || (type === "defect" ? "Species Defect" : "Species Attribute"));
  const sourceId = traitSourceId(type, name);

  return {
    key: traitKey(species, type, trait),
    type,
    name,
    rank,
    points,
    perRankPoints: rank ? Math.abs(points) / rank : Math.abs(points),
    detail: normalizeDash(trait.detail ?? ""),
    notes: normalizeDash(trait.notes ?? ""),
    sourceId,
    speciesName: species.name,
    speciesSourceId: speciesSourceId(species),
    sourcePage: species.system?.sourcePage ?? null,
    description: managedTraitDescription(species, type, trait)
  };
}

function collectSpeciesTraits(system, items) {
  return getAppliedSpeciesItems(system, items).flatMap((species) => {
    const attributes = Array.isArray(species.system?.attributes) ? species.system.attributes : [];
    const defects = Array.isArray(species.system?.defects) ? species.system.defects : [];
    return [
      ...attributes.map((trait) => normalizeTrait(species, "attribute", trait)),
      ...defects.map((trait) => normalizeTrait(species, "defect", trait))
    ];
  });
}

export function calculateSpeciesEffects({ system = {}, items = [] } = {}) {
  const abilityBonuses = Object.fromEntries(ABILITY_KEYS.map((key) => [key, 0]));
  const appliedSpecies = getAppliedSpeciesItems(system, items);

  for (const species of appliedSpecies) {
    const bonuses = Array.isArray(species.system?.abilityBonuses) ? species.system.abilityBonuses : [];
    for (const bonus of bonuses) {
      const ability = normalizeAbility(bonus.ability);
      if (!ability) continue;
      abilityBonuses[ability] += numberOrZero(bonus.modifier);
    }
  }

  return {
    appliedSpecies,
    abilityBonuses
  };
}

export function buildSpeciesTraitPlan(system = {}, items = []) {
  const traits = collectSpeciesTraits(system, items);
  const existing = (items ?? []).filter(isSpeciesGrantedTraitItem);
  const existingByKey = new Map(existing.map((item) => [speciesGrantFlag(item).key, item]));
  const managedTraits = traits.map((trait) => {
    const item = existingByKey.get(trait.key);
    const managedRank = positiveNumber(item?.system?.rank);
    return {
      ...trait,
      managedRank,
      missingRank: Math.max(0, trait.rank - managedRank),
      statusLabel: managedRank === trait.rank ? "Synced" : "Pending Sync"
    };
  });
  const pendingSync = managedTraits.filter((trait) => trait.statusLabel !== "Synced").length;
  const appliedSpecies = getAppliedSpeciesItems(system, items);
  const warnings = [];

  if (appliedSpecies.length && pendingSync) warnings.push(`${pendingSync} species-granted trait ${pendingSync === 1 ? "item needs" : "items need"} sync.`);

  return {
    appliedSpecies,
    managedTraits,
    attributes: managedTraits.filter((trait) => trait.type === "attribute"),
    defects: managedTraits.filter((trait) => trait.type === "defect"),
    pendingSync,
    warnings,
    hasTraits: managedTraits.length > 0,
    hasAttributes: managedTraits.some((trait) => trait.type === "attribute"),
    hasDefects: managedTraits.some((trait) => trait.type === "defect")
  };
}

function managedTraitData(trait) {
  const isDefect = trait.type === "defect";
  return {
    name: trait.name,
    type: isDefect ? "defect" : "attribute",
    img: isDefect ? MANAGED_DEFECT_IMAGE : MANAGED_ATTRIBUTE_IMAGE,
    system: {
      description: trait.description,
      rank: trait.rank,
      cost: 0,
      pointsReturned: 0,
      source: SPECIES_GRANT_SOURCE,
      sourceId: trait.sourceId,
      sourcePage: trait.sourcePage,
      sourceCategory: "Species Trait",
      importId: `species-grant.${trait.key}`,
      overrideNotes: "Species-granted; included in Species/Race point cost."
    },
    flags: {
      anime5e: {
        speciesGrant: {
          managed: true,
          key: trait.key,
          speciesName: trait.speciesName,
          speciesSourceId: trait.speciesSourceId,
          traitType: trait.type,
          points: trait.points,
          rank: trait.rank
        }
      }
    }
  };
}

function dataNeedsUpdate(item, data) {
  const flag = speciesGrantFlag(item);
  return item.name !== data.name
    || item.type !== data.type
    || positiveNumber(item.system?.rank) !== data.system.rank
    || item.system?.description !== data.system.description
    || item.system?.sourceId !== data.system.sourceId
    || flag.rank !== data.flags.anime5e.speciesGrant.rank
    || flag.points !== data.flags.anime5e.speciesGrant.points;
}

export async function syncSpeciesGrantedTraits(actor) {
  if (!actor?.isOwner) return { created: 0, updated: 0, deleted: 0, plan: buildSpeciesTraitPlan(actor?.system ?? {}, actor?.items?.contents ?? []) };

  const items = actor.items?.contents ?? [];
  const plan = buildSpeciesTraitPlan(actor.system ?? {}, items);
  const desired = new Map(plan.managedTraits.map((trait) => [trait.key, managedTraitData(trait)]));
  const existing = items.filter(isSpeciesGrantedTraitItem);
  let created = 0;
  let updated = 0;
  let deleted = 0;

  for (const item of existing) {
    const key = speciesGrantFlag(item).key;
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
