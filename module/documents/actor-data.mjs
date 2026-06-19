const fields = foundry.data.fields;

function textField(initial = "") {
  return new fields.StringField({
    required: true,
    blank: true,
    initial
  });
}

function numberField(initial = 0, options = {}) {
  return new fields.NumberField({
    required: true,
    nullable: false,
    integer: true,
    initial,
    ...options
  });
}

function optionalNumberField(initial = null, options = {}) {
  return new fields.NumberField({
    required: false,
    nullable: true,
    integer: true,
    initial,
    ...options
  });
}

function abilityField(initial = 10) {
  return new fields.SchemaField({
    value: numberField(initial),
    modifier: numberField(0)
  });
}

function resourceField(initial = 10) {
  return new fields.SchemaField({
    value: numberField(initial, { min: 0 }),
    max: numberField(initial, { min: 0 })
  });
}

function classEntryField() {
  return new fields.SchemaField({
    name: textField(),
    level: numberField(0, { min: 0 }),
    hitDice: textField()
  });
}

function attackEntryField() {
  return new fields.SchemaField({
    weapon: textField(),
    modifier: textField(),
    damageType: textField(),
    damage: textField()
  });
}

class Anime5eBaseActorData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["ANIME5E.Actor"];

  static defineSchema() {
    return {
      identity: new fields.SchemaField({
        alias: textField(),
        playerName: textField(),
        description: textField(),
        speciesAndSize: textField(),
        alignmentAndNotes: textField(),
        savingThrows: textField(),
        proficiencies: textField(),
        actorRole: textField(),
        challengeRating: textField(),
        totalPoints: optionalNumberField(),
        startingDiscretionaryPoints: numberField(0, { min: 0 }),
        engagementBonusPoints: numberField(0, { min: 0 }),
        otherNonLevellingPoints: numberField(0, { min: 0 }),
        sizeTemplate: textField(),
        race: textField(),
        alignment: textField(),
        ageAndGender: textField(),
        heightAndWeight: textField(),
        homelandHabitat: textField(),
        campaignTitle: textField(),
        gameMaster: textField(),
        creationDate: textField(),
        retirementDate: textField()
      }),
      biography: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      statBlock: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      notes: new fields.SchemaField({
        overview: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        combat: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        attributes: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        defects: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        skills: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        powers: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        inventory: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        companions: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        biography: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        journal: new fields.HTMLField({ required: false, blank: true, initial: "" })
      }),
      source: new fields.SchemaField({
        book: textField(),
        page: optionalNumberField(),
        sourceId: textField(),
        importId: textField()
      }),
      level: numberField(1, { min: 1 }),
      experience: numberField(0, { min: 0 }),
      abilities: new fields.SchemaField({
        strength: abilityField(),
        dexterity: abilityField(),
        constitution: abilityField(),
        intelligence: abilityField(),
        wisdom: abilityField(),
        charisma: abilityField()
      }),
      combat: new fields.SchemaField({
        hitPoints: resourceField(20),
        energy: resourceField(10),
        armourClass: numberField(10),
        movementSpeed: numberField(30, { min: 0 }),
        proficiencyBonus: numberField(2),
        initiative: numberField(0),
        attacks: new fields.SchemaField({
          primary: attackEntryField(),
          secondary: attackEntryField(),
          tertiary: attackEntryField()
        })
      }),
      progression: new fields.SchemaField({
        classes: new fields.SchemaField({
          primary: classEntryField(),
          secondary: classEntryField(),
          tertiary: classEntryField()
        })
      })
    };
  }

  prepareDerivedData() {
    for (const ability of Object.values(this.abilities)) {
      ability.modifier = Math.floor((Number(ability.value) - 10) / 2);
    }

    for (const resource of [this.combat.hitPoints, this.combat.energy]) {
      resource.value = Math.max(0, Math.min(Number(resource.value), Number(resource.max)));
    }
  }
}

export class Anime5eCharacterData extends Anime5eBaseActorData {}

export class Anime5eNpcData extends Anime5eBaseActorData {}

export class Anime5eMonsterData extends Anime5eBaseActorData {}

export class Anime5eCompanionData extends Anime5eBaseActorData {}

export class Anime5eVehicleData extends Anime5eBaseActorData {}

export class Anime5eMechaData extends Anime5eBaseActorData {}
