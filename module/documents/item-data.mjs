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

function booleanField(initial = false) {
  return new fields.BooleanField({
    required: true,
    initial
  });
}

function htmlField(initial = "") {
  return new fields.HTMLField({
    required: false,
    blank: true,
    initial
  });
}

function arrayField(element, initial = []) {
  return new fields.ArrayField(element, {
    required: true,
    nullable: false,
    initial
  });
}

function classBenefitField() {
  return new fields.SchemaField({
    type: textField(),
    label: textField(),
    rank: optionalNumberField(),
    points: numberField(0),
    notes: textField()
  });
}

function classProgressionEntryField() {
  return new fields.SchemaField({
    level: numberField(1, { min: 1, max: 20 }),
    proficiencyBonus: numberField(2, { min: 0 }),
    points: numberField(0),
    benefits: arrayField(classBenefitField()),
    proficiencies: textField(),
    notes: textField()
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
      ability: textField(),
      category: textField(),
      attackModifier: numberField(0),
      damage: textField(),
      damageType: textField(),
      range: textField(),
      scope: textField(),
      duration: textField(),
      targetCount: textField(),
      energyCost: textField(),
      trackingMode: textField(),
      linkedActorUuid: textField(),
      linkedItemUuid: textField(),
      linkedDocumentUuid: textField(),
      movementModes: textField(),
      weaponNotes: textField(),
      trackingNotes: textField(),
      progression: textField()
    };
  }
}

export class Anime5eDefectData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ability: textField(),
      pointsReturned: numberField(0, { min: 0 })
    };
  }
}

export class Anime5eEquipmentData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: booleanField(),
      quantity: numberField(1, { min: 0 }),
      value: textField(),
      weight: textField(),
      currency: textField("gp"),
      constructionStatus: textField("Manual bookkeeping"),
      constructionNotes: htmlField()
    };
  }
}

export class Anime5eFeatureData extends Anime5eBaseItemData {}

export class Anime5eItemOfPowerData extends Anime5eEquipmentData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      itemCategory: textField(),
      points: numberField(0, { min: 0 }),
      attunement: textField(),
      attributeSummary: textField()
    };
  }
}

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
      level: numberField(0, { min: 0 }),
      basePoints: numberField(0, { min: 0 }),
      pointsPerLevel: numberField(0, { min: 0 }),
      levellingPoints: numberField(0, { min: 0 }),
      bonusPoints: numberField(0, { min: 0 }),
      finalClassPoints: numberField(0, { min: 0 }),
      hitDice: textField(),
      primaryAbility: textField(),
      savingThrows: textField(),
      progression: arrayField(classProgressionEntryField()),
      progressionNotes: htmlField()
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

export class Anime5eSizeTemplateData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      sizeCategory: textField(),
      costModifier: numberField(0),
      armourClassModifier: numberField(0),
      attackModifier: numberField(0),
      damageModifier: textField(),
      strengthModifier: textField(),
      movementModifier: textField(),
      space: textField(),
      reach: textField()
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

export class Anime5eEnhancementData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      appliesTo: textField(),
      category: textField()
    };
  }
}

export class Anime5eLimiterData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      appliesTo: textField(),
      category: textField()
    };
  }
}

export class Anime5eProficiencyData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField(),
      ability: textField()
    };
  }
}

export class Anime5eSkillData extends Anime5eProficiencyData {}

export class Anime5eToolData extends Anime5eProficiencyData {}

export class Anime5eLanguageData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      script: textField()
    };
  }
}

export class Anime5eItemAttributeData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      parentAttribute: textField(),
      appliesTo: textField()
    };
  }
}

export class Anime5eMaterialData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      rating: textField(),
      durability: textField()
    };
  }
}

export class Anime5eLootData extends Anime5eEquipmentData {}

export class Anime5eMountData extends Anime5eEquipmentData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      creatureType: textField(),
      size: textField(),
      challengeRating: textField(),
      armourClass: numberField(10, { min: 0 }),
      hitPoints: textField(),
      speed: textField(),
      carryingCapacity: textField(),
      habitat: textField(),
      communities: textField(),
      statBlock: htmlField()
    };
  }
}

export class Anime5eVehicleData extends Anime5eEquipmentData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      armourClass: numberField(10, { min: 0 }),
      speed: textField(),
      crew: textField(),
      passengers: textField(),
      cargo: textField()
    };
  }
}

export class Anime5eMechaData extends Anime5eVehicleData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      size: textField(),
      pilot: textField(),
      points: numberField(0, { min: 0 })
    };
  }
}

export class Anime5eWeaponData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      equipped: booleanField(),
      category: textField(),
      proficiencyGroup: textField(),
      range: textField(),
      value: textField(),
      weight: textField(),
      sourceTable: textField(),
      effectiveRank: optionalNumberField(),
      enhancements: textField(),
      limiters: textField(),
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
      equipped: booleanField(),
      category: textField(),
      armourClass: numberField(10, { min: 0 }),
      dexterityRule: textField(),
      strengthRequirement: textField(),
      stealth: textField(),
      value: textField(),
      weight: textField(),
      sourceTable: textField(),
      properties: textField()
    };
  }
}

export class Anime5eTraitData extends Anime5eBaseItemData {}

export class Anime5eShieldData extends Anime5eArmorData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      shieldSize: textField(),
      material: textField(),
      armourClassModifier: numberField(0),
      freeHands: textField()
    };
  }
}

export class Anime5eMonsterVariantData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      baseCreature: textField(),
      sizeAndType: textField(),
      challengeRating: textField(),
      xp: textField(),
      totalPoints: optionalNumberField(),
      armour: textField(),
      armourClass: numberField(10, { min: 0 }),
      speed: textField(),
      habitat: textField(),
      communities: textField(),
      statBlock: htmlField()
    };
  }
}

export class Anime5eLifepathData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField(),
      table: textField(),
      roll: textField(),
      result: htmlField(),
      pointImpact: numberField(0),
      linkedDocumentType: textField(),
      linkedSourceId: textField()
    };
  }
}
