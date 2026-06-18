const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

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
      submitOnChange: false
    }
  };

  static PARTS = {
    form: {
      template: "systems/anime5e/templates/actor-sheet.hbs"
    }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const system = this.actor.system;

    context.actor = this.actor;
    context.system = system;
    context.items = this.actor.items?.contents ?? [];
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
      { label: "Starting Discretionary Points", name: "system.identity.startingDiscretionaryPoints", value: system.identity.startingDiscretionaryPoints, type: "number" },
      { label: "Engagement Bonus Points", name: "system.identity.engagementBonusPoints", value: system.identity.engagementBonusPoints, type: "number" },
      { label: "Other Non-Levelling Points", name: "system.identity.otherNonLevellingPoints", value: system.identity.otherNonLevellingPoints, type: "number" },
      { label: "Size Template", name: "system.identity.sizeTemplate", value: system.identity.sizeTemplate },
      { label: "Race", name: "system.identity.race", value: system.identity.race },
      { label: "Alignment", name: "system.identity.alignment", value: system.identity.alignment },
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

  static async _onSubmit(event, form, formData) {
    await this.document.update(formData.object);
  }
}
