const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const FOLIO_TABS = [
  { id: "overview", label: "Overview" },
  { id: "combat", label: "Combat" },
  { id: "attributes", label: "Attributes" },
  { id: "defects", label: "Defects" },
  { id: "skills", label: "Skills & Proficiencies" },
  { id: "powers", label: "Powers & Spells" },
  { id: "inventory", label: "Inventory" },
  { id: "companions", label: "Companions & Vehicles" },
  { id: "biography", label: "Biography" },
  { id: "journal", label: "Journal" }
];

const ITEM_GROUP_TYPES = {
  combat: ["weapon", "armor", "shield", "technique", "attribute"],
  attributes: ["attribute", "enhancement", "limiter", "itemAttribute"],
  defects: ["defect"],
  skills: ["skill", "proficiency", "tool", "language", "trait", "background", "feature"],
  powers: ["power", "spell", "technique"],
  inventory: ["equipment", "loot", "weapon", "armor", "shield", "material", "itemAttribute"],
  companions: ["vehicle", "mecha"]
};

const REQUIRED_NUMBER_DEFAULTS = {
  "system.level": 1,
  "system.experience": 0,
  "system.identity.startingDiscretionaryPoints": 0,
  "system.identity.engagementBonusPoints": 0,
  "system.identity.otherNonLevellingPoints": 0,
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

function signedModifier(value) {
  const modifier = Number(value) || 0;
  return modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
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
      handler: this._onSubmit,
      submitOnChange: true,
      submitOnClose: true
    },
    tabs: [
      {
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "overview"
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
    context.activeTab = this.tabGroups?.primary ?? "overview";
    context.activeTabs = Object.fromEntries(FOLIO_TABS.map((tab) => [tab.id, tab.id === context.activeTab]));
    context.tabs = FOLIO_TABS.map((tab) => ({ ...tab, active: tab.id === context.activeTab }));
    context.abilities = [
      { key: "strength", label: "Strength", data: system.abilities.strength },
      { key: "dexterity", label: "Dexterity", data: system.abilities.dexterity },
      { key: "constitution", label: "Constitution", data: system.abilities.constitution },
      { key: "intelligence", label: "Intelligence", data: system.abilities.intelligence },
      { key: "wisdom", label: "Wisdom", data: system.abilities.wisdom },
      { key: "charisma", label: "Charisma", data: system.abilities.charisma }
    ];
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
      description: system.description
    };
  }

  static _prepareItemGroups(items) {
    return Object.entries(ITEM_GROUP_TYPES).reduce((groups, [group, types]) => {
      groups[group] = items.filter((item) => types.includes(item.type));
      return groups;
    }, { all: items });
  }

  async _onRender(context, options) {
    if (typeof super._onRender === "function") await super._onRender(context, options);

    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    if (!element) return;

    element.querySelectorAll("[data-action='roll-ability']").forEach((button) => {
      button.addEventListener("click", this._onRollAbility.bind(this));
    });
    element.querySelectorAll("[data-action='roll-initiative']").forEach((button) => {
      button.addEventListener("click", this._onRollInitiative.bind(this));
    });
    element.querySelectorAll("[data-action='roll-attack']").forEach((button) => {
      button.addEventListener("click", this._onRollAttack.bind(this));
    });
    element.querySelectorAll("[data-action='edit-item']").forEach((button) => {
      button.addEventListener("click", this._onEditItem.bind(this));
    });
    element.querySelectorAll("[data-action='delete-item']").forEach((button) => {
      button.addEventListener("click", this._onDeleteItem.bind(this));
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

  async _onRollAbility(event) {
    event.preventDefault();
    const abilityKey = event.currentTarget.dataset.ability;
    const ability = this.actor.system.abilities?.[abilityKey];
    if (!ability) return;

    const label = event.currentTarget.dataset.label ?? `${abilityKey} Check`;
    await this._rollFormula(`1d20 ${signedModifier(ability.modifier)}`, label);
  }

  async _onRollInitiative(event) {
    event.preventDefault();
    const initiative = this.actor.system.combat?.initiative ?? 0;
    await this._rollFormula(`1d20 ${signedModifier(initiative)}`, "Initiative");
  }

  async _onRollAttack(event) {
    event.preventDefault();
    const attackKey = event.currentTarget.dataset.attack;
    const attack = this.actor.system.combat?.attacks?.[attackKey];
    if (!attack) return;

    const modifier = Number(attack.modifier) || 0;
    await this._rollFormula(`1d20 ${signedModifier(modifier)}`, `${attack.weapon || "Attack"} Roll`);
  }

  async _rollFormula(formula, label) {
    const roll = new Roll(formula);
    await roll.evaluate();
    return roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      flavor: `${this.actor.name}: ${label}`
    });
  }

  _onEditItem(event) {
    event.preventDefault();
    const item = this.actor.items.get(event.currentTarget.closest("[data-item-id]")?.dataset.itemId);
    item?.sheet?.render(true);
  }

  async _onDeleteItem(event) {
    event.preventDefault();
    const item = this.actor.items.get(event.currentTarget.closest("[data-item-id]")?.dataset.itemId);
    await item?.delete();
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

  static async _onSubmit(event, form, formData) {
    const document = this.actor ?? this.document;
    const updateData = normalizeRequiredNumbers(foundry.utils.expandObject(formData.object));

    try {
      await document.update(updateData);
    } catch (error) {
      console.error("anime5e | Failed to save actor sheet", error);
      ui.notifications?.error("Anime 5e could not save the actor sheet. Check the console for details.");
      return false;
    }

    return true;
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
}
