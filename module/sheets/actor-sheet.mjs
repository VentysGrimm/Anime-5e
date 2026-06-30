import { buildD20Formula, evaluateAnime5eFormula, renderRollFlavor, rollAnime5eFormula } from "../rules/rolls.mjs";
import { buildCoreAttributeEffectContext } from "../rules/attribute-effects.mjs";
import {
  calculatePointSummary,
  calculateRecommendedDiscretionaryPoints,
  calculateStartingExperience,
  getLevelProgress,
  normalizeCharacterLevel,
  summarizeClassLevelState
} from "../rules/points.mjs";
import { applyEnergyChange, applyHitPointChange } from "../rules/resources.mjs";

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

const ITEM_GROUP_TYPES = {
  characterOptions: ["species", "class", "background", "sizeTemplate", "lifepath", "feature", "trait"],
  combat: ["weapon", "armor", "shield", "technique", "attribute"],
  attributes: ["attribute", "enhancement", "limiter", "itemAttribute"],
  defects: ["defect"],
  skills: ["skill", "proficiency", "tool", "language", "trait", "background", "feature"],
  powers: ["power", "spell", "technique"],
  inventory: ["equipment", "loot", "weapon", "armor", "shield", "material", "itemAttribute", "itemOfPower"],
  companions: ["mount", "vehicle", "mecha", "monsterVariant"]
};

const DEFAULT_ITEM_TYPES = [
  "armor",
  "attribute",
  "background",
  "class",
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
const WEAPON_ATTRIBUTE_SOURCE_ID = "core.attribute.weapon";

const REQUIRED_NUMBER_DEFAULTS = {
  "system.level": 1,
  "system.experience": 0,
  "system.identity.startingDiscretionaryPoints": 0,
  "system.identity.engagementBonusPoints": 0,
  "system.identity.otherNonLevellingPoints": 0,
  "system.points.spent": 0,
  "system.points.refunded": 0,
  "system.combat.hitPoints.max": 0,
  "system.combat.hitPoints.value": 0,
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

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function formatSigned(value) {
  return value > 0 ? `+${value}` : String(value);
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
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
    context.equipment = this.constructor._prepareEquipmentContext(system, items, context.items);
    context.attributeOffense = this.constructor._prepareAttributeOffenseContext(items, context.items);
    context.pointSummary = this.constructor._preparePointSummary(system, items);
    context.creation = this.constructor._prepareCreationContext(system, context.pointSummary, items);
    context.attributeEffects = buildCoreAttributeEffectContext({
      system: this.actor._source?.system ?? system,
      items
    });
    context.combatEffects = this.constructor._prepareCombatEffectContext(system);
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
      { label: "Engagement Bonus Points", name: "system.identity.engagementBonusPoints", value: system.identity.engagementBonusPoints, type: "number" },
      { label: "Other Non-Levelling Points", name: "system.identity.otherNonLevellingPoints", value: system.identity.otherNonLevellingPoints, type: "number" },
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
    ];

    return context;
  }

  static _prepareItemContext(item) {
    const system = item.system ?? {};
    const isWeaponAttribute = isWeaponAttributeItem(item);
    const hasAttackModifier = Number.isFinite(Number(system.attackModifier));
    const damageFormula = weaponAttributeDamageFormula(item);
    const tags = [
      system.rank !== undefined ? `Rank ${system.rank}` : null,
      system.cost !== undefined ? `Cost ${system.cost}` : null,
      system.pointsReturned !== undefined ? `Points ${system.pointsReturned}` : null,
      system.quantity !== undefined ? `Qty ${system.quantity}` : null,
      system.equipped ? "Equipped" : null,
      system.category,
      system.damage,
      system.damageType,
      system.armourClass !== undefined ? `AC ${system.armourClass}` : null,
      system.speed
    ].filter(Boolean);

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
      canUse: true,
      canRoll: hasText(system.roll),
      canSkillCheck: ["skill", "proficiency", "tool"].includes(item.type),
      canAttack: item.type === "weapon" || isWeaponAttribute || (item.type !== "attribute" && hasAttackModifier),
      canDamage: hasText(damageFormula)
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
    const armourClass = (selectedArmour?.armourClass ?? manualArmourClass) + shieldBonus;
    const armourDetails = [
      selectedArmour ? `${selectedArmour.item.name} ${selectedArmour.armourClass}` : `Manual AC ${manualArmourClass}`,
      ...equippedShields.map((item) => {
        const modifier = item.system?.armourClassModifier ?? item.system?.armourClass;
        return `${item.name} +${numberOrZero(modifier)}`;
      })
    ];

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

  static _formatAbilityEffectText(ability) {
    const effectBonus = numberOrZero(ability?.effectBonus);
    if (!effectBonus) return "";
    return `${formatSigned(effectBonus)} effective ${numberOrZero(ability?.effectiveValue)}`;
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
      classApplied: creation.classApplied ?? "",
      recommendedDiscretionaryPoints: calculateRecommendedDiscretionaryPoints(startingLevel),
      recommendedExperience,
      hasRecommendedExperience: recommendedExperience !== null,
      levelProgress,
      classLevel,
      classBenefits: pointSummary.classBenefits,
      benchmark: pointSummary.benchmark,
      benchmarkSummary: pointSummary.benchmarkSummary,
      validationStatus,
      validationLabel: validationStatus.replace(/^./, (character) => character.toUpperCase()),
      validationNotes
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
    element.querySelectorAll("[data-action='roll-saving-throw']").forEach((button) => {
      button.addEventListener("click", this._onRollSavingThrow.bind(this));
    });
    element.querySelectorAll("[data-action='roll-attack']").forEach((button) => {
      button.addEventListener("click", this._onRollAttack.bind(this));
    });
    element.querySelectorAll("[data-action='roll-damage']").forEach((button) => {
      button.addEventListener("click", this._onRollDamage.bind(this));
    });
    element.querySelectorAll("[data-action='apply-damage'], [data-action='apply-healing']").forEach((button) => {
      button.addEventListener("click", this._onApplyHitPointChange.bind(this));
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
    element.querySelectorAll("[data-action='roll-item-attack']").forEach((button) => {
      button.addEventListener("click", this._onRollItemAttack.bind(this));
    });
    element.querySelectorAll("[data-action='roll-item-damage']").forEach((button) => {
      button.addEventListener("click", this._onRollItemDamage.bind(this));
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
    element.querySelectorAll("[data-action='apply-creation-start']").forEach((button) => {
      button.addEventListener("click", this._onApplyCreationStart.bind(this));
    });
    element.querySelectorAll("[data-action='apply-point-budget']").forEach((button) => {
      button.addEventListener("click", this._onApplyPointBudget.bind(this));
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
    const formula = buildD20Formula([initiative]);
    const combatant = this._getActiveCombatant();
    if (!combatant) {
      await this._rollFormula(formula, "Initiative");
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
          mode: "normal"
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
    await this._rollFormula(buildD20Formula(modifiers, { mode: rollMode }), `${mode.label}: ${abilityLabel}${dcLabel}`, { mode: rollMode });
  }

  async _onRollSavingThrow(event) {
    event.preventDefault();
    const abilityKey = event.currentTarget.dataset.ability;
    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) return;

    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    await this._rollFormula(buildD20Formula([ability.modifier]), `${abilityLabel} Saving Throw`);
  }

  async _onRollAttack(event) {
    event.preventDefault();
    const attackKey = event.currentTarget.dataset.attack;
    const attack = this.actor.system.combat?.attacks?.[attackKey];
    if (!attack) return;

    const modifier = Number(attack.modifier) || 0;
    await this._rollFormula(buildD20Formula([modifier]), `${attack.weapon || "Attack"} Roll`);
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

    await this._rollFormula(formula, `${attack.weapon || "Attack"} Damage`);
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

    const modifiers = [ability.modifier, this.actor.system.combat?.proficiencyBonus ?? 0];
    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    await this._rollFormula(buildD20Formula(modifiers), `${item.name} Check (${abilityLabel})`);
  }

  async _onRollItemAttack(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item) return;

    const modifier = Number(item.system?.attackModifier) || 0;
    await this._rollFormula(buildD20Formula([modifier]), `${item.name} Attack`);
  }

  async _onRollItemDamage(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    const formula = item ? weaponAttributeDamageFormula(item) : "";
    if (!formula) {
      ui.notifications?.warn("Enter a damage formula before rolling this item.");
      return;
    }

    const damageType = item.system?.damageType ? ` (${item.system.damageType})` : "";
    await this._rollFormula(formula, `${item.name} Damage${damageType}`);
  }

  static _normalizeAbilityKey(value) {
    const normalized = String(value ?? "").trim().toLowerCase();
    if (!normalized) return null;
    if (ABILITY_LABELS[normalized]) return normalized;

    return Object.entries(ABILITY_LABELS).find(([, label]) => label.toLowerCase() === normalized)?.[0] ?? null;
  }

  async _rollFormula(formula, label, options = {}) {
    try {
      return rollAnime5eFormula({ actor: this.actor, formula, label, mode: options.mode });
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
    const change = await applyHitPointChange(this.actor, amount, mode);
    const label = mode === "healing" ? "heals" : "takes";
    const typedAmount = mode === "damage" && damageType ? `${change.amount} ${escapeHtml(damageType)}` : change.amount;
    const noun = mode === "healing" ? "HP" : "damage";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> ${label} ${typedAmount} ${noun}. HP ${change.current} &rarr; ${change.next} / ${change.max}.</p>`
    });
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

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<article class="anime5e chat-card"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(localizedType("Item", item.type))}</strong></p>${description}${sourceLine}</article>`
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
