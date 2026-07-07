import { buildD20Formula, evaluateAnime5eFormula, renderRollFlavor, rollAnime5eFormula } from "../rules/rolls.mjs";
import {
  buildCombatManoeuvreChatContent,
  combineD20Modes,
  getCombatManoeuvre,
  getCombatManoeuvreGroups
} from "../rules/combat-manoeuvres.mjs";
import {
  applySizeTemplateItem,
  applySpeciesItem,
  removeSizeTemplateItem,
  removeSpeciesItem,
  summarizePointState
} from "../rules/creation-workflow.mjs";
import { syncClassGrantedBenefits } from "../rules/class-benefits.mjs";
import { syncSpeciesGrantedTraits } from "../rules/species-traits.mjs";
import {
  buildCoreAttributeEffectContext,
  buildCoreAttributeUsageContext,
  getCoreAttributeEffectKey,
  resolveCoreAttributeEnergyCost
} from "../rules/attribute-effects.mjs";
import { buildAdventuringRiskChatContent } from "../rules/adventuring-risks.mjs";
import {
  buildDynamicPowerExpressionChatContent,
  buildDynamicPowerTrackingNote,
  getDynamicPowerExpressionEntries,
  isDynamicPowerItem
} from "../rules/dynamic-powers.mjs";
import {
  calculatePointSummary,
  calculateRecommendedDiscretionaryPoints,
  calculateStartingExperience,
  getLevelProgress,
  normalizeCharacterLevel,
  proficiencyBonusForLevel,
  summarizeClassLevelState
} from "../rules/points.mjs";
import {
  ENERGY_USAGE_MODES,
  applyDeprivationLoss,
  applyEnergyChange,
  applyHitPointChange,
  getEnergyUsageMode
} from "../rules/resources.mjs";
import { openCoreRulesReference } from "../rules/rules-reference.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const FOLIO_TABS = [
  {
    id: "overview",
    label: "Basic Information",
    shortLabel: "Basic",
    folioPages: "4",
    pdfPages: "6",
    summary: "Identity, ability scores, resources, class rows, common attacks, and physical notes."
  },
  {
    id: "attributes",
    label: "Attributes",
    shortLabel: "Attributes",
    folioPages: "5",
    pdfPages: "7",
    summary: "Attributes with ranks, enhancements, limiters, costs, and active derived effects."
  },
  {
    id: "skills",
    label: "Proficiencies",
    shortLabel: "Proficiencies",
    folioPages: "6",
    pdfPages: "8",
    summary: "Saving throws, armour, shields, weapons, tools, languages, skills, senses, and movement notes."
  },
  {
    id: "defects",
    label: "Defects",
    shortLabel: "Defects",
    folioPages: "6",
    pdfPages: "8",
    summary: "Defects with rank, point return, triggers, limitations, notes, and roleplaying guidance."
  },
  {
    id: "powers",
    label: "Magic, Psionics, and Spellcasting",
    shortLabel: "Magic",
    folioPages: "7",
    pdfPages: "9",
    summary: "Spells, powers, psionics, casting details, Energy costs, and activation notes."
  },
  {
    id: "inventory",
    label: "Items of Power and Gear",
    shortLabel: "Items",
    folioPages: "8-9, 14",
    pdfPages: "10-11, 16",
    summary: "Items of Power, equipment, treasure, gear, locations, and important possessions."
  },
  {
    id: "combat",
    label: "Weapons and Common Attacks",
    shortLabel: "Weapons",
    folioPages: "4, 11",
    pdfPages: "6, 13",
    summary: "Common attacks, Weapon Attribute entries, damage, attack controls, and combat actions."
  },
  {
    id: "companions",
    label: "Vehicles and Companions",
    shortLabel: "Companions",
    folioPages: "10, 12-13",
    pdfPages: "12, 14-15",
    summary: "Vehicles, mecha, mounts, companions, linked stat summaries, and owned equipment notes."
  },
  {
    id: "biography",
    label: "Goals and Biography",
    shortLabel: "Biography",
    folioPages: "15-19",
    pdfPages: "17-21",
    summary: "Goals, family, history, personality, allies, group role, and campaign identity."
  },
  {
    id: "journal",
    label: "Advancement and Journal",
    shortLabel: "Journal",
    folioPages: "20-24",
    pdfPages: "22-26",
    summary: "Levelling and advancement notes, session journal, rewards, downtime, and story events."
  }
];

const DEFAULT_FOLIO_TAB = FOLIO_TABS[0].id;
const FOLIO_TAB_IDS = new Set(FOLIO_TABS.map((tab) => tab.id));

const RULES_REFERENCE_LINKS = [
  { label: "Creation", icon: "fa-user-plus", sourceId: "core.rules.character-creation-overview" },
  { label: "Options", icon: "fa-list-check", sourceId: "core.rules.character-option-workflow" },
  { label: "Rolls", icon: "fa-dice-d20", sourceId: "core.rules.rolls-dc" },
  { label: "Combat", icon: "fa-crosshairs", sourceId: "core.rules.action-combat-flow" },
  { label: "Advancement", icon: "fa-arrow-up", sourceId: "core.rules.advancement-xp" },
  { label: "Items", icon: "fa-toolbox", sourceId: "core.rules.items-equipment-construction" },
  { label: "GM", icon: "fa-scale-balanced", sourceId: "core.rules.gm-guidance" }
];

const ABILITY_LABELS = {
  strength: "Strength",
  dexterity: "Dexterity",
  constitution: "Constitution",
  intelligence: "Intelligence",
  wisdom: "Wisdom",
  charisma: "Charisma"
};

const ROLL_MODES = {
  ability: {
    label: "Ability Check",
    includeProficiency: false
  },
  proficient: {
    label: "Proficient Check",
    includeProficiency: true
  },
  savingThrow: {
    label: "Saving Throw",
    includeProficiency: false
  },
  proficientSavingThrow: {
    label: "Proficient Save",
    includeProficiency: true
  },
  attack: {
    label: "Attack Roll",
    includeProficiency: false
  },
  proficientAttack: {
    label: "Proficient Attack",
    includeProficiency: true
  }
};

const D20_ROLL_MODES = [
  { key: "normal", label: "Normal" },
  { key: "advantage", label: "Advantage" },
  { key: "disadvantage", label: "Disadvantage" }
];

const COVER_OPTIONS = [
  { key: "none", label: "None", armourClassBonus: 0, note: "" },
  { key: "half", label: "Half", armourClassBonus: 2, note: "+2 AC and Dexterity saves" },
  { key: "threeQuarters", label: "3/4", armourClassBonus: 5, note: "+5 AC and Dexterity saves" },
  { key: "total", label: "Total", armourClassBonus: null, note: "Cannot be targeted directly by most attacks" }
];

const ITEM_GROUP_TYPES = {
  adventuringRisks: ["adventuringRisk"],
  characterOptions: ["species", "class", "background", "sizeTemplate", "lifepath", "feature", "trait"],
  combat: ["weapon", "armor", "shield", "technique", "attribute"],
  attributes: ["attribute", "enhancement", "limiter", "itemAttribute"],
  craftingProjects: ["craftingProject"],
  defects: ["defect"],
  skills: ["skill", "proficiency", "tool", "language", "trait", "background", "feature"],
  powers: ["power", "spell", "technique"],
  inventory: ["equipment", "loot", "weapon", "armor", "shield", "material", "itemAttribute", "itemOfPower"],
  companions: ["mount", "vehicle", "mecha", "monsterVariant"]
};

const DEFAULT_ITEM_TYPES = [
  "adventuringRisk",
  "armor",
  "attribute",
  "background",
  "class",
  "craftingProject",
  "defect",
  "enhancement",
  "equipment",
  "feature",
  "itemAttribute",
  "itemOfPower",
  "language",
  "lifepath",
  "limiter",
  "loot",
  "material",
  "mecha",
  "monsterVariant",
  "mount",
  "power",
  "proficiency",
  "shield",
  "skill",
  "sizeTemplate",
  "species",
  "spell",
  "technique",
  "tool",
  "trait",
  "vehicle",
  "weapon"
];

const EQUIPPABLE_ITEM_TYPES = new Set(["weapon", "armor", "shield"]);
const LINKABLE_ACTOR_ITEM_TYPES = new Set(["mount", "vehicle", "mecha", "monsterVariant"]);
const CREATURE_ACTOR_TYPES = new Set(["companion", "monster", "npc"]);
const TRANSPORT_ACTOR_TYPES = new Set(["itemConstruct", "mecha", "vehicle"]);
const WEAPON_ATTRIBUTE_SOURCE_ID = "core.attribute.weapon";
const DYNAMIC_POWER_SOURCE_IDS = new Set([
  "core.attribute.dynamic-powers",
  "core.attribute.dynamic-powers-lesser"
]);
const COMPLEX_ATTRIBUTE_SOURCE_IDS = new Set([
  "core.attribute.companion",
  "core.attribute.dynamic-powers",
  "core.attribute.dynamic-powers-lesser",
  "core.attribute.mimic",
  "core.attribute.mind-control",
  "core.attribute.mind-control-lesser",
  "core.attribute.minions",
  "core.attribute.minions-greater",
  "core.attribute.monster-training",
  "core.attribute.nullify",
  "core.attribute.pocket-dimension",
  "core.attribute.portal",
  "core.attribute.spell-like-ability",
  "core.attribute.telepathy",
  "core.attribute.telepathy-lesser",
  "core.attribute.transfer"
]);
const FOLLOWER_ATTRIBUTE_SOURCE_IDS = new Set([
  "core.attribute.companion",
  "core.attribute.minions",
  "core.attribute.minions-greater"
]);
const MINION_COUNT_BY_RANK = [
  "",
  "Up to 5",
  "6-10",
  "11-25",
  "26-50",
  "51-100",
  "101-250"
];

const REQUIRED_NUMBER_DEFAULTS = {
  "system.level": 1,
  "system.experience": 0,
  "system.identity.startingDiscretionaryPoints": 0,
  "system.identity.engagementBonusPoints": 0,
  "system.identity.otherNonLevellingPoints": 0,
  "system.points.spent": 0,
  "system.points.refunded": 0,
  "system.economy.currency.platinum": 0,
  "system.economy.currency.gold": 0,
  "system.economy.currency.silver": 0,
  "system.economy.currency.copper": 0,
  "system.combat.hitPoints.max": 0,
  "system.combat.hitPoints.value": 0,
  "system.combat.hitPoints.temporary": 0,
  "system.combat.energy.max": 0,
  "system.combat.energy.value": 0,
  "system.combat.armourClass": 10,
  "system.combat.movementSpeed": 30,
  "system.combat.proficiencyBonus": 2,
  "system.combat.initiative": 0,
  "system.progression.classes.primary.level": 0,
  "system.progression.classes.secondary.level": 0,
  "system.progression.classes.tertiary.level": 0
};

for (const ability of ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"]) {
  REQUIRED_NUMBER_DEFAULTS[`system.abilities.${ability}.value`] = 10;
}

for (const attack of ["primary", "secondary", "tertiary"]) {
  REQUIRED_NUMBER_DEFAULTS[`system.combat.attacks.${attack}.rangePenalty`] = 0;
  REQUIRED_NUMBER_DEFAULTS[`system.combat.attacks.${attack}.situationalModifier`] = 0;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function numberOrNull(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function numberFromText(value) {
  const match = String(value ?? "").match(/[+-]?\d+/);
  return match ? Number(match[0]) : 0;
}

function hasNumericEntry(value) {
  return value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value));
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : String(value);
}

function coverOption(key) {
  return COVER_OPTIONS.find((option) => option.key === key) ?? COVER_OPTIONS[0];
}

function adjustedTargetArmourClass(attack) {
  const baseArmourClass = numberOrNull(attack?.targetArmourClass);
  const cover = coverOption(attack?.cover);
  if (baseArmourClass === null || cover.armourClassBonus === null) return baseArmourClass;
  return baseArmourClass + cover.armourClassBonus;
}

function coverDetails(attack) {
  const cover = coverOption(attack?.cover);
  if (cover.key === "none") return [];
  const details = [{ label: "Cover", value: cover.note ? `${cover.label} (${cover.note})` : cover.label }];
  const baseArmourClass = numberOrNull(attack?.targetArmourClass);
  const targetArmourClass = adjustedTargetArmourClass(attack);
  if (baseArmourClass !== null && targetArmourClass !== null && targetArmourClass !== baseArmourClass) {
    details.push({ label: "Cover AC", value: `${baseArmourClass} -> ${targetArmourClass}` });
  }
  return details;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function settingEnabled(key) {
  try {
    return !!game.settings.get("anime5e", key);
  } catch {
    return false;
  }
}

function isStandardDamageType(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return !text || ["standard", "bludgeoning", "piercing", "slashing"].includes(text);
}

function sourceIdForItem(item) {
  const system = item.system ?? {};

  return String(
    system.sourceId
      ?? system.importId
      ?? item.flags?.anime5e?.sourceId
      ?? item.flags?.anime5e?.source?.importId
      ?? ""
  ).trim().toLowerCase();
}

function isWeaponAttributeItem(item) {
  if (item.type !== "attribute") return false;
  if (sourceIdForItem(item) === WEAPON_ATTRIBUTE_SOURCE_ID) return true;

  return String(item.name ?? "").trim().toLowerCase() === "weapon";
}

function isPowerCheckItem(item) {
  return item.type === "power" || isDynamicPowerItem(item);
}

function isComplexAttributeItem(item) {
  return item.type === "attribute" && COMPLEX_ATTRIBUTE_SOURCE_IDS.has(sourceIdForItem(item));
}

function isFollowerAttributeItem(item) {
  return item.type === "attribute" && FOLLOWER_ATTRIBUTE_SOURCE_IDS.has(sourceIdForItem(item));
}

function isSpellLikeAttributeItem(item) {
  return item.type === "attribute" && sourceIdForItem(item) === "core.attribute.spell-like-ability";
}

function linkedActorTypeForItem(item) {
  if (item.type === "vehicle") return "vehicle";
  if (item.type === "mecha") return "mecha";
  return "companion";
}

function followerPointBudgetForItem(item) {
  const sourceId = sourceIdForItem(item);
  const rank = Math.max(0, Math.trunc(Number(item.system?.rank) || 0));

  if (sourceId === "core.attribute.companion") return 50 + (rank * 10);
  if (sourceId === "core.attribute.minions-greater") return 70;
  if (sourceId === "core.attribute.minions") return 40;
  return null;
}

function minionCountForItem(item) {
  const sourceId = sourceIdForItem(item);
  if (!sourceId.startsWith("core.attribute.minions")) return "";

  const rank = Math.max(0, Math.trunc(Number(item.system?.rank) || 0));
  return MINION_COUNT_BY_RANK[rank] ?? "251+";
}

function followerKindForItem(item) {
  const sourceId = sourceIdForItem(item);
  if (sourceId === "core.attribute.companion") return "Companion";
  if (sourceId === "core.attribute.minions-greater") return "Greater Minions";
  if (sourceId === "core.attribute.minions") return "Minions";
  return "Follower";
}

function weaponAttributeDamageFormula(item) {
  const explicitDamage = item.system?.damage?.trim();
  if (explicitDamage) return explicitDamage;
  if (!isWeaponAttributeItem(item)) return "";

  const rank = Math.max(0, Math.trunc(Number(item.system?.rank) || 0));
  return rank > 0 ? `${rank}d4` : "";
}

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

function localizedType(documentName, type) {
  const key = `TYPES.${documentName}.${type}`;
  const localized = game.i18n.localize(key);
  return localized === key ? type : localized;
}

function normalizeRequiredNumbers(data) {
  for (const [path, fallback] of Object.entries(REQUIRED_NUMBER_DEFAULTS)) {
    const value = foundry.utils.getProperty(data, path);
    if (value === "" || value === null || Number.isNaN(Number(value))) {
      foundry.utils.setProperty(data, path, fallback);
    }
  }

  return data;
}

export class Anime5eActorSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["anime5e", "sheet", "actor-sheet"],
    position: {
      width: 920,
      height: 820
    },
    window: {
      resizable: true
    },
    form: {
      closeOnSubmit: false,
      submitOnChange: true,
      submitOnClose: true
    },
    tabs: [
      {
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: DEFAULT_FOLIO_TAB
      }
    ]
  };

  static PARTS = {
    form: {
      template: "systems/anime5e/templates/actor-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;
    const items = this.actor.items?.contents ?? [];

    context.actor = this.actor;
    context.system = system;
    context.items = items.map((item) => this.constructor._prepareItemContext(item));
    context.itemGroups = this.constructor._prepareItemGroups(context.items);
    context.pointSummary = this.constructor._preparePointSummary(system, items);
    context.linkedActors = await this.constructor._prepareLinkedActorContext(items);
    context.equipment = this.constructor._prepareEquipmentContext(system, items, context.items);
    context.speciesWorkflow = this.constructor._prepareSpeciesWorkflowContext(system, items, context.items, context.pointSummary.speciesTraitPlan);
    context.sizeTemplateWorkflow = this.constructor._prepareSizeTemplateWorkflowContext(system, items, context.items);
    context.attributeOffense = this.constructor._prepareAttributeOffenseContext(items, context.items);
    context.complexAttributes = this.constructor._prepareComplexAttributeContext(items, context.items);
    context.creation = this.constructor._prepareCreationContext(system, context.pointSummary, items);
    context.advancement = this.constructor._prepareAdvancementContext(system, context.pointSummary);
    context.attributeEffects = buildCoreAttributeEffectContext({
      system: this.actor._source?.system ?? system,
      items
    });
    context.combatEffects = this.constructor._prepareCombatEffectContext(system);
    context.energyMode = this.constructor._prepareEnergyModeContext();
    context.dynamicPowers = this.constructor._prepareDynamicPowerContext(items);
    context.creatureProfile = this.constructor._prepareCreatureProfileContext(this.actor, system, context.pointSummary);
    context.transportProfile = this.constructor._prepareTransportProfileContext(this.actor, system);
    context.economy = this.constructor._prepareEconomyContext(system);
    context.rulesReferenceLinks = RULES_REFERENCE_LINKS;
    const activeTab = FOLIO_TAB_IDS.has(this.tabGroups?.primary) ? this.tabGroups.primary : DEFAULT_FOLIO_TAB;
    context.activeTab = activeTab;
    context.activeTabs = Object.fromEntries(FOLIO_TABS.map((tab) => [tab.id, tab.id === context.activeTab]));
    context.tabs = FOLIO_TABS.map((tab) => ({ ...tab, active: tab.id === context.activeTab }));
    context.folioPages = Object.fromEntries(FOLIO_TABS.map((tab) => [tab.id, tab]));
    context.abilities = Object.entries(ABILITY_LABELS).map(([key, label]) => ({
      key,
      label,
      data: system.abilities[key],
      effectText: this.constructor._formatAbilityEffectText(system.abilities[key])
    }));
    context.rollModes = Object.entries(ROLL_MODES).map(([key, mode]) => ({ key, label: mode.label }));
    context.d20Modes = D20_ROLL_MODES;
    context.identityRows = [
      { label: "Character Name", name: "name", value: this.actor.name },
      { label: "Alias", name: "system.identity.alias", value: system.identity.alias },
      { label: "Player Name", name: "system.identity.playerName", value: system.identity.playerName },
      { label: "Species/Race", name: "system.identity.race", value: system.identity.race },
      { label: "Size Template", name: "system.identity.sizeTemplate", value: system.identity.sizeTemplate },
      { label: "Alignment", name: "system.identity.alignment", value: system.identity.alignment },
      { label: "Starting Discretionary Points", name: "system.identity.startingDiscretionaryPoints", value: system.identity.startingDiscretionaryPoints, type: "number" },
      { label: "Age and Gender", name: "system.identity.ageAndGender", value: system.identity.ageAndGender },
      { label: "Height and Weight", name: "system.identity.heightAndWeight", value: system.identity.heightAndWeight },
      { label: "Homeland/Habitat", name: "system.identity.homelandHabitat", value: system.identity.homelandHabitat },
      { label: "Campaign Title", name: "system.identity.campaignTitle", value: system.identity.campaignTitle },
      { label: "Game Master", name: "system.identity.gameMaster", value: system.identity.gameMaster },
      { label: "Creation Date", name: "system.identity.creationDate", value: system.identity.creationDate },
      { label: "Retirement Date", name: "system.identity.retirementDate", value: system.identity.retirementDate }
    ];
    context.classRows = [
      { key: "primary", data: system.progression.classes.primary },
      { key: "secondary", data: system.progression.classes.secondary },
      { key: "tertiary", data: system.progression.classes.tertiary }
    ];
    context.attackRows = [
      { key: "primary", data: system.combat.attacks.primary },
      { key: "secondary", data: system.combat.attacks.secondary },
      { key: "tertiary", data: system.combat.attacks.tertiary }
    ].map((row) => ({
      ...row,
      label: row.data.weapon || `${row.key.charAt(0).toUpperCase()}${row.key.slice(1)} Attack`,
      d20Modes: D20_ROLL_MODES.map((mode) => ({
        ...mode,
        selected: mode.key === (row.data.d20Mode || "normal")
      })),
      coverOptions: COVER_OPTIONS.map((cover) => ({
        ...cover,
        selected: cover.key === (row.data.cover || "none")
      }))
    }));
    context.combatManoeuvres = this.constructor._prepareCombatManoeuvreContext();

    return context;
  }

  static _prepareItemContext(item) {
    const system = item.system ?? {};
    const isWeaponAttribute = isWeaponAttributeItem(item);
    const effectKey = getCoreAttributeEffectKey(item);
    const canToggleEffect = item.type === "attribute" || !!effectKey;
    const effectUsage = canToggleEffect ? buildCoreAttributeUsageContext(item, { effectKey }) : null;
    const hasUsageLimits = !!effectUsage && (
      effectUsage.energy.label
      || effectUsage.scope
      || effectUsage.duration
      || effectUsage.targetCount
      || !effectUsage.effectActive
    );
    const hasAttackModifier = hasNumericEntry(system.attackModifier) || hasNumericEntry(system.attackBonus);
    const damageFormula = weaponAttributeDamageFormula(item);
    const tags = [
      system.rank !== undefined ? `Rank ${system.rank}` : null,
      system.cost !== undefined ? `Cost ${system.cost}` : null,
      system.pointsReturned !== undefined ? `Points ${system.pointsReturned}` : null,
      hasUsageLimits ? effectUsage.statusLabel : null,
      effectUsage?.energy?.label ? `Energy: ${effectUsage.energy.label}` : null,
      effectUsage?.durationRemaining ? `Remaining: ${effectUsage.durationRemaining}` : null,
      effectUsage?.targets ? `Affected: ${effectUsage.targets}` : null,
      system.quantity !== undefined ? `Qty ${system.quantity}` : null,
      system.equipped ? "Equipped" : null,
      system.category,
      system.status,
      hasText(system.targetItem) ? `Target: ${system.targetItem}` : null,
      system.progress !== undefined || system.requiredProgress !== undefined ? `Progress ${numberOrZero(system.progress)} / ${numberOrZero(system.requiredProgress)}` : null,
      system.dc !== undefined && system.dc !== null ? `DC ${system.dc}` : null,
      system.interval,
      system.damage,
      system.damageType,
      system.armourClass !== undefined ? `AC ${system.armourClass}` : null,
      system.speed,
      hasText(system.pilot) ? `Pilot: ${system.pilot}` : null,
      hasText(system.occupants) ? `Occupants: ${system.occupants}` : null,
      hasText(system.passengers) ? `Passengers: ${system.passengers}` : null,
      hasText(system.crew) ? `Crew: ${system.crew}` : null,
      hasText(system.linkedActorUuid) ? "Actor linked" : null
    ].filter(Boolean);
    const canApplyDeprivation = item.type === "adventuringRisk"
      && (/deprivation/i.test(system.category ?? "") || /deprivation/i.test(system.sourceId ?? "") || /deprivation/i.test(item.name ?? ""));

    return {
      id: item.id,
      img: item.img,
      name: item.name,
      type: item.type,
      typeLabel: localizedType("Item", item.type),
      tags,
      source: system.source,
      sourcePage: system.sourcePage,
      description: system.description,
      equipped: !!system.equipped,
      equippable: EQUIPPABLE_ITEM_TYPES.has(item.type),
      canLinkActor: LINKABLE_ACTOR_ITEM_TYPES.has(item.type),
      linkActorIcon: hasText(system.linkedActorUuid) ? "fa-external-link-alt" : "fa-link",
      linkActorTitle: hasText(system.linkedActorUuid) ? "Open linked actor" : "Create linked actor",
      canUse: true,
      canRoll: hasText(system.roll),
      canSkillCheck: item.type === "skill"
        || item.type === "tool"
        || (item.type === "proficiency" && !!this._normalizeAbilityKey(system.ability)),
      canPowerCheck: isPowerCheckItem(item),
      canDynamicPowerExpression: isDynamicPowerItem(item),
      canAttack: item.type === "weapon" || isWeaponAttribute || (item.type !== "attribute" && hasAttackModifier),
      canDamage: hasText(damageFormula),
      canApplyDeprivation,
      canToggleEffect,
      effectActive: effectUsage?.effectActive ?? true,
      effectToggleIcon: effectUsage?.effectActive === false ? "fa-toggle-off" : "fa-toggle-on",
      effectToggleTitle: effectUsage?.effectActive === false ? "Apply derived effect" : "Suspend derived effect",
      trackingNotes: system.trackingNotes
    };
  }

  static _prepareDynamicPowerContext(items = []) {
    const entries = getDynamicPowerExpressionEntries(items);

    return {
      active: entries.length > 0,
      entries
    };
  }

  static _prepareCreatureProfileContext(actor, system, pointSummary = {}) {
    const source = system.source ?? {};
    const sourceLabel = [source.book, source.page ? `p. ${source.page}` : null].filter(Boolean).join(", ");
    const identity = system.identity ?? {};
    const combat = system.combat ?? {};
    const hitPoints = combat.hitPoints ?? {};
    const listedPointBudget = numberOrZero(identity.totalPoints);
    const totalSpent = numberOrZero(pointSummary.totalSpent);
    const totalRefunded = numberOrZero(pointSummary.totalRefunded);
    const remainingFromListedBudget = listedPointBudget + totalRefunded - totalSpent;
    const speedValues = [
      numberOrZero(combat.baseMovementSpeed || combat.movementSpeed) ? `Ground ${numberOrZero(combat.baseMovementSpeed || combat.movementSpeed)}` : null,
      hasText(combat.flightSpeed) ? `Fly ${combat.flightSpeed}` : null,
      hasText(combat.waterSpeed) ? `Water ${combat.waterSpeed}` : null,
      hasText(combat.climbSpeed) ? `Climb ${combat.climbSpeed}` : null,
      hasText(combat.burrowSpeed) ? `Burrow ${combat.burrowSpeed}` : null,
      hasText(combat.customMovement) ? combat.customMovement : null
    ].filter(Boolean).join(", ");

    return {
      active: CREATURE_ACTOR_TYPES.has(actor.type),
      actorType: localizedType("Actor", actor.type),
      sourceLabel,
      hasSource: hasText(sourceLabel),
      challengeRows: [
        { label: "Actor Type", value: localizedType("Actor", actor.type) },
        { label: "Role", value: identity.actorRole },
        { label: "Size / Type", value: identity.speciesAndSize },
        { label: "Challenge", value: identity.challengeRating },
        { label: "XP", value: identity.experienceValue },
        { label: "AC", value: combat.armourClass },
        { label: "HP", value: `${numberOrZero(hitPoints.value)} / ${numberOrZero(hitPoints.max)}` },
        { label: "Speed", value: speedValues },
        { label: "Proficiency", value: combat.proficiencyBonus },
        { label: "Source", value: sourceLabel }
      ].filter((row) => row.value !== undefined && row.value !== null && row.value !== ""),
      pointRows: [
        { label: "Listed Point Budget", value: listedPointBudget },
        { label: "Owned/Manual Spending", value: totalSpent },
        { label: "Refunds", value: totalRefunded },
        { label: "Remaining From Listed Budget", value: remainingFromListedBudget },
        { label: "Attribute Cost", value: numberOrZero(pointSummary.attributeCost) },
        { label: "Equipment Cost", value: numberOrZero(pointSummary.equipmentCost) }
      ]
    };
  }

  static _prepareTransportProfileContext(actor, system) {
    const transport = system.transport ?? {};
    return {
      active: TRANSPORT_ACTOR_TYPES.has(actor.type),
      actorType: localizedType("Actor", actor.type),
      transport,
      hasLinkedActor: hasText(transport.linkedActorUuid)
    };
  }

  static async _prepareLinkedActorContext(items = []) {
    const linkedItems = items.filter((item) => hasText(item.system?.linkedActorUuid));
    const entries = await Promise.all(linkedItems.map(async (item) => {
      const uuid = item.system.linkedActorUuid.trim();
      const actor = await this._resolveLinkedDocument(uuid, "Actor");
      const actorType = actor ? localizedType("Actor", actor.type) : "Missing Actor";
      const pointBudget = numberOrZero(item.system?.totalPoints ?? item.system?.points ?? item.system?.cost);
      const tags = [
        localizedType("Item", item.type),
        actorType,
        pointBudget ? `${pointBudget} Points` : null,
        hasText(item.system?.pilot) ? `Pilot: ${item.system.pilot}` : null,
        hasText(item.system?.occupants) ? `Occupants: ${item.system.occupants}` : null,
        hasText(item.system?.passengers) ? `Passengers: ${item.system.passengers}` : null
      ].filter(Boolean);

      return {
        itemId: item.id,
        itemName: item.name,
        actorName: actor?.name ?? uuid,
        actorType,
        uuid,
        missing: !actor,
        tags
      };
    }));

    return {
      active: entries.length > 0,
      entries
    };
  }

  static _prepareEnergyModeContext() {
    const mode = getEnergyUsageMode();
    const labels = {
      [ENERGY_USAGE_MODES.tracked]: "Tracked Energy",
      [ENERGY_USAGE_MODES.manual]: "Manual Energy",
      [ENERGY_USAGE_MODES.disabled]: "Energy Disabled"
    };

    return {
      mode,
      label: labels[mode] ?? labels[ENERGY_USAGE_MODES.tracked],
      enabled: mode !== ENERGY_USAGE_MODES.disabled,
      tracked: mode === ENERGY_USAGE_MODES.tracked,
      manual: mode === ENERGY_USAGE_MODES.manual,
      disabled: mode === ENERGY_USAGE_MODES.disabled
    };
  }

  static _prepareEconomyContext(system) {
    const currency = system.economy?.currency ?? {};

    return {
      walletNotes: system.economy?.walletNotes ?? "",
      currencyRows: [
        { key: "platinum", label: "Platinum", value: numberOrZero(currency.platinum) },
        { key: "gold", label: "Gold", value: numberOrZero(currency.gold) },
        { key: "silver", label: "Silver", value: numberOrZero(currency.silver) },
        { key: "copper", label: "Copper", value: numberOrZero(currency.copper) }
      ]
    };
  }

  static _prepareItemGroups(items) {
    const byType = this._itemTypes().reduce((groups, type) => {
      groups[type] = items.filter((item) => item.type === type);
      return groups;
    }, {});

    return Object.entries(ITEM_GROUP_TYPES).reduce((groups, [group, types]) => {
      groups[group] = items.filter((item) => types.includes(item.type));
      return groups;
    }, { all: items, byType });
  }

  static _itemTypes() {
    return CONFIG.ANIME5E?.itemTypes ?? DEFAULT_ITEM_TYPES;
  }

  static _prepareEquipmentContext(system, rawItems, preparedItems) {
    const preparedById = new Map(preparedItems.map((item) => [item.id, item]));
    const equipped = rawItems.filter((item) => EQUIPPABLE_ITEM_TYPES.has(item.type) && item.system?.equipped);
    const equippedArmour = equipped.filter((item) => item.type === "armor");
    const equippedShields = equipped.filter((item) => item.type === "shield");
    const dexterityModifier = numberOrZero(system.abilities?.dexterity?.modifier);
    const manualArmourClass = numberOrZero(system.combat?.armourClass) || 10;

    const armourOptions = equippedArmour.map((item) => ({
      item,
      armourClass: this._calculateArmourClass(item, dexterityModifier)
    }));
    const selectedArmour = armourOptions.reduce((best, option) => {
      if (!best) return option;
      return option.armourClass > best.armourClass ? option : best;
    }, null);

    const shieldBonus = equippedShields.reduce((total, item) => {
      const modifier = item.system?.armourClassModifier ?? item.system?.armourClass;
      return total + numberOrZero(modifier);
    }, 0);
    const sizeArmourClassModifier = numberOrZero(system.creation?.sizeTemplateArmourClassModifier);
    const armourClass = (selectedArmour?.armourClass ?? manualArmourClass) + shieldBonus + (selectedArmour ? sizeArmourClassModifier : 0);
    const armourDetails = [
      selectedArmour ? `${selectedArmour.item.name} ${selectedArmour.armourClass}` : `Manual AC ${manualArmourClass}`,
      ...equippedShields.map((item) => {
        const modifier = item.system?.armourClassModifier ?? item.system?.armourClass;
        return `${item.name} +${numberOrZero(modifier)}`;
      }),
      selectedArmour && sizeArmourClassModifier ? `Size ${formatSigned(sizeArmourClassModifier)}` : null
    ].filter(Boolean);

    return {
      armourClass,
      armourDetails: armourDetails.join(" + "),
      armourWarning: equippedArmour.length > 1 ? "Multiple armour items are equipped; using the highest armour value." : "",
      weapons: equipped
        .filter((item) => item.type === "weapon")
        .map((item) => preparedById.get(item.id))
        .filter(Boolean)
    };
  }

  static _prepareSpeciesWorkflowContext(system, rawItems, preparedItems, speciesTraitPlan = {}) {
    const preparedById = new Map(preparedItems.map((item) => [item.id, item]));
    const appliedRef = String(system.creation?.speciesApplied ?? "");
    const identityRace = String(system.identity?.race ?? "").trim();
    const species = rawItems
      .filter((item) => item.type === "species")
      .map((item) => {
        const prepared = preparedById.get(item.id);
        const sourceLabel = [item.system?.source, item.system?.sourcePage ? `p. ${item.system.sourcePage}` : null].filter(Boolean).join(", ");
        const pointCost = Math.max(0, Number(item.system?.points ?? item.system?.cost) || 0);
        const isApplied = appliedRef === item.uuid || appliedRef === item.id || (!!identityRace && identityRace === item.name);
        const summary = stripHtml(item.system?.description);
        const abilityBonuses = Array.isArray(item.system?.abilityBonuses) ? item.system.abilityBonuses : [];
        const attributes = Array.isArray(item.system?.attributes) ? item.system.attributes : [];
        const defects = Array.isArray(item.system?.defects) ? item.system.defects : [];
        const languages = Array.isArray(item.system?.languages) ? item.system.languages : [];
        const movement = Array.isArray(item.system?.movement) ? item.system.movement : [];

        return {
          ...(prepared ?? {}),
          id: item.id,
          name: item.name,
          img: item.img,
          sourceId: item.system?.sourceId ?? "",
          sourceLabel,
          pointCost,
          pointCostLabel: `${pointCost} Point${pointCost === 1 ? "" : "s"}`,
          isApplied,
          speciesSize: item.system?.speciesSize ?? "",
          abilityBonuses,
          attributes,
          defects,
          languages,
          movement,
          traitNotes: item.system?.traitNotes ?? "",
          summary: summary.length > 220 ? `${summary.slice(0, 217)}...` : summary
        };
      });

    const appliedSpecies = species.find((item) => item.isApplied) ?? null;
    const warnings = [];
    if (!species.length) warnings.push("No Species/Race item is attached yet.");
    if (species.length > 1) warnings.push("Multiple Species/Race items are attached; choose the applied species or confirm this is intentional.");
    if (appliedRef && !appliedSpecies) warnings.push("Applied Species/Race reference no longer matches an owned species item.");

    const hasRacelessOption = species.some((item) => item.sourceId === "core.species.raceless-character" || item.name === "Raceless Character");
    const hasHybridSpecies = species.some((item) => /\bhybrid\b/i.test(`${item.name} ${item.sourceLabel}`));
    const specialPaths = [
      {
        label: "Raceless",
        status: hasRacelessOption ? "Selectable" : "Core option",
        note: hasRacelessOption
          ? "Apply the 0-point Raceless Character item for discretionary Race builds."
          : "Import Raceless Character from Core Character Options for 0-point Race builds."
      },
      {
        label: "Hybrid Species",
        status: hasHybridSpecies ? "Ready" : "Import",
        note: hasHybridSpecies
          ? "Apply a prebuilt Hybrid Species item; ability bonuses and managed traits sync like other Species."
          : "Import prebuilt hybrids from the Hybrid Species module or build one as a Species item."
      }
    ];

    return {
      active: species.length > 0 || warnings.length > 0,
      species,
      specialPaths,
      count: species.length,
      hasSpecies: species.length > 0,
      hasApplied: !!appliedSpecies,
      appliedName: appliedSpecies?.name ?? identityRace,
      appliedSource: appliedSpecies?.sourceLabel ?? "",
      appliedSpecies,
      traitPlan: speciesTraitPlan,
      totalCost: species.reduce((total, item) => total + item.pointCost, 0),
      warnings
    };
  }

  static _prepareSizeTemplateWorkflowContext(system, rawItems, preparedItems) {
    const preparedById = new Map(preparedItems.map((item) => [item.id, item]));
    const appliedRef = String(system.creation?.sizeTemplateApplied ?? "");
    const identitySizeTemplate = String(system.identity?.sizeTemplate ?? "").trim();
    const templates = rawItems
      .filter((item) => item.type === "sizeTemplate")
      .map((item) => {
        const prepared = preparedById.get(item.id);
        const sourceLabel = [item.system?.source, item.system?.sourcePage ? `p. ${item.system.sourcePage}` : null].filter(Boolean).join(", ");
        const pointCost = Number(item.system?.points ?? item.system?.costModifier ?? item.system?.cost) || 0;
        const isApplied = appliedRef === item.uuid || appliedRef === item.id || (!!identitySizeTemplate && identitySizeTemplate === item.name);
        const modifiers = [
          hasText(item.system?.sizeCategory) ? { label: "Category", value: item.system.sizeCategory } : null,
          hasText(item.system?.typicalHeight) ? { label: "Height", value: item.system.typicalHeight } : null,
          hasText(item.system?.typicalWeight) ? { label: "Weight", value: item.system.typicalWeight } : null,
          hasText(item.system?.liftCarryModifier) ? { label: "Lift/Carry", value: item.system.liftCarryModifier } : null,
          hasText(item.system?.strengthModifier) ? { label: "Strength", value: item.system.strengthModifier } : null,
          hasText(item.system?.strengthCheckModifier) ? { label: "Strength Check", value: item.system.strengthCheckModifier } : null,
          hasText(item.system?.damageModifier) ? { label: "Damage Inflicted", value: item.system.damageModifier } : null,
          hasText(item.system?.receivedDamageModifier) ? { label: "Damage Received", value: item.system.receivedDamageModifier } : null,
          Number(item.system?.armourClassModifier) ? { label: "AC", value: formatSigned(Number(item.system.armourClassModifier)) } : null,
          Number(item.system?.attackModifier) ? { label: "Offense Roll", value: formatSigned(Number(item.system.attackModifier)) } : null,
          hasText(item.system?.rangeSpeedModifier ?? item.system?.movementModifier) ? { label: "Range/Speed", value: item.system.rangeSpeedModifier ?? item.system.movementModifier } : null,
          hasText(item.system?.space) ? { label: "Space", value: item.system.space } : null,
          hasText(item.system?.reach) ? { label: "Reach", value: item.system.reach } : null
        ].filter(Boolean);
        const modifierTags = modifiers.map((modifier) => `${modifier.label}: ${modifier.value}`);
        const summary = stripHtml(item.system?.description);

        return {
          ...(prepared ?? {}),
          id: item.id,
          name: item.name,
          img: item.img,
          sourceLabel,
          pointCost,
          pointCostLabel: `${pointCost} Point${pointCost === 1 ? "" : "s"}`,
          isApplied,
          modifiers,
          modifierTags,
          hasModifiers: modifiers.length > 0,
          summary: summary.length > 180 ? `${summary.slice(0, 177)}...` : summary
        };
      });

    const appliedTemplate = templates.find((item) => item.isApplied) ?? null;
    const warnings = [];
    if (identitySizeTemplate && !appliedTemplate) warnings.push("Selected Size Template does not match an owned size-template item.");
    if (templates.length > 1 && !appliedTemplate) warnings.push("Multiple Size Template items are attached; choose the active size template.");

    return {
      active: templates.length > 0 || warnings.length > 0,
      templates,
      count: templates.length,
      hasTemplates: templates.length > 0,
      hasApplied: !!appliedTemplate,
      appliedName: appliedTemplate?.name ?? identitySizeTemplate,
      appliedSource: appliedTemplate?.sourceLabel ?? "",
      appliedModifiers: appliedTemplate?.modifiers ?? [],
      appliedModifierTags: appliedTemplate?.modifierTags ?? [],
      totalCost: templates.reduce((total, item) => total + item.pointCost, 0),
      warnings
    };
  }

  static _prepareAttributeOffenseContext(rawItems, preparedItems) {
    const preparedById = new Map(preparedItems.map((item) => [item.id, item]));
    const weapons = rawItems
      .filter((item) => isWeaponAttributeItem(item))
      .map((item) => {
        const prepared = preparedById.get(item.id);
        if (!prepared) return null;

        const damageFormula = weaponAttributeDamageFormula(item);
        const damageType = item.system?.damageType?.trim();
        const range = item.system?.range?.trim();
        const weaponNotes = item.system?.weaponNotes?.trim();
        const attackModifier = numberOrZero(item.system?.attackModifier);
        const rank = Math.max(0, Math.trunc(Number(item.system?.rank) || 0));

        return {
          ...prepared,
          canAttack: true,
          canDamage: hasText(damageFormula),
          rankLabel: `Rank ${rank}`,
          attackModifierLabel: `Attack ${formatSigned(attackModifier)}`,
          damageLabel: damageFormula || "No damage formula",
          damageTypeLabel: damageType || "Damage type unset",
          rangeLabel: range || "Melee",
          weaponNotes
        };
      })
      .filter(Boolean);

    return { weapons };
  }

  static _prepareComplexAttributeContext(rawItems, preparedItems) {
    const preparedById = new Map(preparedItems.map((item) => [item.id, item]));
    const items = rawItems
      .filter((item) => isComplexAttributeItem(item))
      .map((item) => {
        const prepared = preparedById.get(item.id);
        if (!prepared) return null;

        const system = item.system ?? {};
        const isFollower = isFollowerAttributeItem(item);
        const isMonsterTraining = sourceIdForItem(item) === "core.attribute.monster-training";
        const isSpellLike = isSpellLikeAttributeItem(item);
        const usage = buildCoreAttributeUsageContext(item, { rank: numberOrZero(system.rank) });
        const followerBudget = isFollower ? followerPointBudgetForItem(item) : null;
        const minionCount = isFollower ? minionCountForItem(item) : "";
        const spellEnergyCost = isSpellLike && hasText(system.spellEnergyCost) && system.spellEnergyCost !== "Rank squared Energy"
          ? system.spellEnergyCost
          : isSpellLike
            ? `${numberOrZero(system.rank) ** 2} Energy`
            : "";
        const trackingTags = [
          `Rank ${numberOrZero(system.rank)}`,
          isMonsterTraining ? `Techniques: ${numberOrZero(system.rank)}` : null,
          hasText(system.activeTrainingTechnique) ? `Technique: ${system.activeTrainingTechnique}` : null,
          hasText(system.trainingBenefit) ? `Benefit: ${system.trainingBenefit}` : null,
          hasText(system.spellName) ? `Spell: ${system.spellName}` : null,
          hasText(system.spellLevel) ? `Spell Level: ${system.spellLevel}` : null,
          Number.isFinite(followerBudget) ? `Budget: ${followerBudget} Points` : null,
          hasText(minionCount) ? `Count: ${minionCount}` : null,
          usage.statusLabel,
          hasText(system.scope) ? `Scope: ${system.scope}` : null,
          hasText(system.duration) ? `Duration: ${system.duration}` : null,
          hasText(system.durationRemaining) ? `Remaining: ${system.durationRemaining}` : null,
          hasText(system.targetCount) ? `Targets: ${system.targetCount}` : null,
          hasText(system.effectTargets) ? `Affected: ${system.effectTargets}` : null,
          usage.energyPaid ? "Energy paid" : null,
          hasText(spellEnergyCost) ? `Energy: ${spellEnergyCost}` : hasText(system.energyCost) ? `Energy: ${system.energyCost}` : null
        ].filter(Boolean);
        const linkTags = [
          hasText(system.linkedActorUuid) ? "Actor linked" : null,
          hasText(system.linkedItemUuid) ? "Item linked" : null,
          hasText(system.linkedDocumentUuid) ? "Document linked" : null
        ].filter(Boolean);

        return {
          ...prepared,
          trackingTags: [...trackingTags, ...linkTags],
          trackingSummary: system.trackingMode || system.progression || system.category || "Manual tracking",
          trackingNotes: system.trackingNotes,
          canLinkFollower: isFollower,
          linkFollowerIcon: hasText(system.linkedActorUuid) ? "fa-external-link-alt" : "fa-user-plus",
          linkFollowerTitle: hasText(system.linkedActorUuid) ? "Open linked actor" : "Create linked follower actor",
          canLinkSpell: isSpellLike,
          linkSpellIcon: hasText(system.linkedDocumentUuid) ? "fa-external-link-alt" : "fa-book-medical",
          linkSpellTitle: hasText(system.linkedDocumentUuid) ? "Open linked spell" : "Create linked spell item"
        };
      })
      .filter(Boolean);

    return { items };
  }

  static _formatAbilityEffectText(ability) {
    const effectBonus = numberOrZero(ability?.effectBonus);
    if (!effectBonus) return "";
    return `${formatSigned(effectBonus)} effective ${numberOrZero(ability?.effectiveValue)}`;
  }

  static _prepareCombatManoeuvreContext() {
    const groups = getCombatManoeuvreGroups();
    return {
      groups,
      defaultId: groups.flatMap((group) => group.entries)[0]?.id ?? ""
    };
  }

  static _prepareCombatEffectContext(system) {
    const hitPointBonus = numberOrZero(system.combat?.hitPoints?.effectBonus);
    const energyBonus = numberOrZero(system.combat?.energy?.effectBonus);
    const armourClassBonus = numberOrZero(system.combat?.armourClassEffectBonus);

    return {
      hitPoints: hitPointBonus ? `${formatSigned(hitPointBonus)} effective ${numberOrZero(system.combat?.hitPoints?.max)}` : "",
      energy: energyBonus ? `${formatSigned(energyBonus)} effective ${numberOrZero(system.combat?.energy?.max)}` : "",
      armourClass: armourClassBonus ? `${formatSigned(armourClassBonus)} effective ${numberOrZero(system.combat?.armourClass)}` : "",
      movement: hasText(system.combat?.movementSummary) ? system.combat.movementSummary : ""
    };
  }

  static _preparePointSummary(system, items = []) {
    const summary = calculatePointSummary(system, items);
    return {
      ...summary,
      spent: summary.manualSpent,
      refunded: summary.manualRefund
    };
  }

  static _prepareCreationContext(system, pointSummary, items = []) {
    const creation = system.creation ?? {};
    const startingLevel = normalizeCharacterLevel(creation.startingLevel ?? system.level);
    const startingExperience = numberOrZero(creation.startingExperience ?? system.experience);
    const recommendedExperience = calculateStartingExperience(startingLevel);
    const levelProgress = getLevelProgress(system.level, system.experience);
    const classLevel = summarizeClassLevelState(items, system.level);
    const validationStatus = creation.validationStatus || (pointSummary.warnings.length ? "warning" : "valid");
    const validationNotes = hasText(creation.validationNotes)
      ? creation.validationNotes
      : pointSummary.warnings.join("\n");

    return {
      startingLevel,
      startingExperience,
      abilityPointMode: creation.abilityPointMode ?? "Score equals Point cost",
      speciesApplied: creation.speciesApplied ?? "",
      sizeTemplateApplied: creation.sizeTemplateApplied ?? "",
      classApplied: creation.classApplied ?? "",
      sizeTemplateModifiers: [
        numberOrZero(creation.sizeTemplateArmourClassModifier) ? `AC ${formatSigned(numberOrZero(creation.sizeTemplateArmourClassModifier))}` : null,
        numberOrZero(creation.sizeTemplateAttackModifier) ? `Offense Roll ${formatSigned(numberOrZero(creation.sizeTemplateAttackModifier))}` : null,
        hasText(creation.sizeTemplateDamageModifier) ? `Damage ${creation.sizeTemplateDamageModifier}` : null,
        hasText(creation.sizeTemplateStrengthModifier) ? `Strength ${creation.sizeTemplateStrengthModifier}` : null,
        hasText(creation.sizeTemplateMovementModifier) ? `Range/Speed ${creation.sizeTemplateMovementModifier}` : null,
        hasText(creation.sizeTemplateLiftCarryModifier) ? `Lift/Carry ${creation.sizeTemplateLiftCarryModifier}` : null,
        hasText(creation.sizeTemplateReceivedDamageModifier) ? `Received Damage ${creation.sizeTemplateReceivedDamageModifier}` : null,
        hasText(creation.sizeTemplateSpace) ? `Size ${creation.sizeTemplateSpace}` : null,
        hasText(creation.sizeTemplateReach) ? `Reach ${creation.sizeTemplateReach}` : null
      ].filter(Boolean),
      recommendedDiscretionaryPoints: calculateRecommendedDiscretionaryPoints(startingLevel),
      recommendedExperience,
      hasRecommendedExperience: recommendedExperience !== null,
      levelProgress,
      classLevel,
      classBenefits: pointSummary.classBenefits,
      classBenefitPlan: pointSummary.classBenefitPlan,
      benchmark: pointSummary.benchmark,
      benchmarkSummary: pointSummary.benchmarkSummary,
      validationStatus,
      validationLabel: validationStatus.replace(/^./, (character) => character.toUpperCase()),
      validationNotes
    };
  }

  static _prepareAdvancementContext(system, pointSummary) {
    const levelProgress = getLevelProgress(system.level, system.experience);
    const engagementBonusPoints = numberOrZero(system.identity?.engagementBonusPoints);
    const otherNonLevellingPoints = numberOrZero(system.identity?.otherNonLevellingPoints);
    const discretionaryPoints = numberOrZero(system.identity?.startingDiscretionaryPoints);
    const recommendedDiscretionaryPoints = calculateRecommendedDiscretionaryPoints(system.level);
    const remaining = numberOrZero(pointSummary.remaining);
    const warnings = [];

    if (remaining < 0) warnings.push("Unspent point value is negative; reduce spending or add approved non-levelling points.");

    return {
      levelProgress,
      engagementBonusPoints,
      otherNonLevellingPoints,
      remaining,
      warnings,
      pointRows: [
        { label: "Available Points", value: pointSummary.available },
        { label: "Total Spent", value: pointSummary.totalSpent },
        { label: "Total Refunds", value: pointSummary.totalRefunded },
        { label: "Current Source Budget", value: discretionaryPoints },
        { label: "Level Benchmark Budget", value: recommendedDiscretionaryPoints },
        { label: "Remaining Points", value: remaining }
      ]
    };
  }

  static _prepareOwnedPointTotals(items) {
    return items.reduce((totals, item) => {
      const system = item.system ?? {};
      const rank = Math.max(0, Number(system.rank) || 0);

      if (item.type === "attribute") {
        totals.attributeCost += rank * Math.max(0, Number(system.cost) || 0);
      } else if (item.type === "defect") {
        totals.defectRefund += rank * Math.max(0, Number(system.pointsReturned) || 0);
      } else if (item.type === "species") {
        totals.speciesCost += Math.max(0, Number(system.points ?? system.cost) || 0);
        totals.speciesCount += 1;
      } else if (item.type === "class") {
        const level = Math.max(0, Number(system.level) || 0);
        totals.classCost += Math.max(0, Number(system.cost) || 0)
          + Math.max(0, Number(system.basePoints) || 0)
          + (level * Math.max(0, Number(system.pointsPerLevel) || 0));
        if (level > 0) {
          totals.classLevelItems += 1;
          totals.classLevelTotal += level;
        }
      }

      return totals;
    }, {
      attributeCost: 0,
      classCost: 0,
      classLevelItems: 0,
      classLevelTotal: 0,
      defectRefund: 0,
      speciesCost: 0,
      speciesCount: 0
    });
  }

  static _calculateArmourClass(item, dexterityModifier) {
    const baseArmourClass = numberOrZero(item.system?.armourClass) || 10;
    const category = String(item.system?.category ?? item.system?.properties ?? "");

    if (/medium armour/i.test(category)) return baseArmourClass + Math.min(dexterityModifier, 2);
    if (/heavy armour/i.test(category)) return baseArmourClass;
    return baseArmourClass + dexterityModifier;
  }

  async _onRender(context, options) {
    if (typeof super._onRender === "function") await super._onRender(context, options);

    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    if (!element) return;

    this._activateFolioTabs(element);

    element.querySelectorAll("[data-action='roll-ability']").forEach((button) => {
      button.addEventListener("click", this._onRollAbility.bind(this));
    });
    element.querySelectorAll("[data-action='roll-initiative']").forEach((button) => {
      button.addEventListener("click", this._onRollInitiative.bind(this));
    });
    element.querySelectorAll("[data-action='roll-quick']").forEach((button) => {
      button.addEventListener("click", this._onRollQuick.bind(this));
    });
    element.querySelectorAll("[data-action='roll-contest']").forEach((button) => {
      button.addEventListener("click", this._onRollContest.bind(this));
    });
    element.querySelectorAll("[data-action='roll-saving-throw']").forEach((button) => {
      button.addEventListener("click", this._onRollSavingThrow.bind(this));
    });
    element.querySelectorAll("[data-action='roll-attack']").forEach((button) => {
      button.addEventListener("click", this._onRollAttack.bind(this));
    });
    element.querySelectorAll("[data-action='roll-damage']").forEach((button) => {
      button.addEventListener("click", this._onRollDamage.bind(this));
    });
    element.querySelectorAll("[data-action='roll-combat-manoeuvre']").forEach((button) => {
      button.addEventListener("click", this._onRollCombatManoeuvre.bind(this));
    });
    element.querySelectorAll("[data-action='post-combat-manoeuvre']").forEach((button) => {
      button.addEventListener("click", this._onPostCombatManoeuvre.bind(this));
    });
    element.querySelectorAll("[data-action='apply-damage'], [data-action='apply-healing']").forEach((button) => {
      button.addEventListener("click", this._onApplyHitPointChange.bind(this));
    });
    element.querySelectorAll("[data-action='apply-deprivation-loss'], [data-action='recover-deprivation-loss']").forEach((button) => {
      button.addEventListener("click", this._onApplyDeprivationChange.bind(this));
    });
    element.querySelectorAll("[data-action='apply-risk-deprivation']").forEach((button) => {
      button.addEventListener("click", this._onApplyRiskDeprivation.bind(this));
    });
    element.querySelectorAll("[data-action='spend-energy'], [data-action='restore-energy']").forEach((button) => {
      button.addEventListener("click", this._onApplyEnergyChange.bind(this));
    });
    element.querySelectorAll("[data-action='use-item']").forEach((button) => {
      button.addEventListener("click", this._onUseItem.bind(this));
    });
    element.querySelectorAll("[data-action='roll-item']").forEach((button) => {
      button.addEventListener("click", this._onRollItem.bind(this));
    });
    element.querySelectorAll("[data-action='roll-skill-item']").forEach((button) => {
      button.addEventListener("click", this._onRollSkillItem.bind(this));
    });
    element.querySelectorAll("[data-action='roll-power-check']").forEach((button) => {
      button.addEventListener("click", this._onRollPowerCheck.bind(this));
    });
    element.querySelectorAll("[data-action='roll-dynamic-power-check']").forEach((button) => {
      button.addEventListener("click", this._onRollDynamicPowerCheck.bind(this));
    });
    element.querySelectorAll("[data-action='express-dynamic-power']").forEach((button) => {
      button.addEventListener("click", this._onExpressDynamicPower.bind(this));
    });
    element.querySelectorAll("[data-action='roll-item-attack']").forEach((button) => {
      button.addEventListener("click", this._onRollItemAttack.bind(this));
    });
    element.querySelectorAll("[data-action='roll-item-damage']").forEach((button) => {
      button.addEventListener("click", this._onRollItemDamage.bind(this));
    });
    element.querySelectorAll("[data-action='open-rules-reference']").forEach((button) => {
      button.addEventListener("click", this._onOpenRulesReference.bind(this));
    });
    element.querySelectorAll("[data-action='edit-item']").forEach((button) => {
      button.addEventListener("click", this._onEditItem.bind(this));
    });
    element.querySelectorAll("[data-action='delete-item']").forEach((button) => {
      button.addEventListener("click", this._onDeleteItem.bind(this));
    });
    element.querySelectorAll("[data-action='create-item']").forEach((button) => {
      button.addEventListener("click", this._onCreateItem.bind(this));
    });
    element.querySelectorAll("[data-action='toggle-equipped']").forEach((button) => {
      button.addEventListener("click", this._onToggleItemEquipped.bind(this));
    });
    element.querySelectorAll("[data-action='toggle-attribute-effect']").forEach((button) => {
      button.addEventListener("click", this._onToggleAttributeEffect.bind(this));
    });
    element.querySelectorAll("[data-action='apply-species']").forEach((button) => {
      button.addEventListener("click", this._onApplySpecies.bind(this));
    });
    element.querySelectorAll("[data-action='remove-species']").forEach((button) => {
      button.addEventListener("click", this._onRemoveSpecies.bind(this));
    });
    element.querySelectorAll("[data-action='sync-species-traits']").forEach((button) => {
      button.addEventListener("click", this._onSyncSpeciesTraits.bind(this));
    });
    element.querySelectorAll("[data-action='apply-size-template']").forEach((button) => {
      button.addEventListener("click", this._onApplySizeTemplate.bind(this));
    });
    element.querySelectorAll("[data-action='remove-size-template']").forEach((button) => {
      button.addEventListener("click", this._onRemoveSizeTemplate.bind(this));
    });
    element.querySelectorAll("[data-action='apply-creation-start']").forEach((button) => {
      button.addEventListener("click", this._onApplyCreationStart.bind(this));
    });
    element.querySelectorAll("[data-action='apply-point-budget']").forEach((button) => {
      button.addEventListener("click", this._onApplyPointBudget.bind(this));
    });
    element.querySelectorAll("[data-action='level-up']").forEach((button) => {
      button.addEventListener("click", this._onLevelUp.bind(this));
    });
    element.querySelectorAll("[data-action='advance-class-item']").forEach((button) => {
      button.addEventListener("click", this._onAdvanceClassItem.bind(this));
    });
    element.querySelectorAll("[data-action='sync-class-benefits']").forEach((button) => {
      button.addEventListener("click", this._onSyncClassBenefits.bind(this));
    });
    element.querySelectorAll("[data-action='create-linked-follower']").forEach((button) => {
      button.addEventListener("click", this._onCreateLinkedFollower.bind(this));
    });
    element.querySelectorAll("[data-action='create-linked-actor']").forEach((button) => {
      button.addEventListener("click", this._onCreateLinkedActor.bind(this));
    });
    element.querySelectorAll("[data-action='open-linked-actor']").forEach((button) => {
      button.addEventListener("click", this._onOpenLinkedActor.bind(this));
    });
    element.querySelectorAll("[data-action='create-linked-spell']").forEach((button) => {
      button.addEventListener("click", this._onCreateLinkedSpell.bind(this));
    });
    element.querySelectorAll("[data-item-id]").forEach((row) => {
      row.draggable = true;
      row.addEventListener("dragstart", this._onDragStart.bind(this));
    });
    element.querySelectorAll("[data-drop-target='items']").forEach((target) => {
      target.addEventListener("dragover", (event) => event.preventDefault());
      target.addEventListener("drop", this._onDrop.bind(this));
    });
  }

  _activateFolioTabs(element) {
    const navItems = Array.from(element.querySelectorAll(".sheet-tabs [data-tab]"));
    const pages = Array.from(element.querySelectorAll(".folio-tab[data-tab]"));
    if (!navItems.length || !pages.length) return;

    const activate = (tabId) => {
      const nextTab = FOLIO_TAB_IDS.has(tabId) ? tabId : DEFAULT_FOLIO_TAB;
      this.tabGroups ??= {};
      this.tabGroups.primary = nextTab;

      for (const item of navItems) {
        const active = item.dataset.tab === nextTab;
        item.classList.toggle("active", active);
        item.setAttribute("aria-selected", String(active));
      }

      for (const page of pages) {
        page.classList.toggle("active", page.dataset.tab === nextTab);
      }
    };

    for (const item of navItems) {
      item.addEventListener("click", (event) => {
        event.preventDefault();
        activate(event.currentTarget.dataset.tab);
      });
    }

    activate(this.tabGroups?.primary);
  }

  _prepareSubmitData(event, form, formData, updateData) {
    const submitData = super._prepareSubmitData(event, form, formData, updateData);
    return normalizeRequiredNumbers(submitData);
  }

  async _onRollAbility(event) {
    event.preventDefault();
    const abilityKey = event.currentTarget.dataset.ability;
    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) return;

    const label = event.currentTarget.dataset.label ?? `${abilityKey} Check`;
    await this._rollFormula(buildD20Formula([ability.modifier]), label);
  }

  async _onRollInitiative(event) {
    event.preventDefault();
    const initiative = this.actor.system.combat?.initiative ?? 0;
    const panel = event.currentTarget.closest(".combat-panel");
    const rollMode = panel?.querySelector("[data-roll-input='initiativeD20Mode']")?.value ?? "normal";
    const formula = buildD20Formula([initiative], { mode: rollMode });
    const combatant = this._getActiveCombatant();
    if (!combatant) {
      await this._rollFormula(formula, "Initiative", { mode: rollMode });
      return;
    }

    try {
      const roll = await evaluateAnime5eFormula(formula);
      await game.combat.setInitiative(combatant.id, roll.total);

      await roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor, token: combatant.token }),
        flavor: renderRollFlavor({
          actor: this.actor,
          label: "Initiative",
          formula,
          result: roll.total,
          mode: rollMode
        })
      });
    } catch (error) {
      console.error("anime5e | Failed to roll combat initiative", error);
      ui.notifications?.error("Anime 5e could not roll initiative. Check the console for details.");
    }
  }

  async _onRollQuick(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".quick-roll-panel");
    const abilityKey = panel?.querySelector("[data-roll-input='ability']")?.value ?? "strength";
    const modeKey = panel?.querySelector("[data-roll-input='mode']")?.value ?? "ability";
    const rollMode = panel?.querySelector("[data-roll-input='d20Mode']")?.value ?? "normal";
    const dc = Number(panel?.querySelector("[data-roll-input='dc']")?.value) || 0;
    const situationalBonus = Number(panel?.querySelector("[data-roll-input='bonus']")?.value) || 0;
    const ability = this.actor.system.abilities?.[abilityKey];
    const mode = ROLL_MODES[modeKey] ?? ROLL_MODES.ability;
    if (!ability) return;

    const modifiers = [ability.modifier];
    if (mode.includeProficiency) modifiers.push(this.actor.system.combat?.proficiencyBonus ?? 0);
    if (situationalBonus) modifiers.push(situationalBonus);

    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    const dcLabel = dc > 0 ? ` vs DC ${dc}` : "";
    // Anime 5E Core Rules pp. 153-156 define checks, saving throws, initiative, and attacks as d20 plus the relevant modifiers.
    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${mode.label}: ${abilityLabel}${dcLabel}`, {
      mode: rollMode,
      targetNumber: dc > 0 ? dc : null,
      showMargin: dc > 0
    });
  }

  async _onRollContest(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".quick-roll-panel");
    const abilityKey = panel?.querySelector("[data-roll-input='ability']")?.value ?? "strength";
    const modeKey = panel?.querySelector("[data-roll-input='mode']")?.value ?? "ability";
    const rollMode = panel?.querySelector("[data-roll-input='d20Mode']")?.value ?? "normal";
    const situationalBonus = Number(panel?.querySelector("[data-roll-input='bonus']")?.value) || 0;
    const ability = this.actor.system.abilities?.[abilityKey];
    const mode = ROLL_MODES[modeKey] ?? ROLL_MODES.ability;
    if (!ability) return;

    const modifiers = [ability.modifier];
    if (mode.includeProficiency) modifiers.push(this.actor.system.combat?.proficiencyBonus ?? 0);
    if (situationalBonus) modifiers.push(situationalBonus);

    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${mode.label} Contest: ${abilityLabel}`, { mode: rollMode });
  }

  async _onRollSavingThrow(event) {
    event.preventDefault();
    const abilityKey = event.currentTarget.dataset.ability;
    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) return;

    const panel = event.currentTarget.closest(".save-roll-panel");
    const rollMode = panel?.querySelector("[data-roll-input='saveD20Mode']")?.value ?? "normal";
    const includeProficiency = !!panel?.querySelector("[data-roll-input='saveProficiency']")?.checked
      || this.constructor._hasSavingThrowProficiency(this.actor, abilityKey);
    const modifiers = [ability.modifier];
    if (includeProficiency) modifiers.push(this.actor.system.combat?.proficiencyBonus ?? 0);

    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    const proficiencyLabel = includeProficiency ? "Proficient " : "";
    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${abilityLabel} ${proficiencyLabel}Saving Throw`, { mode: rollMode });
  }

  async _onRollAttack(event) {
    event.preventDefault();
    const attackKey = event.currentTarget.dataset.attack;
    const attack = this.actor.system.combat?.attacks?.[attackKey];
    if (!attack) return;

    const modifier = Number(attack.modifier) || 0;
    const situationalModifier = numberOrZero(attack.situationalModifier);
    const shouldApplyRangePenalty = settingEnabled("applyRangePenalties");
    const rangePenalty = shouldApplyRangePenalty ? numberOrZero(attack.rangePenalty) : 0;
    const sizeAttackModifier = numberOrZero(this.actor.system.creation?.sizeTemplateAttackModifier);
    const modifiers = [modifier];
    if (situationalModifier) modifiers.push(situationalModifier);
    if (sizeAttackModifier) modifiers.push(sizeAttackModifier);
    if (rangePenalty) modifiers.push(-rangePenalty);

    const rollMode = attack.d20Mode || "normal";
    const details = [
      { label: "Attack Type", value: attack.attackType },
      { label: "Range", value: attack.range },
      situationalModifier ? { label: "Situational", value: formatSigned(situationalModifier) } : null,
      sizeAttackModifier ? { label: "Size", value: formatSigned(sizeAttackModifier) } : null,
      rangePenalty ? { label: "Range Penalty", value: `-${rangePenalty}` } : null,
      ...coverDetails(attack)
    ].filter(Boolean);

    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${attack.weapon || "Attack"} Roll`, {
      mode: rollMode,
      details,
      targetNumber: adjustedTargetArmourClass(attack),
      showMargin: settingEnabled("showMarginOfSuccess"),
      showCritical: settingEnabled("showCriticalRollNotes")
    });
  }

  async _onRollDamage(event) {
    event.preventDefault();
    const attackKey = event.currentTarget.dataset.attack;
    const attack = this.actor.system.combat?.attacks?.[attackKey];
    const formula = attack?.damage?.trim();
    if (!formula) {
      ui.notifications?.warn("Enter a damage formula before rolling damage.");
      return;
    }

    const sizeDamageModifier = numberFromText(this.actor.system.creation?.sizeTemplateDamageModifier);
    const damageFormula = sizeDamageModifier ? `${formula} ${sizeDamageModifier > 0 ? "+" : "-"} ${Math.abs(sizeDamageModifier)}` : formula;
    const details = [
      sizeDamageModifier ? { label: "Size Damage", value: formatSigned(sizeDamageModifier) } : null
    ].filter(Boolean);

    await this._rollFormula(damageFormula, `${attack.weapon || "Attack"} Damage`, { details });
  }

  async _onRollCombatManoeuvre(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".combat-manoeuvre-panel");
    const manoeuvre = getCombatManoeuvre(panel?.querySelector("[data-manoeuvre-input='id']")?.value);
    if (!manoeuvre) return;
    if (manoeuvre.rollKind !== "attack") {
      ui.notifications?.warn(`${manoeuvre.label} is a reminder. Post it to chat instead of rolling an attack.`);
      return;
    }

    const attackKey = panel?.querySelector("[data-manoeuvre-input='attack']")?.value ?? "primary";
    const attack = this.actor.system.combat?.attacks?.[attackKey];
    if (!attack) return;

    const modifier = Number(attack.modifier) || 0;
    const situationalModifier = numberOrZero(attack.situationalModifier);
    const shouldApplyRangePenalty = settingEnabled("applyRangePenalties");
    const rangePenalty = shouldApplyRangePenalty ? numberOrZero(attack.rangePenalty) : 0;
    const sizeAttackModifier = numberOrZero(this.actor.system.creation?.sizeTemplateAttackModifier);
    const modifiers = [modifier];
    if (situationalModifier) modifiers.push(situationalModifier);
    if (sizeAttackModifier) modifiers.push(sizeAttackModifier);
    if (rangePenalty) modifiers.push(-rangePenalty);

    const attackMode = attack.d20Mode || "normal";
    const rollMode = combineD20Modes(attackMode, manoeuvre.rollMode);
    const attackName = attack.weapon || `${attackKey.charAt(0).toUpperCase()}${attackKey.slice(1)} Attack`;
    const details = [
      { label: "Manoeuvre", value: manoeuvre.label },
      { label: "Effect", value: manoeuvre.summary },
      { label: "Attack Type", value: attack.attackType },
      { label: "Range", value: attack.range },
      attackMode !== rollMode ? { label: "Combined Mode", value: rollMode } : null,
      situationalModifier ? { label: "Situational", value: formatSigned(situationalModifier) } : null,
      sizeAttackModifier ? { label: "Size", value: formatSigned(sizeAttackModifier) } : null,
      rangePenalty ? { label: "Range Penalty", value: `-${rangePenalty}` } : null,
      ...coverDetails(attack),
      { label: "Source", value: `Core Rules PDF p. ${manoeuvre.sourcePage}` }
    ].filter(Boolean);

    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${attackName}: ${manoeuvre.label}`, {
      mode: rollMode,
      details,
      targetNumber: adjustedTargetArmourClass(attack),
      showMargin: settingEnabled("showMarginOfSuccess"),
      showCritical: settingEnabled("showCriticalRollNotes")
    });
  }

  async _onPostCombatManoeuvre(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".combat-manoeuvre-panel");
    const manoeuvre = getCombatManoeuvre(panel?.querySelector("[data-manoeuvre-input='id']")?.value);
    if (!manoeuvre) return;

    const attackKey = panel?.querySelector("[data-manoeuvre-input='attack']")?.value ?? "";
    const attack = attackKey ? this.actor.system.combat?.attacks?.[attackKey] : null;
    const attackName = attack?.weapon || "";
    const rollMode = attack ? combineD20Modes(attack.d20Mode || "normal", manoeuvre.rollMode) : manoeuvre.rollMode;

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: buildCombatManoeuvreChatContent(manoeuvre, { actor: this.actor, attackName, rollMode })
    });
  }

  async _onUseItem(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item) return;

    await this._postItemUse(item);
  }

  async _onRollItem(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    const formula = item?.system?.roll?.trim();
    if (!formula) {
      ui.notifications?.warn("Enter a roll formula before rolling this item.");
      return;
    }

    await this._rollFormula(formula, `${item.name} Roll`);
  }

  async _onRollSkillItem(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item) return;

    const abilityKey = this.constructor._normalizeAbilityKey(item.system?.ability);
    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) {
      ui.notifications?.warn(`Set a valid ability for ${item.name} before rolling it.`);
      return;
    }

    const panel = event.currentTarget.closest(".skill-roll-panel, .folio-tab");
    const rollMode = panel?.querySelector("[data-roll-input='skillD20Mode']")?.value ?? "normal";
    const situationalBonus = Number(panel?.querySelector("[data-roll-input='skillBonus']")?.value) || 0;
    const modifiers = [ability.modifier, this.actor.system.combat?.proficiencyBonus ?? 0];
    if (situationalBonus) modifiers.push(situationalBonus);
    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${item.name} Check (${abilityLabel})`, { mode: rollMode });
  }

  async _onRollPowerCheck(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item) return;

    const abilityKey = this.constructor._normalizeAbilityKey(item.system?.ability);
    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) {
      ui.notifications?.warn(`Set a valid ability for ${item.name} before rolling it.`);
      return;
    }

    const bonus = numberOrZero(item.system?.checkBonus);
    const modifiers = [ability.modifier];
    if (bonus) modifiers.push(bonus);
    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    const details = [
      { label: "Category", value: item.system?.category },
      { label: "Energy", value: item.system?.energyCost },
      { label: "Limits", value: item.system?.activationLimits ? "See item notes" : "" }
    ];

    await this._rollFormula(buildD20Formula(modifiers), `${item.name} Power Check (${abilityLabel})`, {
      details,
      targetNumber: numberOrNull(item.system?.dc),
      showMargin: settingEnabled("showMarginOfSuccess")
    });
  }

  _getDynamicPowerPanelData(event) {
    const panel = event.currentTarget.closest(".dynamic-power-panel");
    const itemId = panel?.querySelector("[data-dynamic-power-input='itemId']")?.value ?? "";
    const item = this.actor.items.get(itemId);
    const effectRank = Math.max(0, Math.trunc(Number(panel?.querySelector("[data-dynamic-power-input='effectRank']")?.value) || 0));
    const energyCost = Math.max(0, Math.trunc(Number(panel?.querySelector("[data-dynamic-power-input='energyCost']")?.value) || 0));

    return {
      panel,
      item,
      abilityKey: this.constructor._normalizeAbilityKey(panel?.querySelector("[data-dynamic-power-input='ability']")?.value ?? item?.system?.ability),
      expression: panel?.querySelector("[data-dynamic-power-input='expression']")?.value ?? "",
      notes: panel?.querySelector("[data-dynamic-power-input='notes']")?.value ?? "",
      effectRank,
      energyCost,
      bonus: Number(panel?.querySelector("[data-dynamic-power-input='bonus']")?.value) || 0,
      rollMode: panel?.querySelector("[data-dynamic-power-input='d20Mode']")?.value ?? "normal"
    };
  }

  async _onRollDynamicPowerCheck(event) {
    event.preventDefault();
    const { item, abilityKey, effectRank, energyCost, expression, notes, bonus, rollMode } = this._getDynamicPowerPanelData(event);
    if (!item || !isDynamicPowerItem(item)) {
      ui.notifications?.warn("Select an owned Dynamic Powers item first.");
      return;
    }

    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) {
      ui.notifications?.warn(`Choose the ability used for ${item.name}.`);
      return;
    }

    const itemBonus = numberOrZero(item.system?.checkBonus);
    const modifiers = [ability.modifier];
    if (itemBonus) modifiers.push(itemBonus);
    if (bonus) modifiers.push(bonus);
    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    const details = [
      { label: "Expression", value: expression },
      { label: "Effect Rank", value: effectRank || "" },
      { label: "Energy", value: energyCost || item.system?.energyCost },
      { label: "Notes", value: notes }
    ];

    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${item.name} Dynamic Power Check (${abilityLabel})`, {
      details,
      mode: rollMode,
      targetNumber: numberOrNull(item.system?.dc),
      showMargin: settingEnabled("showMarginOfSuccess")
    });
  }

  async _onExpressDynamicPower(event) {
    event.preventDefault();
    const { item, expression, effectRank, energyCost, notes } = this._getDynamicPowerPanelData(event);
    if (!item || !isDynamicPowerItem(item)) {
      ui.notifications?.warn("Select an owned Dynamic Powers item first.");
      return;
    }

    const energyLine = await this._buildDynamicPowerEnergyLine(item, energyCost);
    if (this.isEditable) {
      const trackingNote = buildDynamicPowerTrackingNote({ expression, effectRank, energyCost, notes });
      await item.update({
        "system.trackingNotes": this.constructor._appendTrackingNote(item.system?.trackingNotes, trackingNote)
      });
    }

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: buildDynamicPowerExpressionChatContent({
        actor: this.actor,
        item,
        expression,
        effectRank,
        energyCost,
        notes,
        energyLine
      })
    });
  }

  async _buildDynamicPowerEnergyLine(item, amount) {
    const guidance = item.system?.energyCost || "DM-approved Energy cost by expressed effect Rank";
    if (!amount) return `<p><strong>Energy:</strong> ${escapeHtml(guidance)}.</p>`;

    const energyMode = getEnergyUsageMode();
    if (energyMode === ENERGY_USAGE_MODES.disabled) {
      return `<p><strong>Energy:</strong> tracking is disabled for this world; ${amount} Energy was not spent.</p>`;
    }
    if (energyMode === ENERGY_USAGE_MODES.manual) {
      return `<p><strong>Energy:</strong> ${amount} Energy approved; track payment manually.</p>`;
    }

    const currentEnergy = Math.max(0, Number(this.actor.system?.combat?.energy?.value) || 0);
    if (currentEnergy < amount) {
      ui.notifications?.warn(`${item.name} needs ${amount} Energy, but ${this.actor.name} only has ${currentEnergy}.`);
      return `<p><strong>Energy:</strong> ${escapeHtml(this.actor.name)} has ${currentEnergy}/${amount} required. Cost not paid.</p>`;
    }

    const change = await applyEnergyChange(this.actor, amount, "spend");
    return `<p><strong>Energy:</strong> spent ${change.amount}. EP ${change.current} &rarr; ${change.next} / ${change.max}.</p>`;
  }

  async _onRollItemAttack(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item) return;

    const modifier = Number(item.system?.attackModifier ?? item.system?.attackBonus) || 0;
    const sizeAttackModifier = numberOrZero(this.actor.system.creation?.sizeTemplateAttackModifier);
    const details = [
      { label: "Category", value: item.system?.category },
      { label: "Range", value: item.system?.range },
      sizeAttackModifier ? { label: "Size", value: formatSigned(sizeAttackModifier) } : null
    ].filter(Boolean);
    await this._rollFormula(buildD20Formula([modifier, sizeAttackModifier].filter(Boolean)), `${item.name} Attack`, {
      details,
      showCritical: settingEnabled("showCriticalRollNotes")
    });
  }

  async _onRollItemDamage(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    const formula = item ? weaponAttributeDamageFormula(item) : "";
    if (!formula) {
      ui.notifications?.warn("Enter a damage formula before rolling this item.");
      return;
    }

    const sizeDamageModifier = numberFromText(this.actor.system.creation?.sizeTemplateDamageModifier);
    const damageFormula = sizeDamageModifier ? `${formula} ${sizeDamageModifier > 0 ? "+" : "-"} ${Math.abs(sizeDamageModifier)}` : formula;
    const damageType = item.system?.damageType ? ` (${item.system.damageType})` : "";
    const details = [
      sizeDamageModifier ? { label: "Size Damage", value: formatSigned(sizeDamageModifier) } : null
    ].filter(Boolean);
    await this._rollFormula(damageFormula, `${item.name} Damage${damageType}`, { details });
  }

  static _normalizeAbilityKey(value) {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return null;
    if (ABILITY_LABELS[normalized]) return normalized;

    return Object.entries(ABILITY_LABELS).find(([, label]) => label.toLowerCase() === normalized)?.[0] ?? null;
  }

  static _hasSavingThrowProficiency(actor, abilityKey) {
    const abilityLabel = ABILITY_LABELS[abilityKey]?.toLowerCase();
    if (!abilityLabel) return false;

    return actor.items?.some((item) => {
      if (item.type !== "proficiency") return false;
      const category = String(item.system?.category ?? "").toLowerCase();
      const itemName = String(item.name ?? "").toLowerCase();
      if (!category.includes("saving") && !itemName.includes("saving throw")) return false;

      const itemAbility = this._normalizeAbilityKey(item.system?.ability);
      return itemAbility === abilityKey
        || itemName.includes(`${abilityLabel} saving throw`)
        || itemName.includes(`${abilityKey} saving throw`);
    }) ?? false;
  }

  async _rollFormula(formula, label, options = {}) {
    try {
      return rollAnime5eFormula({
        actor: this.actor,
        formula,
        label,
        mode: options.mode,
        details: options.details,
        targetNumber: options.targetNumber,
        showMargin: options.showMargin,
        showCritical: options.showCritical
      });
    } catch (error) {
      console.error("anime5e | Failed to roll formula", formula, error);
      ui.notifications?.error(`Anime 5e could not roll "${formula}". Check the formula and try again.`);
      return null;
    }
  }

  async _onApplyHitPointChange(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".damage-panel");
    const amountInput = panel?.querySelector("[data-damage-input='amount']");
    const typeInput = panel?.querySelector("[data-damage-input='type']");
    const amount = Math.max(0, Math.trunc(Number(amountInput?.value) || 0));
    if (!amount) {
      ui.notifications?.warn("Enter a damage or healing amount first.");
      return;
    }

    const mode = event.currentTarget.dataset.action === "apply-healing" ? "healing" : "damage";
    await this._applyHitPointChange(amount, mode, typeInput?.value ?? "");
  }

  async _applyHitPointChange(amount, mode, damageType = "") {
    const sizeReceivedDamageModifier = mode === "damage" && isStandardDamageType(damageType)
      ? numberFromText(this.actor.system.creation?.sizeTemplateReceivedDamageModifier)
      : 0;
    const adjustedAmount = mode === "damage" ? Math.max(0, amount + sizeReceivedDamageModifier) : amount;
    const change = await applyHitPointChange(this.actor, adjustedAmount, mode);
    const label = mode === "healing" ? "heals" : "takes";
    const sizeLine = sizeReceivedDamageModifier ? ` Size received-damage modifier ${formatSigned(sizeReceivedDamageModifier)} adjusted ${amount} to ${adjustedAmount}.` : "";
    const typedAmount = mode === "damage" && damageType ? `${change.amount} ${escapeHtml(damageType)}` : change.amount;
    const noun = mode === "healing" ? "HP" : "damage";
    const tempLine = mode === "damage" && change.absorbed
      ? ` ${change.absorbed} absorbed by temporary HP (${change.temporary} &rarr; ${change.nextTemporary}).`
      : "";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> ${label} ${typedAmount} ${noun}. HP ${change.current} &rarr; ${change.next} / ${change.max}.${sizeLine}${tempLine}</p>`
    });
  }

  async _onApplyDeprivationChange(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".deprivation-panel");
    const amountInput = panel?.querySelector("[data-deprivation-input='amount']");
    const amount = Math.max(1, Math.trunc(Number(amountInput?.value) || 1));
    const mode = event.currentTarget.dataset.action === "recover-deprivation-loss" ? "recover" : "apply";
    await this._applyDeprivationChange(amount, mode);
  }

  async _onApplyRiskDeprivation(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item || item.type !== "adventuringRisk") return;

    await this._applyDeprivationChange(1, "apply", item);
  }

  async _applyDeprivationChange(amount, mode, item = null) {
    const change = await applyDeprivationLoss(this.actor, amount, mode);
    const verb = mode === "recover" ? "recovers" : "suffers";
    const source = item ? ` from ${escapeHtml(item.name)}` : "";
    const interval = item?.system?.interval ? ` Interval: ${escapeHtml(item.system.interval)}.` : "";
    const note = mode === "recover"
      ? " Maximum HP is no longer reduced by that deprivation loss, but HP is not healed automatically."
      : " Deprivation loss reduces maximum HP and cannot be healed until the deprivation ends.";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> ${verb} ${change.amount} deprivation Hit Point loss${source}. HP ${change.current} &rarr; ${change.next}; deprivation loss ${change.currentLoss} &rarr; ${change.nextLoss}; maximum HP is now ${change.nextMax}.${interval}${note}</p>`
    });
  }

  async _onOpenRulesReference(event) {
    event.preventDefault();
    await openCoreRulesReference(event.currentTarget.dataset.sourceId);
  }

  async _onLevelUp(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const currentLevel = normalizeCharacterLevel(this.actor.system?.level);
    const nextLevel = currentLevel + 1;
    const nextExperience = calculateStartingExperience(nextLevel);
    const currentExperience = Math.max(0, Math.trunc(Number(this.actor.system?.experience) || 0));
    const targetExperience = nextExperience === null ? currentExperience : Math.max(currentExperience, nextExperience);
    const classItems = (this.actor.items?.contents ?? []).filter((item) => item.type === "class");
    if (classItems.length > 1) {
      ui.notifications?.warn("Use the per-class advance controls for multiclass characters.");
      return;
    }
    const selectedClass = classItems.length === 1 ? classItems[0] : null;
    const nextClassLevel = selectedClass ? nextLevel : null;
    const confirmed = await this._confirmLevelUp({ currentLevel, nextLevel, targetExperience, selectedClass, nextClassLevel });
    if (!confirmed) return;

    if (selectedClass) {
      await selectedClass.update({ "system.level": nextClassLevel });
    }

    const currentDiscretionaryPoints = numberOrZero(this.actor.system?.identity?.startingDiscretionaryPoints);
    const recommendedDiscretionaryPoints = calculateRecommendedDiscretionaryPoints(nextLevel);
    const update = {
      "system.level": nextLevel,
      "system.experience": targetExperience,
      "system.combat.proficiencyBonus": proficiencyBonusForLevel(nextLevel)
    };
    if (currentDiscretionaryPoints < recommendedDiscretionaryPoints) {
      update["system.identity.startingDiscretionaryPoints"] = recommendedDiscretionaryPoints;
    }

    if (selectedClass) {
      const slot = this.constructor._classSlotForItem(this.actor, selectedClass);
      update[`system.progression.classes.${slot}.name`] = selectedClass.name;
      update[`system.progression.classes.${slot}.level`] = nextClassLevel;
      update[`system.progression.classes.${slot}.hitDice`] = selectedClass.system?.hitDice ?? "";
    }

    await this.actor.update({
      ...update,
      ...summarizePointState(this.actor)
    });
    await syncClassGrantedBenefits(this.actor);

    if (!selectedClass && classItems.length !== 1) {
      ui.notifications?.warn("Level increased, but no single owned Class item could be advanced automatically. Update class levels manually.");
    }

    const budgetLine = currentDiscretionaryPoints < recommendedDiscretionaryPoints
      ? ` Discretionary Point budget increases from ${currentDiscretionaryPoints} to ${recommendedDiscretionaryPoints}. Allocate unspent points from the Point Summary.`
      : " Review remaining points in the Point Summary for any new allocation.";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> advances from Level ${currentLevel} to Level ${nextLevel}. XP is now ${targetExperience}; Proficiency Bonus is +${proficiencyBonusForLevel(nextLevel)}.${selectedClass ? ` ${escapeHtml(selectedClass.name)} is now Class Level ${nextClassLevel}.` : " Review owned Class items manually."}${budgetLine}</p>`
    });
  }

  async _onAdvanceClassItem(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this.actor.items.get(event.currentTarget.dataset.itemId);
    if (!item || item.type !== "class") {
      ui.notifications?.warn("Select an owned Class item to advance.");
      return;
    }

    const classItems = (this.actor.items?.contents ?? []).filter((entry) => entry.type === "class");
    const currentClassLevel = Math.max(0, Math.trunc(Number(item.system?.level) || 0));
    if (currentClassLevel >= 20) {
      ui.notifications?.warn(`${item.name} is already at Class Level 20.`);
      return;
    }

    const currentClassTotal = classItems.reduce((total, entry) => total + Math.max(0, Math.trunc(Number(entry.system?.level) || 0)), 0);
    const nextClassLevel = currentClassLevel + 1;
    const nextActorLevel = Math.max(1, currentClassTotal + 1);
    const nextExperience = calculateStartingExperience(nextActorLevel);
    const currentExperience = Math.max(0, Math.trunc(Number(this.actor.system?.experience) || 0));
    const targetExperience = nextExperience === null ? currentExperience : Math.max(currentExperience, nextExperience);
    const confirmed = await this._confirmAdvanceClass({ item, currentClassLevel, nextClassLevel, nextActorLevel, targetExperience });
    if (!confirmed) return;

    await item.update({ "system.level": nextClassLevel });

    const currentDiscretionaryPoints = numberOrZero(this.actor.system?.identity?.startingDiscretionaryPoints);
    const recommendedDiscretionaryPoints = calculateRecommendedDiscretionaryPoints(nextActorLevel);
    const slot = this.constructor._classSlotForItem(this.actor, item);
    const update = {
      "system.level": nextActorLevel,
      "system.experience": targetExperience,
      "system.combat.proficiencyBonus": proficiencyBonusForLevel(nextActorLevel),
      [`system.progression.classes.${slot}.name`]: item.name,
      [`system.progression.classes.${slot}.level`]: nextClassLevel,
      [`system.progression.classes.${slot}.hitDice`]: item.system?.hitDice ?? ""
    };
    if (currentDiscretionaryPoints < recommendedDiscretionaryPoints) {
      update["system.identity.startingDiscretionaryPoints"] = recommendedDiscretionaryPoints;
    }

    await this.actor.update({
      ...update,
      ...summarizePointState(this.actor)
    });
    const syncResult = await syncClassGrantedBenefits(this.actor);

    const syncLine = syncResult.created || syncResult.updated || syncResult.deleted
      ? ` Class benefits synced (${syncResult.created} created, ${syncResult.updated} updated, ${syncResult.deleted} removed).`
      : " Class benefits are already synced.";
    const budgetLine = currentDiscretionaryPoints < recommendedDiscretionaryPoints
      ? ` Discretionary Point budget increases from ${currentDiscretionaryPoints} to ${recommendedDiscretionaryPoints}.`
      : "";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> advances <strong>${escapeHtml(item.name)}</strong> from Class Level ${currentClassLevel} to ${nextClassLevel}. Total character level is now ${nextActorLevel}; XP is ${targetExperience}; Proficiency Bonus is +${proficiencyBonusForLevel(nextActorLevel)}.${budgetLine}${syncLine}</p>`
    });
  }

  async _confirmAdvanceClass({ item, currentClassLevel, nextClassLevel, nextActorLevel, targetExperience }) {
    const content = `<p>Advance <strong>${escapeHtml(item.name)}</strong> from Class Level ${currentClassLevel} to ${nextClassLevel}?</p><p>Total character level will become ${nextActorLevel}; XP will be at least ${targetExperience}; Proficiency Bonus will become +${proficiencyBonusForLevel(nextActorLevel)}.</p>`;
    const DialogV2 = foundry.applications.api.DialogV2;

    if (DialogV2?.confirm) {
      return DialogV2.confirm({
        window: { title: "Advance Class" },
        content,
        yes: { label: "Advance" },
        no: { label: "Cancel" }
      });
    }

    return window.confirm(`Advance ${item.name} to Class Level ${nextClassLevel}?`);
  }

  async _onSyncClassBenefits(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const result = await syncClassGrantedBenefits(this.actor);
    await this.actor.update(summarizePointState(this.actor));
    ui.notifications?.info(`Class benefits synced: ${result.created} created, ${result.updated} updated, ${result.deleted} removed.`);
  }

  async _confirmLevelUp({ currentLevel, nextLevel, targetExperience, selectedClass, nextClassLevel }) {
    const classLine = selectedClass
      ? `<p>Advance <strong>${escapeHtml(selectedClass.name)}</strong> to Class Level ${nextClassLevel}.</p>`
      : "<p>No single owned Class item can be advanced automatically; actor level, XP, and proficiency will still update.</p>";
    const content = `<p>Advance <strong>${escapeHtml(this.actor.name)}</strong> from Level ${currentLevel} to Level ${nextLevel}?</p><p>XP will be at least ${targetExperience}; Proficiency Bonus will become +${proficiencyBonusForLevel(nextLevel)}.</p>${classLine}`;
    const DialogV2 = foundry.applications.api.DialogV2;

    if (DialogV2?.confirm) {
      return DialogV2.confirm({
        window: { title: "Level Up" },
        content,
        yes: { label: "Level Up" },
        no: { label: "Cancel" }
      });
    }

    return window.confirm(`Advance ${this.actor.name} from Level ${currentLevel} to Level ${nextLevel}?`);
  }

  static _classSlotForItem(actor, item) {
    const classes = actor?.system?.progression?.classes ?? {};
    const slots = ["primary", "secondary", "tertiary"];
    for (const slot of slots) {
      if (classes[slot]?.name === item.name) return slot;
    }
    for (const slot of slots) {
      if (!String(classes[slot]?.name ?? "").trim()) return slot;
    }
    return "primary";
  }

  async _onApplyEnergyChange(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".energy-panel");
    const amountInput = panel?.querySelector("[data-energy-input='amount']");
    const amount = Math.max(0, Math.trunc(Number(amountInput?.value) || 0));
    if (!amount) {
      ui.notifications?.warn("Enter an Energy amount first.");
      return;
    }

    const mode = event.currentTarget.dataset.action === "restore-energy" ? "restore" : "spend";
    await this._applyEnergyChange(amount, mode);
  }

  async _applyEnergyChange(amount, mode) {
    const change = await applyEnergyChange(this.actor, amount, mode);
    if (change.disabled) {
      ui.notifications?.warn("Energy tracking is disabled for this world.");
      return null;
    }

    const verb = mode === "restore" ? "restores" : "spends";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> ${verb} ${change.amount} Energy. EP ${change.current} &rarr; ${change.next} / ${change.max}.</p>`
    });
  }

  async _postItemUse(item) {
    const system = item.system ?? {};
    const source = [system.source, system.sourcePage ? `p. ${system.sourcePage}` : null].filter(Boolean).join(", ");
    const description = hasText(system.description) ? `<p>${escapeHtml(system.description)}</p>` : "";
    const sourceLine = source ? `<p><small>${escapeHtml(source)}</small></p>` : "";
    const riskContent = item.type === "adventuringRisk" ? buildAdventuringRiskChatContent(item) : "";
    const usage = item.type === "attribute" ? buildCoreAttributeUsageContext(item) : null;
    const usageLine = usage?.summary?.length
      ? `<p><strong>Usage:</strong> ${escapeHtml(usage.summary.join(" | "))}</p>`
      : "";
    let energyLine = "";

    if (item.type === "attribute") {
      const energyCost = resolveCoreAttributeEnergyCost(item);
      const update = {};
      const energyMode = getEnergyUsageMode();

      if (energyCost.requiresPayment && energyMode === ENERGY_USAGE_MODES.disabled) {
        energyLine = `<p><strong>Energy:</strong> tracking is disabled for this world.</p>`;
      } else if (energyCost.requiresPayment && energyMode === ENERGY_USAGE_MODES.manual) {
        energyLine = `<p><strong>Energy:</strong> ${escapeHtml(energyCost.label)} requires manual payment tracking.</p>`;
        update["system.effectActive"] = true;
      } else if (energyCost.amount > 0) {
        const currentEnergy = Math.max(0, Number(this.actor.system?.combat?.energy?.value) || 0);
        if (currentEnergy < energyCost.amount) {
          ui.notifications?.warn(`${item.name} needs ${energyCost.amount} Energy, but ${this.actor.name} only has ${currentEnergy}.`);
          energyLine = `<p><strong>Energy:</strong> ${escapeHtml(this.actor.name)} has ${currentEnergy}/${energyCost.amount} required. Cost not paid.</p>`;
        } else {
          const change = await applyEnergyChange(this.actor, energyCost.amount, "spend");
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
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<article class="anime5e chat-card"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(localizedType("Item", item.type))}</strong></p>${usageLine}${energyLine}${riskContent || `${description}${sourceLine}`}</article>`
    });
  }

  _getEmbeddedItem(event) {
    return this.actor.items.get(event.currentTarget.closest("[data-item-id]")?.dataset.itemId);
  }

  _getActiveCombatant() {
    const combatants = game.combat?.combatants?.contents ?? Array.from(game.combat?.combatants ?? []);
    return combatants.find((combatant) => combatant.actor?.id === this.actor.id || combatant.actorId === this.actor.id);
  }

  _onEditItem(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    item?.sheet?.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item || !this.isEditable) return;

    const confirmed = await this._confirmItemDeletion(item);
    if (!confirmed) return;

    await item.delete();
  }

  async _confirmItemDeletion(item) {
    const DialogV2 = foundry.applications.api.DialogV2;
    if (DialogV2?.confirm) {
      return DialogV2.confirm({
        window: { title: "Delete Owned Item" },
        content: `<p>Delete <strong>${escapeHtml(item.name)}</strong> from ${escapeHtml(this.actor.name)}?</p>`,
        yes: { label: "Delete" },
        no: { label: "Cancel" }
      });
    }

    return window.confirm(`Delete ${item.name} from ${this.actor.name}?`);
  }

  async _onCreateItem(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const type = event.currentTarget.dataset.itemType ?? "equipment";
    if (!this.constructor._itemTypes().includes(type)) {
      ui.notifications?.warn(`Anime 5e does not define an item type named "${type}".`);
      return;
    }

    const typeLabel = localizedType("Item", type);
    const [item] = await this.actor.createEmbeddedDocuments("Item", [
      {
        name: `New ${typeLabel}`,
        type,
        img: "icons/svg/item-bag.svg"
      }
    ]);

    item?.sheet?.render(true);
  }

  async _onToggleItemEquipped(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || !EQUIPPABLE_ITEM_TYPES.has(item.type)) return;

    await item.update({ "system.equipped": !item.system?.equipped });
  }

  async _onToggleAttributeEffect(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || (item.type !== "attribute" && !getCoreAttributeEffectKey(item))) return;

    const nextActive = item.system?.effectActive === false;
    const update = { "system.effectActive": nextActive };
    if (!nextActive && item.type === "attribute") update["system.energyPaid"] = false;

    await item.update(update);
  }

  async _onApplySpecies(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || item.type !== "species") return;

    await applySpeciesItem(this.actor, item);
  }

  async _onRemoveSpecies(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || item.type !== "species") return;

    await removeSpeciesItem(this.actor, item);
  }

  async _onSyncSpeciesTraits(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const result = await syncSpeciesGrantedTraits(this.actor);
    await this.actor.update(summarizePointState(this.actor));
    ui.notifications?.info(`Species traits synced: ${result.created} created, ${result.updated} updated, ${result.deleted} removed.`);
  }

  async _onApplySizeTemplate(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || item.type !== "sizeTemplate") return;

    await applySizeTemplateItem(this.actor, item);
  }

  async _onRemoveSizeTemplate(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || item.type !== "sizeTemplate") return;

    await removeSizeTemplateItem(this.actor, item);
  }

  async _onApplyCreationStart(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const form = event.currentTarget.closest("form");
    const startingLevel = normalizeCharacterLevel(form?.elements["system.creation.startingLevel"]?.value ?? this.actor.system?.creation?.startingLevel);
    const enteredExperience = Math.max(0, Math.trunc(numberOrZero(form?.elements["system.creation.startingExperience"]?.value ?? this.actor.system?.creation?.startingExperience)));
    const recommendedExperience = calculateStartingExperience(startingLevel);
    const startingExperience = recommendedExperience ?? enteredExperience;
    const update = {
      "system.level": startingLevel,
      "system.experience": startingExperience,
      "system.creation.startingLevel": startingLevel,
      "system.creation.startingExperience": startingExperience
    };

    if (recommendedExperience === null) {
      ui.notifications?.info("No Anime 5e XP benchmark is defined above 20th level; using the entered starting XP.");
    }

    await this.actor.update(update);
  }

  async _onApplyPointBudget(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const form = event.currentTarget.closest("form");
    const startingLevel = normalizeCharacterLevel(form?.elements["system.creation.startingLevel"]?.value ?? this.actor.system?.creation?.startingLevel);
    await this.actor.update({
      "system.creation.startingLevel": startingLevel,
      "system.identity.startingDiscretionaryPoints": calculateRecommendedDiscretionaryPoints(startingLevel)
    });
  }

  async _onCreateLinkedFollower(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || !isFollowerAttributeItem(item)) return;

    const linkedActor = await this.constructor._resolveLinkedActor(item);
    if (linkedActor) {
      linkedActor.sheet?.render(true);
      return;
    }

    const rank = Math.max(0, Math.trunc(Number(item.system?.rank) || 0));
    const followerKind = followerKindForItem(item);
    const pointBudget = followerPointBudgetForItem(item);
    const minionCount = minionCountForItem(item);
    const pointBudgetLabel = hasText(minionCount) ? "Point Budget Per Minion" : "Point Budget";
    const sourceLine = [item.system?.source, item.system?.sourcePage ? `p. ${item.system.sourcePage}` : null].filter(Boolean).join(", ");
    const details = [
      `<p>Created from <strong>${escapeHtml(item.name)}</strong> on ${escapeHtml(this.actor.name)}.</p>`,
      Number.isFinite(pointBudget) ? `<p><strong>${pointBudgetLabel}:</strong> ${pointBudget} Points.</p>` : "",
      hasText(minionCount) ? `<p><strong>Minion Count:</strong> ${escapeHtml(minionCount)} at Rank ${rank}.</p>` : "",
      sourceLine ? `<p><small>${escapeHtml(sourceLine)}</small></p>` : ""
    ].join("");
    const actor = await Actor.create({
      name: `${this.actor.name} ${followerKind}`,
      type: "companion",
      img: item.img,
      system: {
        identity: {
          actorRole: followerKind,
          totalPoints: pointBudget,
          startingDiscretionaryPoints: pointBudget
        },
        source: {
          book: item.system?.source ?? "",
          page: item.system?.sourcePage ?? null,
          sourceId: item.system?.sourceId ?? "",
          importId: item.system?.importId ?? ""
        },
        notes: {
          overview: details,
          companions: details
        }
      }
    });

    if (!actor) return;

    await item.update({
      "system.linkedActorUuid": actor.uuid,
      "system.trackingNotes": this.constructor._appendTrackingNote(item.system?.trackingNotes, `Linked actor: ${actor.name} (${actor.uuid}).`)
    });
    actor.sheet?.render(true);
  }

  async _onCreateLinkedActor(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || !LINKABLE_ACTOR_ITEM_TYPES.has(item.type)) return;

    const linkedActor = await this.constructor._resolveLinkedActor(item);
    if (linkedActor) {
      linkedActor.sheet?.render(true);
      return;
    }

    const actorType = linkedActorTypeForItem(item);
    const pointBudget = numberOrZero(item.system?.totalPoints ?? item.system?.points ?? item.system?.cost);
    const sourceLine = [item.system?.source, item.system?.sourcePage ? `p. ${item.system.sourcePage}` : null].filter(Boolean).join(", ");
    const details = [
      `<p>Created from <strong>${escapeHtml(item.name)}</strong> on ${escapeHtml(this.actor.name)}.</p>`,
      pointBudget ? `<p><strong>Item Points:</strong> ${pointBudget}.</p>` : "",
      sourceLine ? `<p><small>${escapeHtml(sourceLine)}</small></p>` : ""
    ].join("");
    const actorSystem = {
      identity: {
        actorRole: localizedType("Item", item.type),
        totalPoints: pointBudget
      },
      combat: {
        armourClass: numberOrZero(item.system?.armourClass) || 10,
        movementSpeed: numberOrZero(item.system?.movementSpeed)
      },
      source: {
        book: item.system?.source ?? "",
        page: item.system?.sourcePage ?? null,
        sourceId: item.system?.sourceId ?? "",
        importId: item.system?.importId ?? ""
      },
      notes: {
        overview: details,
        companions: details
      }
    };

    if (actorType === "vehicle" || actorType === "mecha") {
      actorSystem.transport = {
        pilot: item.system?.pilot || this.actor.name,
        occupants: item.system?.occupants || item.system?.passengers || "",
        capacity: item.system?.passengers || "",
        crew: item.system?.crew || "",
        cargo: item.system?.cargo || "",
        linkedActorUuid: this.actor.uuid,
        itemBuildPoints: pointBudget
      };
    }

    const actor = await Actor.create({
      name: item.name,
      type: actorType,
      img: item.img,
      system: actorSystem
    });

    if (!actor) return;

    const update = {
      "system.linkedActorUuid": actor.uuid
    };
    if (item.type === "vehicle" || item.type === "mecha") {
      update["system.pilot"] = item.system?.pilot || this.actor.name;
    } else if (item.type === "mount") {
      update["system.rider"] = item.system?.rider || this.actor.name;
    }
    if ("owner" in (item.system ?? {})) update["system.owner"] = item.system?.owner || this.actor.name;

    await item.update(update);
    actor.sheet?.render(true);
  }

  async _onOpenLinkedActor(event) {
    event.preventDefault();

    const uuid = event.currentTarget.dataset.linkedUuid || this._getEmbeddedItem(event)?.system?.linkedActorUuid;
    const actor = await this.constructor._resolveLinkedDocument(uuid, "Actor");
    if (!actor) {
      ui.notifications?.warn("Anime 5e could not resolve that linked actor.");
      return;
    }

    actor.sheet?.render(true);
  }

  async _onCreateLinkedSpell(event) {
    event.preventDefault();
    if (!this.isEditable) return;

    const item = this._getEmbeddedItem(event);
    if (!item || !isSpellLikeAttributeItem(item)) return;

    const linkedDocument = await this.constructor._resolveLinkedDocument(item.system?.linkedDocumentUuid, "Item");
    if (linkedDocument) {
      linkedDocument.sheet?.render(true);
      return;
    }

    const rank = Math.max(0, Math.trunc(Number(item.system?.rank) || 0));
    const spellName = item.system?.spellName?.trim() || `${item.name} Effect`;
    const spellLevel = Math.max(0, Math.trunc(Number(item.system?.spellLevel) || Math.max(0, rank - 1)));
    const storedEnergyCost = item.system?.spellEnergyCost?.trim();
    const spellEnergyCost = hasText(storedEnergyCost) && storedEnergyCost !== "Rank squared Energy" ? storedEnergyCost : `${rank ** 2} Energy`;
    const spellEffect = item.system?.spellEffect?.trim() || item.system?.description || "";
    const sourceLine = [item.system?.source, item.system?.sourcePage ? `p. ${item.system.sourcePage}` : null].filter(Boolean).join(", ");
    const description = [
      `<p>Linked from <strong>${escapeHtml(item.name)}</strong> on ${escapeHtml(this.actor.name)}.</p>`,
      `<p><strong>Spell-Like Rank:</strong> ${rank}. <strong>Energy Cost:</strong> ${escapeHtml(spellEnergyCost)}.</p>`,
      hasText(item.system?.spellUsage) ? `<p><strong>Usage:</strong> ${escapeHtml(item.system.spellUsage)}</p>` : "",
      hasText(item.system?.spellPrerequisites) ? `<p><strong>Prerequisites:</strong> ${escapeHtml(item.system.spellPrerequisites)}</p>` : "",
      hasText(spellEffect) ? `<p>${escapeHtml(spellEffect)}</p>` : "",
      sourceLine ? `<p><small>${escapeHtml(sourceLine)}</small></p>` : ""
    ].join("");
    const [spell] = await this.actor.createEmbeddedDocuments("Item", [
      {
        name: spellName,
        type: "spell",
        img: "icons/svg/magic-swirl.svg",
        system: {
          description,
          rank,
          level: spellLevel,
          source: item.system?.source ?? "",
          sourcePage: item.system?.sourcePage ?? null,
          sourceId: item.system?.sourceId ?? "",
          importId: item.system?.importId ?? ""
        }
      }
    ]);

    if (!spell) return;

    await item.update({
      "system.linkedDocumentUuid": spell.uuid,
      "system.spellName": spellName,
      "system.spellLevel": String(spellLevel),
      "system.spellEnergyCost": spellEnergyCost,
      "system.trackingNotes": this.constructor._appendTrackingNote(item.system?.trackingNotes, `Linked spell: ${spell.name} (${spell.uuid}).`)
    });
    spell.sheet?.render(true);
  }

  static async _resolveLinkedActor(item) {
    const uuid = item.system?.linkedActorUuid?.trim();
    if (!uuid) return null;

    return this._resolveLinkedDocument(uuid, "Actor");
  }

  static async _resolveLinkedDocument(uuid, documentName = null) {
    if (!hasText(uuid)) return null;

    try {
      const document = await fromUuid(uuid);
      return !documentName || document?.documentName === documentName ? document : null;
    } catch (error) {
      console.warn("anime5e | Unable to resolve linked document", uuid, error);
      return null;
    }
  }

  static _appendTrackingNote(notes, note) {
    if (!hasText(notes)) return note;
    if (notes.includes(note)) return notes;

    return `${notes}\n${note}`;
  }

  _onDragStart(event) {
    const item = this.actor.items.get(event.currentTarget.dataset.itemId);
    if (!item) return;

    event.dataTransfer.effectAllowed = "copyMove";
    event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
  }

  async _onDrop(event) {
    event.preventDefault();
    const data = TextEditor.getDragEventData(event);
    if (data?.type !== "Item") {
      if (typeof super._onDrop === "function") return super._onDrop(event);
      return false;
    }

    const item = await Item.implementation.fromDropData(data);
    if (!item || item.parent === this.actor) return false;

    return this.actor.createEmbeddedDocuments("Item", [item.toObject()]);
  }

}

export class Anime5eBasicActorSheet extends Anime5eActorSheet {
  static DEFAULT_OPTIONS = {
    ...Anime5eActorSheet.DEFAULT_OPTIONS,
    classes: ["anime5e", "sheet", "actor-sheet", "basic-actor-sheet"],
    position: {
      width: 780,
      height: 720
    }
  };

  static PARTS = {
    form: {
      template: "systems/anime5e/templates/basic-actor-sheet.hbs"
    }
  };
}
