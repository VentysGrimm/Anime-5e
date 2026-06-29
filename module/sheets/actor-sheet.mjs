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

function signedModifier(value) {
  const modifier = Number(value) || 0;
  return modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}

function buildD20Formula(...modifiers) {
  return ["1d20", ...modifiers.map((modifier) => signedModifier(modifier))].join(" ");
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
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
      submitOnChange: false,
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
    context.equipment = this.constructor._prepareEquipmentContext(system, items, context.items);
    context.pointSummary = this.constructor._preparePointSummary(system, items);
    context.activeTab = this.tabGroups?.primary ?? "overview";
    context.activeTabs = Object.fromEntries(FOLIO_TABS.map((tab) => [tab.id, tab.id === context.activeTab]));
    context.tabs = FOLIO_TABS.map((tab) => ({ ...tab, active: tab.id === context.activeTab }));
    context.abilities = Object.entries(ABILITY_LABELS).map(([key, label]) => ({
      key,
      label,
      data: system.abilities[key]
    }));
    context.rollModes = Object.entries(ROLL_MODES).map(([key, mode]) => ({ key, label: mode.label }));
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
      description: system.description,
      equipped: !!system.equipped,
      equippable: EQUIPPABLE_ITEM_TYPES.has(item.type),
      canUse: true,
      canRoll: hasText(system.roll),
      canAttack: item.type === "weapon" || Number.isFinite(Number(system.attackModifier)),
      canDamage: hasText(system.damage)
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

  static _preparePointSummary(system, items = []) {
    const points = system.points ?? {};
    const ownedPointTotals = this._prepareOwnedPointTotals(items);
    const available = numberOrZero(points.available) + ownedPointTotals.defectRefund;
    const totalSpent = numberOrZero(points.totalSpent) + ownedPointTotals.attributeCost;
    const remaining = available - totalSpent;

    return {
      available,
      spent: numberOrZero(points.spent),
      refunded: numberOrZero(points.refunded),
      abilityScoreCost: numberOrZero(points.abilityScoreCost),
      attributeCost: ownedPointTotals.attributeCost,
      defectRefund: ownedPointTotals.defectRefund,
      totalRefunded: numberOrZero(points.refunded) + ownedPointTotals.defectRefund,
      totalSpent,
      remaining,
      warning: remaining < 0 ? "Point spending exceeds available points." : ""
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
      }

      return totals;
    }, { attributeCost: 0, defectRefund: 0 });
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

    this._activateAutoSaveListeners(element);

    element.querySelectorAll("[data-action='roll-ability']").forEach((button) => {
      button.addEventListener("click", this._onRollAbility.bind(this));
    });
    element.querySelectorAll("[data-action='roll-initiative']").forEach((button) => {
      button.addEventListener("click", this._onRollInitiative.bind(this));
    });
    element.querySelectorAll("[data-action='roll-quick']").forEach((button) => {
      button.addEventListener("click", this._onRollQuick.bind(this));
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
    element.querySelectorAll("[data-action='use-item']").forEach((button) => {
      button.addEventListener("click", this._onUseItem.bind(this));
    });
    element.querySelectorAll("[data-action='roll-item']").forEach((button) => {
      button.addEventListener("click", this._onRollItem.bind(this));
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
    element.querySelectorAll("[data-item-id]").forEach((row) => {
      row.draggable = true;
      row.addEventListener("dragstart", this._onDragStart.bind(this));
    });
    element.querySelectorAll("[data-drop-target='items']").forEach((target) => {
      target.addEventListener("dragover", (event) => event.preventDefault());
      target.addEventListener("drop", this._onDrop.bind(this));
    });
  }

  _activateAutoSaveListeners(element) {
    const form = element.querySelector("form");
    if (!form || !this.isEditable) return;

    const debouncedSave = foundry.utils.debounce(() => this._saveSheetForm(), 300);
    const saveNow = () => this._saveSheetForm();

    form.querySelectorAll("input[name], textarea[name]").forEach((input) => {
      input.addEventListener("input", debouncedSave);
      input.addEventListener("change", saveNow);
    });

    form.querySelectorAll("select[name]").forEach((select) => {
      select.addEventListener("change", saveNow);
    });
  }

  async _saveSheetForm() {
    if (this._savingSheetForm) return;

    this._savingSheetForm = true;
    try {
      await this.submit();
    } catch (error) {
      console.error("anime5e | Failed to auto-save actor sheet", error);
      ui.notifications?.error("Anime 5e could not auto-save the actor sheet. Check the console for details.");
    } finally {
      this._savingSheetForm = false;
    }
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
    await this._rollFormula(buildD20Formula(ability.modifier), label);
  }

  async _onRollInitiative(event) {
    event.preventDefault();
    const initiative = this.actor.system.combat?.initiative ?? 0;
    await this._rollFormula(buildD20Formula(initiative), "Initiative");
  }

  async _onRollQuick(event) {
    event.preventDefault();
    const panel = event.currentTarget.closest(".quick-roll-panel");
    const abilityKey = panel?.querySelector("[data-roll-input='ability']")?.value ?? "strength";
    const modeKey = panel?.querySelector("[data-roll-input='mode']")?.value ?? "ability";
    const situationalBonus = Number(panel?.querySelector("[data-roll-input='bonus']")?.value) || 0;
    const ability = this.actor.system.abilities?.[abilityKey];
    const mode = ROLL_MODES[modeKey] ?? ROLL_MODES.ability;
    if (!ability) return;

    const modifiers = [ability.modifier];
    if (mode.includeProficiency) modifiers.push(this.actor.system.combat?.proficiencyBonus ?? 0);
    if (situationalBonus) modifiers.push(situationalBonus);

    const abilityLabel = ABILITY_LABELS[abilityKey] ?? abilityKey;
    // Anime 5E Core Rules pp. 153-156 define checks, saving throws, initiative, and attacks as d20 plus the relevant modifiers.
    await this._rollFormula(buildD20Formula(...modifiers), `${mode.label}: ${abilityLabel}`);
  }

  async _onRollAttack(event) {
    event.preventDefault();
    const attackKey = event.currentTarget.dataset.attack;
    const attack = this.actor.system.combat?.attacks?.[attackKey];
    if (!attack) return;

    const modifier = Number(attack.modifier) || 0;
    await this._rollFormula(buildD20Formula(modifier), `${attack.weapon || "Attack"} Roll`);
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

  async _onRollItemAttack(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    if (!item) return;

    const modifier = Number(item.system?.attackModifier) || 0;
    await this._rollFormula(buildD20Formula(modifier), `${item.name} Attack`);
  }

  async _onRollItemDamage(event) {
    event.preventDefault();
    const item = this._getEmbeddedItem(event);
    const formula = item?.system?.damage?.trim();
    if (!formula) {
      ui.notifications?.warn("Enter a damage formula before rolling this item.");
      return;
    }

    const damageType = item.system?.damageType ? ` (${item.system.damageType})` : "";
    await this._rollFormula(formula, `${item.name} Damage${damageType}`);
  }

  async _rollFormula(formula, label) {
    try {
      const roll = new Roll(formula);
      await roll.evaluate();
      return roll.toMessage({
        speaker: ChatMessage.getSpeaker({ actor: this.actor }),
        flavor: `${this.actor.name}: ${label}`
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
    const hitPoints = this.actor.system.combat.hitPoints;
    const current = Number(hitPoints.value) || 0;
    const max = Math.max(0, Number(hitPoints.max) || 0);
    const minimum = -max;
    const next = mode === "healing"
      ? Math.min(max, current + amount)
      : Math.max(minimum, current - amount);
    const label = mode === "healing" ? "heals" : "takes";
    const typedAmount = mode === "damage" && damageType ? `${amount} ${escapeHtml(damageType)}` : amount;
    const noun = mode === "healing" ? "HP" : "damage";

    await this.actor.update({ "system.combat.hitPoints.value": next });

    return ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: `<p><strong>${escapeHtml(this.actor.name)}</strong> ${label} ${typedAmount} ${noun}. HP ${current} &rarr; ${next} / ${max}.</p>`
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
}
