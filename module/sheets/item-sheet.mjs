import { buildD20Formula, rollAnime5eFormula } from "../rules/rolls.mjs";
import { buildCoreAttributeUsageContext, resolveCoreAttributeEnergyCost } from "../rules/attribute-effects.mjs";
import { buildAdventuringRiskChatContent } from "../rules/adventuring-risks.mjs";
import {
  buildAttributeModifierMechanics,
  calculateEffectiveAttributeRank
} from "../rules/attribute-modifier-mechanics.mjs";
import { calculateAttributeCustomization, calculateEquipmentPointCost } from "../rules/points.mjs";
import { ENERGY_USAGE_MODES, applyEnergyChange, getEnergyUsageMode } from "../rules/resources.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const BASE_FIELDS = new Set([
  "description",
  "rank",
  "cost",
  "source",
  "sourceId",
  "sourcePage",
  "sourceAbbreviation",
  "sourceModuleId",
  "sourceCategory",
  "importId"
]);
const SPECIES_TRAIT_FIELDS = new Set([
  "speciesSize",
  "abilityBonuses",
  "attributes",
  "defects",
  "languages",
  "movement",
  "traitNotes"
]);
const MULTILINE_FIELDS = new Set([
  "allowedAttributes",
  "allowedEnhancements",
  "containedAttributes",
  "containedDefects",
  "constructionNotes",
  "overrideNotes",
  "effectTargets",
  "activationLimits",
  "effect",
  "materials",
  "movementModes",
  "psionicsNotes",
  "projectNotes",
  "progressionNotes",
  "repeatedEffects",
  "result",
  "riskNotes",
  "rulesNotes",
  "spellEffect",
  "spellPrerequisites",
  "statBlock",
  "trackingNotes",
  "trainingTechniques",
  "weaponNotes"
]);
const CONSTRUCTION_ITEM_TYPES = new Set(["armor", "craftingProject", "equipment", "itemAttribute", "itemOfPower", "loot", "material", "mecha", "mount", "shield", "vehicle", "weapon"]);
const WEAPON_ATTRIBUTE_SOURCE_ID = "core.attribute.weapon";
const ATTRIBUTE_MODIFIER_CONFIG = {
  enhancement: {
    field: "enhancementReferences",
    label: "Enhancements",
    pack: "anime5e.enhancements",
    pointModifier: 1,
    singular: "enhancement"
  },
  limiter: {
    field: "limiterReferences",
    label: "Limiters",
    pack: "anime5e.limiters",
    pointModifier: -1,
    singular: "limiter"
  }
};
const NUMBER_FIELDS = new Set([
  "armourClass",
  "armourClassModifier",
  "assignmentCount",
  "attackModifier",
  "attackBonus",
  "basePoints",
  "bonusPoints",
  "charges",
  "checkBonus",
  "costAdjustment",
  "costModifier",
  "dc",
  "embeddedAttributePoints",
  "embeddedDefectPoints",
  "finalClassPoints",
  "finalCostOverride",
  "levellingPoints",
  "level",
  "maxCharges",
  "pointImpact",
  "pointModifier",
  "points",
  "pointsPerLevel",
  "progress",
  "quantity",
  "rangeRank",
  "rank",
  "requiredProgress",
  "sourcePage",
  "saveDC",
  "totalPoints"
]);

const FIELD_LABELS = {
  appliesTo: "Applies To",
  activeTrainingTechnique: "Active Training Technique",
  ability: "Ability Target",
  allowedAttributes: "Allowed Attributes",
  allowedEnhancements: "Allowed Enhancements",
  armour: "Armour",
  armourClass: "Armour Class",
  armourClassModifier: "Armour Class Modifier",
  assignmentCount: "Assignments",
  assignmentRange: "Assignment Range",
  ammo: "Ammo",
  attackModifier: "Attack Modifier",
  attackBonus: "Attack Bonus",
  attributeSummary: "Attribute Summary",
  attunement: "Attunement",
  basePoints: "Base Points",
  baseCreature: "Base Creature",
  carryingCapacity: "Carrying Capacity",
  challengeRating: "Challenge Rating",
  communities: "Communities",
  costAdjustment: "Cost Adjustment",
  costModifier: "Cost Modifier",
  castTime: "Cast Time",
  checkBonus: "Check Bonus",
  constructionNotes: "Construction Notes",
  constructionStatus: "Construction Status",
  containedAttributes: "Contained Attributes",
  containedDefects: "Contained Defects",
  creatureType: "Creature Type",
  currency: "Currency",
  damage: "Damage",
  damageType: "Damage Type",
  dc: "DC",
  damageModifier: "Damage Modifier",
  dexterityRule: "Dexterity Rule",
  duration: "Duration",
  durationRemaining: "Duration Remaining",
  effectActive: "Apply Derived Effect",
  effect: "Effect",
  effectTargets: "Effect Targets",
  embeddedAttributePoints: "Contained Attribute Points",
  embeddedDefectPoints: "Contained Defect Refunds",
  energyCost: "Energy Cost",
  energyPaid: "Energy Paid",
  equipped: "Equipped",
  effectiveRank: "Effective Rank",
  enhancements: "Enhancements",
  finalCostOverride: "Final Cost Override",
  freeHands: "Free Hands",
  habitat: "Habitat",
  hitDice: "Hit Dice",
  hitPoints: "Hit Points",
  itemCategory: "Item Category",
  limiters: "Limiters",
  linkedDocumentType: "Linked Document Type",
  linkedDocumentUuid: "Linked Document UUID",
  linkedActorUuid: "Linked Actor UUID",
  linkedItemUuid: "Linked Item UUID",
  linkedSourceId: "Linked Source ID",
  liftCarryModifier: "Lift/Carry Modifier",
  material: "Material",
  materialCost: "Material Cost",
  materials: "Required Materials",
  maxCharges: "Max Charges",
  movementModes: "Movement Modes",
  movementModifier: "Movement Modifier",
  overrideNotes: "Override Notes",
  owner: "Owner",
  parentAttribute: "Parent Attribute",
  pointImpact: "Point Impact",
  pointModifier: "Point Modifier",
  pointsPerLevel: "Points Per Level",
  primaryAbility: "Primary Ability",
  projectNotes: "Project Notes",
  progressionNotes: "Progression Notes",
  psionicsNotes: "Psionics Notes",
  progress: "Progress",
  proficiencyGroup: "Proficiency Group",
  proficiencyRequirement: "Proficiency Requirement",
  range: "Range",
  rangeRank: "Range Rank",
  rangeSpeedModifier: "Range/Speed Modifier",
  receivedDamageModifier: "Received Damage Modifier",
  requiredProgress: "Required Progress",
  riskNotes: "Risk Notes",
  rulesNotes: "Rules Notes",
  savingThrows: "Saving Throws",
  saveDC: "Save DC",
  shieldSize: "Shield Size",
  sizeAndType: "Size and Type",
  sizeCategory: "Size Category",
  sourceAbbreviation: "Source Abbreviation",
  sourceCategory: "Source Category",
  sourceModuleId: "Source Module ID",
  spellEffect: "Spell Effect",
  spellEnergyCost: "Spell Energy Cost",
  spellcastingAbility: "Spellcasting Ability",
  spellLevel: "Spell Level",
  spellName: "Spell Name",
  spellPrerequisites: "Spell Prerequisites",
  spellUsage: "Spell Usage",
  sourceTable: "Source Table",
  statBlock: "Stat Block",
  stealth: "Stealth",
  strengthCheckModifier: "Strength Check Modifier",
  strengthRequirement: "Strength Requirement",
  strengthModifier: "Strength Modifier",
  targetCount: "Target Count",
  targetItem: "Target Item",
  trainingBenefit: "Training Benefit",
  trainingTechniques: "Training Techniques",
  totalPoints: "Total Points",
  trackingMode: "Tracking Workflow",
  trackingNotes: "Tracking Notes",
  typicalHeight: "Typical Height/Length",
  typicalWeight: "Typical Weight",
  repeatedEffects: "Repeated Effects",
  activationLimits: "Activation Limits",
  value: "Value",
  weight: "Weight",
  weaponNotes: "Weapon Notes",
  xp: "XP"
};

function humanizeFieldName(fieldName) {
  return FIELD_LABELS[fieldName] ?? fieldName
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function hasNumericEntry(value) {
  return value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
}

function sourceIdForItem(item, systemData = item.system ?? {}) {
  return String(
    systemData.sourceId
      ?? systemData.importId
      ?? item.flags?.anime5e?.sourceId
      ?? item.flags?.anime5e?.source?.importId
      ?? ""
  ).trim().toLowerCase();
}

function isWeaponAttributeItem(item, systemData = item.system ?? {}) {
  if (item.type !== "attribute") return false;
  if (sourceIdForItem(item, systemData) === WEAPON_ATTRIBUTE_SOURCE_ID) return true;

  return String(item.name ?? "").trim().toLowerCase() === "weapon";
}

function isPowerCheckItem(item, systemData = item.system ?? {}) {
  const sourceId = sourceIdForItem(item, systemData);
  return item.type === "power"
    || sourceId === "core.attribute.dynamic-powers"
    || sourceId === "core.attribute.dynamic-powers-lesser";
}

function weaponAttributeDamageFormula(item, systemData = item.system ?? {}) {
  const explicitDamage = systemData.damage?.trim();
  if (explicitDamage) return explicitDamage;
  if (!isWeaponAttributeItem(item, systemData)) return "";

  const rank = calculateEffectiveAttributeRank({ type: item.type, name: item.name, system: systemData });
  return rank > 0 ? `${rank}d4` : "";
}

function getItemActor(item) {
  return item.parent?.documentName === "Actor" ? item.parent : null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function excludedDetailFieldsForItem(item) {
  if (item.type !== "species") return BASE_FIELDS;
  return new Set([...BASE_FIELDS, ...SPECIES_TRAIT_FIELDS]);
}

function buildDetailFields(item, systemData) {
  const excludedFields = excludedDetailFieldsForItem(item);
  return Object.entries(systemData)
    .filter(([fieldName]) => !excludedFields.has(fieldName))
    .filter(([, value]) => value === null || ["boolean", "number", "string"].includes(typeof value))
    .map(([fieldName, value]) => ({
      fieldName,
      label: humanizeFieldName(fieldName),
      name: `system.${fieldName}`,
      value,
      displayValue: value ?? "",
      isBoolean: typeof value === "boolean",
      isNumber: NUMBER_FIELDS.has(fieldName) || typeof value === "number",
      isMultiline: MULTILINE_FIELDS.has(fieldName)
    }));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatSignedNumber(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  if (number > 0) return `+${number}`;
  return `${number}`;
}

function formatPoints(value) {
  const points = Number(value);
  if (!Number.isFinite(points) || points === 0) return "";
  const suffix = Math.abs(points) === 1 ? "pt" : "pts";
  return `${formatSignedNumber(points)} ${suffix}`;
}

function formatRank(value) {
  const rank = Number(value);
  return Number.isFinite(rank) && rank > 0 ? `Rank ${rank}` : "";
}

function buildSpeciesTraitEntries(entries) {
  return asArray(entries)
    .filter((entry) => hasText(entry?.name) || hasText(entry?.detail) || hasText(entry?.notes))
    .map((entry) => ({
      name: entry.name ?? "",
      rankLabel: formatRank(entry.rank),
      pointsLabel: formatPoints(entry.points),
      detail: entry.detail ?? "",
      notes: entry.notes ?? ""
    }));
}

function buildSpeciesTraits(item, systemData) {
  if (item.type !== "species") return null;

  const abilityBonuses = asArray(systemData.abilityBonuses)
    .filter((entry) => hasText(entry?.ability) || Number.isFinite(Number(entry?.modifier)) || hasText(entry?.notes))
    .map((entry) => ({
      ability: entry.ability ?? "",
      modifierLabel: formatSignedNumber(entry.modifier),
      pointsLabel: formatPoints(entry.points),
      notes: entry.notes ?? ""
    }));
  const attributes = buildSpeciesTraitEntries(systemData.attributes);
  const defects = buildSpeciesTraitEntries(systemData.defects);
  const languages = asArray(systemData.languages).filter(hasText);
  const movement = asArray(systemData.movement)
    .filter((entry) => hasText(entry?.mode) || hasText(entry?.speed) || hasText(entry?.notes))
    .map((entry) => ({
      mode: entry.mode ?? "",
      speed: entry.speed ?? "",
      notes: entry.notes ?? ""
    }));
  const traitNotes = systemData.traitNotes ?? "";

  const hasStructuredTraits = Boolean(
    abilityBonuses.length
      || attributes.length
      || defects.length
      || languages.length
      || movement.length
      || hasText(traitNotes)
      || hasText(systemData.speciesSize)
  );
  if (!hasStructuredTraits) return null;

  const summary = [
    hasText(systemData.speciesSize) ? { label: "Size", value: systemData.speciesSize } : null,
    Number.isFinite(Number(systemData.points)) ? { label: "Point Cost", value: systemData.points } : null,
    abilityBonuses.length ? { label: "Ability Bonuses", value: abilityBonuses.length } : null,
    attributes.length ? { label: "Attributes", value: attributes.length } : null,
    defects.length ? { label: "Defects", value: defects.length } : null,
    languages.length ? { label: "Languages", value: languages.length } : null,
    movement.length ? { label: "Movement", value: movement.length } : null
  ].filter(Boolean);

  return {
    summary,
    abilityBonuses,
    attributes,
    defects,
    languages,
    movement,
    traitNotes
  };
}

function buildModifierEntries(references) {
  return asArray(references).map((reference, index) => {
    const assignmentCount = Math.max(0, Math.trunc(Number(reference.assignmentCount) || 0));
    const pointModifier = Number(reference.pointModifier) || 0;
    const total = pointModifier * assignmentCount;
    const sourceId = reference.sourceId ?? "";
    const uuid = reference.uuid ?? "";

    return {
      index,
      name: reference.name || sourceId || uuid || "Unresolved Reference",
      sourceId,
      uuid,
      referenceLabel: sourceId || uuid,
      pointModifier,
      pointModifierLabel: formatSignedNumber(pointModifier),
      assignmentCount,
      total,
      totalLabel: formatSignedNumber(total),
      notes: reference.notes ?? ""
    };
  });
}

function buildModifierEntriesForType(references, type) {
  const rankImpactPerAssignment = type === "enhancement" ? -1 : 1;
  return buildModifierEntries(references).map((entry) => ({
    ...entry,
    rankImpactPerAssignment,
    rankImpactPerAssignmentLabel: formatSignedNumber(rankImpactPerAssignment),
    rankImpact: rankImpactPerAssignment * entry.assignmentCount,
    rankImpactLabel: formatSignedNumber(rankImpactPerAssignment * entry.assignmentCount)
  }));
}

function buildAttributeModifiers(item, systemData) {
  if (!["attribute", "weapon"].includes(item.type)) return null;

  const customization = calculateAttributeCustomization({ type: item.type, name: item.name, system: systemData });
  const mechanics = buildAttributeModifierMechanics({ type: item.type, name: item.name, system: systemData });
  const groups = Object.entries(ATTRIBUTE_MODIFIER_CONFIG).map(([type, config]) => {
    const entries = buildModifierEntriesForType(systemData[config.field], type);
    const subtotal = entries.reduce((sum, entry) => sum + entry.rankImpact, 0);

    return {
      type,
      field: config.field,
      label: config.label,
      entries,
      subtotal,
      subtotalLabel: formatSignedNumber(subtotal)
    };
  });
  const rawSubtotal = groups.reduce((sum, group) => sum + group.subtotal, 0);

  return {
    heading: item.type === "weapon" ? "Weapon Customization" : "Attribute Customization",
    summary: [
      { label: "Actual Rank", value: customization.actualRank },
      { label: "Effective Rank", value: customization.effectiveRank },
      { label: "Enhancement Assignments", value: customization.enhancementAssignments },
      { label: "Limiter Assignments", value: customization.limiterAssignments },
      { label: "Rank Impact", value: formatSignedNumber(customization.modifierSubtotal) },
      { label: item.type === "weapon" ? "Point Cost" : "Cost/Rank", value: item.type === "weapon" ? customization.totalCost : customization.effectiveCostPerRank },
      { label: customization.finalCostOverride === null ? "Final Cost" : "Override Cost", value: customization.totalCost }
    ],
    groups,
    rawSubtotal,
    rawSubtotalLabel: formatSignedNumber(rawSubtotal),
    effectiveCostPerRank: customization.effectiveCostPerRank,
    totalCost: customization.totalCost,
    mechanics,
    warnings: customization.warnings
  };
}

function cloneModifierReferences(references) {
  return asArray(references).map((entry) => entry?.toObject?.() ?? { ...entry });
}

function modifierReferenceFromDocument(document, type) {
  const config = ATTRIBUTE_MODIFIER_CONFIG[type];
  const system = document.system?.toObject?.() ?? document.system ?? {};
  const sourceId = String(system.sourceId ?? document.flags?.anime5e?.sourceId ?? "").trim();
  const assignmentRange = String(system.assignmentRange ?? "").trim();

  return {
    name: document.name ?? sourceId,
    sourceId,
    uuid: document.uuid ?? "",
    appliesTo: system.appliesTo ?? "",
    category: system.category ?? "",
    allowedAttributes: system.allowedAttributes ?? "",
    pointModifier: Number(system.pointModifier) || config.pointModifier,
    assignmentCount: 1,
    rulesNotes: system.rulesNotes ?? "",
    notes: assignmentRange ? `Assignments: ${assignmentRange}` : ""
  };
}

async function resolveModifierByUuid(reference, type) {
  if (typeof fromUuid !== "function") return null;

  try {
    const document = await fromUuid(reference);
    if (!document || document.type !== type) return null;
    return modifierReferenceFromDocument(document, type);
  } catch (error) {
    return null;
  }
}

function modifierSourceId(document) {
  return String(document.system?.sourceId ?? document.flags?.anime5e?.sourceId ?? "").trim().toLowerCase();
}

function resolveWorldModifierBySourceId(sourceId, type) {
  const normalized = sourceId.toLowerCase();
  for (const item of game.items ?? []) {
    if (item.type === type && modifierSourceId(item) === normalized) {
      return modifierReferenceFromDocument(item, type);
    }
  }

  return null;
}

async function resolvePackModifierBySourceId(sourceId, type) {
  const config = ATTRIBUTE_MODIFIER_CONFIG[type];
  const pack = game.packs.get(config.pack);
  if (!pack) return null;

  const normalized = sourceId.toLowerCase();
  const index = Array.from(await pack.getIndex({
    fields: ["type", "system.sourceId", "flags.anime5e.sourceId"]
  }));
  const match = index.find((entry) => {
    if (entry.type !== type) return false;
    const entrySourceId = String(
      foundry.utils.getProperty(entry, "system.sourceId")
        ?? foundry.utils.getProperty(entry, "flags.anime5e.sourceId")
        ?? ""
    ).trim().toLowerCase();
    return entrySourceId === normalized;
  });
  if (!match) return null;

  const document = await pack.getDocument(match._id);
  return document ? modifierReferenceFromDocument(document, type) : null;
}

async function resolveAttributeModifierReference(reference, type) {
  const config = ATTRIBUTE_MODIFIER_CONFIG[type];
  const trimmed = String(reference ?? "").trim();
  if (!trimmed) return null;

  const byUuid = await resolveModifierByUuid(trimmed, type);
  if (byUuid) return byUuid;

  const byWorldSourceId = resolveWorldModifierBySourceId(trimmed, type);
  if (byWorldSourceId) return byWorldSourceId;

  const byPackSourceId = await resolvePackModifierBySourceId(trimmed, type);
  if (byPackSourceId) return byPackSourceId;

  const isUuidLike = trimmed.startsWith("Item.") || trimmed.startsWith("Compendium.");
  return {
    name: trimmed,
    sourceId: isUuidLike ? "" : trimmed,
    uuid: isUuidLike ? trimmed : "",
    pointModifier: config.pointModifier,
    assignmentCount: 1,
    notes: "Unresolved reference"
  };
}

function buildItemActions(item, systemData) {
  const isWeaponAttribute = isWeaponAttributeItem(item, systemData);
  const hasAttackModifier = hasNumericEntry(systemData.attackModifier) || hasNumericEntry(systemData.attackBonus);
  const damageFormula = weaponAttributeDamageFormula(item, systemData);

  return {
    canUse: true,
    canRoll: hasText(systemData.roll),
    canPowerCheck: isPowerCheckItem(item, systemData),
    canAttack: item.type === "weapon" || isWeaponAttribute || (item.type !== "attribute" && hasAttackModifier),
    canDamage: hasText(damageFormula)
  };
}

function buildConstructionPlaceholder(item, systemData = item.system ?? {}) {
  if (!CONSTRUCTION_ITEM_TYPES.has(item.type)) return null;

  if (item.type === "craftingProject") {
    const progress = Number(systemData.progress) || 0;
    const requiredProgress = Number(systemData.requiredProgress) || 0;
    const progressLabel = requiredProgress ? `${progress} / ${requiredProgress}` : String(progress);

    return {
      message: "Track DM-approved construction parameters, materials, helpers, progress, and completion state for this project.",
      rows: [
        { label: "Target Item", value: systemData.targetItem || "Unassigned" },
        { label: "Status", value: systemData.status || "Planning" },
        { label: "Progress", value: progressLabel },
        { label: "Material Cost", value: systemData.materialCost || "Unpriced" },
        { label: "DC", value: systemData.dc ?? "DM-set" },
        { label: "Linked Item", value: hasText(systemData.linkedItemUuid) ? "Linked" : "None" }
      ]
    };
  }

  if (item.type === "itemOfPower") {
    const basePoints = Number(systemData.points ?? systemData.cost) || 0;
    const attributePoints = Number(systemData.embeddedAttributePoints) || 0;
    const defectRefunds = Number(systemData.embeddedDefectPoints) || 0;
    const totalPoints = calculateEquipmentPointCost({ type: item.type, system: systemData });
    const itemAttributeRanks = Math.ceil(totalPoints / 5);

    return {
      message: "Track contained Attributes and Defects here; use the point fields as the Item of Power construction ledger.",
      rows: [
        { label: "Base Item Points", value: basePoints },
        { label: "Contained Attribute Points", value: attributePoints },
        { label: "Contained Defect Refunds", value: defectRefunds ? `-${defectRefunds}` : 0 },
        { label: "Total Item Cost", value: totalPoints },
        { label: "Item Attribute Ranks", value: itemAttributeRanks },
        { label: "Point Protection", value: totalPoints > 0 ? "Protected" : "Mundane" }
      ]
    };
  }

  const customization = ["attribute", "itemAttribute", "weapon"].includes(item.type)
    ? calculateAttributeCustomization({ type: item.type, name: item.name, system: systemData })
    : null;
  const equipmentPointCost = calculateEquipmentPointCost({ type: item.type, system: systemData });
  const explicitPointCost = Number(systemData.points ?? systemData.cost) || 0;
  const pointCost = customization?.totalCost ?? (equipmentPointCost || explicitPointCost);
  const itemAttributeRanks = pointCost > 0 ? Math.ceil(pointCost / 5) : 0;
  const rows = [
    { label: "Point Cost", value: pointCost },
    { label: "Item Attribute Ranks", value: itemAttributeRanks },
    { label: "Point Protection", value: pointCost > 0 ? "Protected" : "Mundane" },
    { label: "Construction Status", value: systemData.constructionStatus || "Manual bookkeeping" },
    hasText(systemData.value) ? { label: "Value", value: `${systemData.value} ${systemData.currency || ""}`.trim() } : null,
    hasText(systemData.weight) ? { label: "Weight", value: systemData.weight } : null,
    hasText(systemData.sourceTable) ? { label: "Source Table", value: systemData.sourceTable } : null
  ].filter(Boolean);

  return {
    message: "Track point-built Item cost, Item Attribute coverage, point protection, construction status, materials, time, helpers, value, weight, and DM notes.",
    rows
  };
}

function formatBenefit(benefit) {
  const label = benefit.label || benefit.type || "Benefit";
  const rank = Number(benefit.rank);
  const points = Number(benefit.points);
  const rankText = Number.isFinite(rank) && rank > 0 ? ` Rank ${rank}` : "";
  const pointText = Number.isFinite(points) && points !== 0 ? ` [${points}]` : "";
  const notes = hasText(benefit.notes) ? ` - ${benefit.notes}` : "";

  return `${label}${rankText}${pointText}${notes}`;
}

function buildClassProgression(item, systemData) {
  if (item.type !== "class") return null;

  const entries = Array.isArray(systemData.progression) ? systemData.progression : [];
  if (!entries.length) return null;

  return {
    summary: [
      { label: "1st-Level Base Points", value: systemData.basePoints },
      { label: "Levelling Points", value: systemData.levellingPoints },
      { label: "Bonus Points 1-20", value: systemData.bonusPoints },
      { label: "Final Class Points", value: systemData.finalClassPoints }
    ],
    entries: entries.map((entry) => ({
      level: entry.level,
      levelLabel: `${entry.level}`,
      proficiencyBonus: `+${Number(entry.proficiencyBonus) || 0}`,
      points: Number(entry.points) || 0,
      benefits: (entry.benefits ?? []).map(formatBenefit).join("; "),
      proficiencies: entry.proficiencies ?? "",
      notes: entry.notes ?? ""
    }))
  };
}

export class Anime5eItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["anime5e", "sheet", "item-sheet"],
    position: {
      width: 620
    },
    window: {
      resizable: true
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true
    }
  };

  static PARTS = {
    form: {
      template: "systems/anime5e/templates/item-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const systemData = this.item.system?.toObject?.() ?? foundry.utils.deepClone(this.item.system ?? {});

    context.item = this.item;
    context.system = this.item.system;
    context.detailFields = buildDetailFields(this.item, systemData);
    context.itemActions = buildItemActions(this.item, systemData);
    context.constructionPlaceholder = buildConstructionPlaceholder(this.item, systemData);
    context.classProgression = buildClassProgression(this.item, systemData);
    context.speciesTraits = buildSpeciesTraits(this.item, systemData);
    context.attributeModifiers = buildAttributeModifiers(this.item, systemData);
    return context;
  }

  async _onRender(context, options) {
    if (typeof super._onRender === "function") await super._onRender(context, options);

    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    if (!element) return;

    element.querySelector("[data-action='use-item']")?.addEventListener("click", this._onUseItem.bind(this));
    element.querySelector("[data-action='roll-item']")?.addEventListener("click", this._onRollItem.bind(this));
    element.querySelector("[data-action='roll-power-check']")?.addEventListener("click", this._onRollPowerCheck.bind(this));
    element.querySelector("[data-action='roll-item-attack']")?.addEventListener("click", this._onRollAttack.bind(this));
    element.querySelector("[data-action='roll-item-damage']")?.addEventListener("click", this._onRollDamage.bind(this));
    element.querySelectorAll("[data-action='add-attribute-modifier']").forEach((button) => {
      button.addEventListener("click", this._onAddAttributeModifier.bind(this));
    });
    element.querySelectorAll("[data-action='remove-attribute-modifier']").forEach((button) => {
      button.addEventListener("click", this._onRemoveAttributeModifier.bind(this));
    });
  }

  async _onUseItem(event) {
    event.preventDefault();
    await this._postItemUse(this.item);
  }

  async _onRollItem(event) {
    event.preventDefault();
    const formula = this.item.system?.roll?.trim();
    if (!formula) {
      ui.notifications?.warn("Enter a roll formula before rolling this item.");
      return;
    }

    await this._rollFormula(formula, `${this.item.name} Roll`);
  }

  async _onRollPowerCheck(event) {
    event.preventDefault();
    const actor = getItemActor(this.item);
    if (!actor) {
      ui.notifications?.warn("Add this power to an actor before rolling a Dynamic Powers check.");
      return;
    }

    const abilityKey = this.constructor._normalizeAbilityKey(this.item.system?.ability);
    const ability = actor.system.abilities?.[abilityKey];
    if (!ability) {
      ui.notifications?.warn(`Set a valid ability for ${this.item.name} before rolling it.`);
      return;
    }

    const bonus = Number(this.item.system?.checkBonus) || 0;
    const modifiers = [ability.modifier];
    if (bonus) modifiers.push(bonus);
    const abilityLabel = abilityKey.replace(/^./, (character) => character.toUpperCase());
    await this._rollFormula(buildD20Formula(modifiers), `${this.item.name} Power Check (${abilityLabel})`, {
      actor,
      targetNumber: hasNumericEntry(this.item.system?.dc) ? this.item.system.dc : null,
      details: [
        { label: "Category", value: this.item.system?.category },
        { label: "Energy", value: this.item.system?.energyCost }
      ]
    });
  }

  async _onRollAttack(event) {
    event.preventDefault();
    const modifier = Number(this.item.system?.attackModifier ?? this.item.system?.attackBonus) || 0;
    await this._rollFormula(buildD20Formula([modifier]), `${this.item.name} Attack`);
  }

  async _onRollDamage(event) {
    event.preventDefault();
    const formula = weaponAttributeDamageFormula(this.item);
    if (!formula) {
      ui.notifications?.warn("Enter a damage formula before rolling this item.");
      return;
    }

    const damageType = this.item.system?.damageType ? ` (${this.item.system.damageType})` : "";
    await this._rollFormula(formula, `${this.item.name} Damage${damageType}`);
  }

  async _onAddAttributeModifier(event) {
    event.preventDefault();
    const type = event.currentTarget?.dataset?.modifierType;
    const config = ATTRIBUTE_MODIFIER_CONFIG[type];
    if (!config) return;

    const root = event.currentTarget.closest(".anime5e-form");
    const input = root?.querySelector(`[data-modifier-input="${type}"]`);
    const value = input?.value?.trim();
    if (!value) {
      ui.notifications?.warn(`Enter a ${config.singular} sourceId or UUID first.`);
      return;
    }

    const reference = await resolveAttributeModifierReference(value, type);
    if (!reference) return;

    const references = cloneModifierReferences(this.item.system?.[config.field]);
    references.push(reference);
    await this.item.update({ [`system.${config.field}`]: references });
  }

  async _onRemoveAttributeModifier(event) {
    event.preventDefault();
    const type = event.currentTarget?.dataset?.modifierType;
    const config = ATTRIBUTE_MODIFIER_CONFIG[type];
    if (!config) return;

    const index = Number(event.currentTarget?.dataset?.index);
    if (!Number.isInteger(index) || index < 0) return;

    const references = cloneModifierReferences(this.item.system?.[config.field]);
    if (index >= references.length) return;

    references.splice(index, 1);
    await this.item.update({ [`system.${config.field}`]: references });
  }

  static _normalizeAbilityKey(value) {
    const normalized = String(value ?? "").trim().toLowerCase();
    const labels = {
      strength: "Strength",
      dexterity: "Dexterity",
      constitution: "Constitution",
      intelligence: "Intelligence",
      wisdom: "Wisdom",
      charisma: "Charisma"
    };
    if (!normalized) return null;
    if (labels[normalized]) return normalized;

    return Object.entries(labels).find(([, label]) => label.toLowerCase() === normalized)?.[0] ?? null;
  }

  async _rollFormula(formula, label, options = {}) {
    try {
      return rollAnime5eFormula({
        actor: options.actor ?? getItemActor(this.item),
        formula,
        label,
        details: options.details,
        targetNumber: options.targetNumber
      });
    } catch (error) {
      console.error("anime5e | Failed to roll item formula", formula, error);
      ui.notifications?.error(`Anime 5e could not roll "${formula}". Check the formula and try again.`);
      return null;
    }
  }

  async _postItemUse(item) {
    const system = item.system ?? {};
    const actor = getItemActor(item);
    const source = [system.source, system.sourcePage ? `p. ${system.sourcePage}` : null].filter(Boolean).join(", ");
    const description = hasText(system.description) ? `<p>${escapeHtml(system.description)}</p>` : "";
    const sourceLine = source ? `<p><small>${escapeHtml(source)}</small></p>` : "";
    const riskContent = item.type === "adventuringRisk" ? buildAdventuringRiskChatContent(item) : "";
    const usage = item.type === "attribute" ? buildCoreAttributeUsageContext(item) : null;
    const usageLine = usage?.summary?.length
      ? `<p><strong>Usage:</strong> ${escapeHtml(usage.summary.join(" | "))}</p>`
      : "";
    let energyLine = "";

    if (item.type === "attribute" && actor) {
      const energyCost = resolveCoreAttributeEnergyCost(item);
      const update = {};
      const energyMode = getEnergyUsageMode();

      if (energyCost.requiresPayment && energyMode === ENERGY_USAGE_MODES.disabled) {
        energyLine = `<p><strong>Energy:</strong> tracking is disabled for this world.</p>`;
      } else if (energyCost.requiresPayment && energyMode === ENERGY_USAGE_MODES.manual) {
        energyLine = `<p><strong>Energy:</strong> ${escapeHtml(energyCost.label)} requires manual payment tracking.</p>`;
        update["system.effectActive"] = true;
      } else if (energyCost.amount > 0) {
        const currentEnergy = Math.max(0, Number(actor.system?.combat?.energy?.value) || 0);
        if (currentEnergy < energyCost.amount) {
          ui.notifications?.warn(`${item.name} needs ${energyCost.amount} Energy, but ${actor.name} only has ${currentEnergy}.`);
          energyLine = `<p><strong>Energy:</strong> ${escapeHtml(actor.name)} has ${currentEnergy}/${energyCost.amount} required. Cost not paid.</p>`;
        } else {
          const change = await applyEnergyChange(actor, energyCost.amount, "spend");
          update["system.effectActive"] = true;
          update["system.energyPaid"] = true;
          energyLine = `<p><strong>Energy:</strong> spent ${change.amount}. EP ${change.current} &rarr; ${change.next} / ${change.max}.</p>`;
        }
      } else if (energyCost.requiresPayment) {
        energyLine = `<p><strong>Energy:</strong> ${escapeHtml(energyCost.label)} requires manual payment tracking.</p>`;
      } else {
        update["system.effectActive"] = true;
      }

      if (Object.keys(update).length) await item.update(update);
    }

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor }),
      content: `<article class="anime5e chat-card"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(item.type)}</strong></p>${usageLine}${energyLine}${riskContent || `${description}${sourceLine}`}</article>`
    });
  }
}
