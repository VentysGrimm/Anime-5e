import { buildD20Formula, rollAnime5eFormula } from "../rules/rolls.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const BASE_FIELDS = new Set(["description", "rank", "cost", "source", "sourceId", "sourcePage", "importId"]);
const MULTILINE_FIELDS = new Set(["constructionNotes", "movementModes", "progressionNotes", "result", "statBlock"]);
const CONSTRUCTION_ITEM_TYPES = new Set(["equipment", "itemAttribute", "itemOfPower", "loot", "material", "mecha", "mount", "vehicle"]);
const NUMBER_FIELDS = new Set([
  "armourClass",
  "armourClassModifier",
  "attackModifier",
  "basePoints",
  "bonusPoints",
  "costModifier",
  "finalClassPoints",
  "levellingPoints",
  "level",
  "pointImpact",
  "points",
  "pointsPerLevel",
  "quantity",
  "rank",
  "sourcePage",
  "totalPoints"
]);

const FIELD_LABELS = {
  appliesTo: "Applies To",
  ability: "Ability Target",
  armour: "Armour",
  armourClass: "Armour Class",
  armourClassModifier: "Armour Class Modifier",
  attackModifier: "Attack Modifier",
  attributeSummary: "Attribute Summary",
  attunement: "Attunement",
  basePoints: "Base Points",
  baseCreature: "Base Creature",
  carryingCapacity: "Carrying Capacity",
  challengeRating: "Challenge Rating",
  communities: "Communities",
  costModifier: "Cost Modifier",
  constructionNotes: "Construction Notes",
  constructionStatus: "Construction Status",
  creatureType: "Creature Type",
  currency: "Currency",
  damageModifier: "Damage Modifier",
  dexterityRule: "Dexterity Rule",
  equipped: "Equipped",
  effectiveRank: "Effective Rank",
  enhancements: "Enhancements",
  freeHands: "Free Hands",
  habitat: "Habitat",
  hitDice: "Hit Dice",
  hitPoints: "Hit Points",
  itemCategory: "Item Category",
  limiters: "Limiters",
  linkedDocumentType: "Linked Document Type",
  linkedSourceId: "Linked Source ID",
  material: "Material",
  movementModes: "Movement Modes",
  movementModifier: "Movement Modifier",
  parentAttribute: "Parent Attribute",
  pointImpact: "Point Impact",
  pointsPerLevel: "Points Per Level",
  primaryAbility: "Primary Ability",
  progressionNotes: "Progression Notes",
  proficiencyGroup: "Proficiency Group",
  range: "Range",
  savingThrows: "Saving Throws",
  shieldSize: "Shield Size",
  sizeAndType: "Size and Type",
  sizeCategory: "Size Category",
  sourceTable: "Source Table",
  statBlock: "Stat Block",
  stealth: "Stealth",
  strengthRequirement: "Strength Requirement",
  strengthModifier: "Strength Modifier",
  totalPoints: "Total Points",
  value: "Value",
  weight: "Weight",
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

function buildDetailFields(systemData) {
  return Object.entries(systemData)
    .filter(([fieldName]) => !BASE_FIELDS.has(fieldName))
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

function buildItemActions(item, systemData) {
  return {
    canUse: true,
    canRoll: hasText(systemData.roll),
    canAttack: item.type === "weapon" || Number.isFinite(Number(systemData.attackModifier)),
    canDamage: hasText(systemData.damage)
  };
}

function buildConstructionPlaceholder(item) {
  if (!CONSTRUCTION_ITEM_TYPES.has(item.type)) return null;

  return {
    message: "Point-built item construction is not fully automated yet. Track rank, points, Attribute Summary, value, weight, attunement, and construction notes here."
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
    context.detailFields = buildDetailFields(systemData);
    context.itemActions = buildItemActions(this.item, systemData);
    context.constructionPlaceholder = buildConstructionPlaceholder(this.item);
    context.classProgression = buildClassProgression(this.item, systemData);
    return context;
  }

  async _onRender(context, options) {
    if (typeof super._onRender === "function") await super._onRender(context, options);

    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    if (!element) return;

    element.querySelector("[data-action='use-item']")?.addEventListener("click", this._onUseItem.bind(this));
    element.querySelector("[data-action='roll-item']")?.addEventListener("click", this._onRollItem.bind(this));
    element.querySelector("[data-action='roll-item-attack']")?.addEventListener("click", this._onRollAttack.bind(this));
    element.querySelector("[data-action='roll-item-damage']")?.addEventListener("click", this._onRollDamage.bind(this));
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

  async _onRollAttack(event) {
    event.preventDefault();
    const modifier = Number(this.item.system?.attackModifier) || 0;
    await this._rollFormula(buildD20Formula([modifier]), `${this.item.name} Attack`);
  }

  async _onRollDamage(event) {
    event.preventDefault();
    const formula = this.item.system?.damage?.trim();
    if (!formula) {
      ui.notifications?.warn("Enter a damage formula before rolling this item.");
      return;
    }

    const damageType = this.item.system?.damageType ? ` (${this.item.system.damageType})` : "";
    await this._rollFormula(formula, `${this.item.name} Damage${damageType}`);
  }

  async _rollFormula(formula, label) {
    try {
      return rollAnime5eFormula({ actor: getItemActor(this.item), formula, label });
    } catch (error) {
      console.error("anime5e | Failed to roll item formula", formula, error);
      ui.notifications?.error(`Anime 5e could not roll "${formula}". Check the formula and try again.`);
      return null;
    }
  }

  async _postItemUse(item) {
    const system = item.system ?? {};
    const source = [system.source, system.sourcePage ? `p. ${system.sourcePage}` : null].filter(Boolean).join(", ");
    const description = hasText(system.description) ? `<p>${escapeHtml(system.description)}</p>` : "";
    const sourceLine = source ? `<p><small>${escapeHtml(source)}</small></p>` : "";

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: getItemActor(item) }),
      content: `<article class="anime5e chat-card"><h3>${escapeHtml(item.name)}</h3><p><strong>${escapeHtml(item.type)}</strong></p>${description}${sourceLine}</article>`
    });
  }
}
