const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;

const BASE_FIELDS = new Set(["description", "rank", "cost", "source", "sourceId", "sourcePage", "importId"]);
const MULTILINE_FIELDS = new Set(["result", "statBlock"]);
const NUMBER_FIELDS = new Set([
  "armourClass",
  "armourClassModifier",
  "attackModifier",
  "costModifier",
  "level",
  "pointImpact",
  "points",
  "quantity",
  "rank",
  "sourcePage",
  "totalPoints"
]);

const FIELD_LABELS = {
  appliesTo: "Applies To",
  armour: "Armour",
  armourClass: "Armour Class",
  armourClassModifier: "Armour Class Modifier",
  attackModifier: "Attack Modifier",
  attributeSummary: "Attribute Summary",
  attunement: "Attunement",
  baseCreature: "Base Creature",
  carryingCapacity: "Carrying Capacity",
  challengeRating: "Challenge Rating",
  communities: "Communities",
  costModifier: "Cost Modifier",
  creatureType: "Creature Type",
  damageModifier: "Damage Modifier",
  equipped: "Equipped",
  habitat: "Habitat",
  hitDice: "Hit Dice",
  hitPoints: "Hit Points",
  itemCategory: "Item Category",
  linkedDocumentType: "Linked Document Type",
  linkedSourceId: "Linked Source ID",
  movementModifier: "Movement Modifier",
  parentAttribute: "Parent Attribute",
  pointImpact: "Point Impact",
  primaryAbility: "Primary Ability",
  savingThrows: "Saving Throws",
  sizeAndType: "Size and Type",
  sizeCategory: "Size Category",
  statBlock: "Stat Block",
  strengthModifier: "Strength Modifier",
  totalPoints: "Total Points",
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

function signedModifier(value) {
  const modifier = Number(value) || 0;
  return modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}

function buildD20Formula(...modifiers) {
  return ["1d20", ...modifiers.map((modifier) => signedModifier(modifier))].join(" ");
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
      submitOnChange: false,
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
    await this._rollFormula(buildD20Formula(modifier), `${this.item.name} Attack`);
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
      const roll = new Roll(formula);
      await roll.evaluate();
      return roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: getItemActor(this.item) }),
        flavor: label
      });
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
