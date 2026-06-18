const fields = foundry.data.fields;

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

function textField(initial = "") {
  return new fields.StringField({
    required: true,
    blank: true,
    initial
  });
}

class Anime5eBaseItemData extends foundry.abstract.TypeDataModel {
  static LOCALIZATION_PREFIXES = ["ANIME5E.Item"];

  static defineSchema() {
    return {
      description: new fields.HTMLField({ required: false, blank: true, initial: "" }),
      rank: numberField(1, { min: 0 }),
      cost: numberField(0, { min: 0 }),
      source: textField(),
      sourceId: textField(),
      sourcePage: optionalNumberField(),
      importId: textField()
    };
  }
}

export class Anime5eAttributeData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField(),
      progression: textField()
    };
  }
}

export class Anime5eDefectData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      pointsReturned: numberField(0, { min: 0 })
    };
  }
}

export class Anime5eEquipmentData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: new fields.BooleanField({ required: true, initial: false })
    };
  }
}

export class Anime5eFeatureData extends Anime5eBaseItemData {}

export class Anime5eSpeciesData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      points: numberField(0, { min: 0 })
    };
  }
}

export class Anime5eClassData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      hitDice: textField(),
      primaryAbility: textField(),
      savingThrows: textField()
    };
  }
}

export class Anime5eBackgroundData extends Anime5eBaseItemData {}

export class Anime5ePowerData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField()
    };
  }
}

export class Anime5eTechniqueData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField()
    };
  }
}

export class Anime5eSpellData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      level: numberField(0, { min: 0 }),
      school: textField()
    };
  }
}

export class Anime5eWeaponData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      damage: textField(),
      damageType: textField(),
      properties: textField()
    };
  }
}

export class Anime5eArmorData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      armourClass: numberField(10, { min: 0 }),
      properties: textField()
    };
  }
}

export class Anime5eTraitData extends Anime5eBaseItemData {}
