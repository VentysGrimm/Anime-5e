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
      handler: this._onSubmit,
      submitOnChange: false
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
    return context;
  }

  static async _onSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }
}
