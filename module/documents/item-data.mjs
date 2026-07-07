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

function speciesAbilityBonusField() {
  return new fields.SchemaField({
    ability: textField(),
    modifier: numberField(0),
    points: numberField(0),
    notes: textField()
  });
}

function speciesTraitField() {
  return new fields.SchemaField({
    name: textField(),
    rank: optionalNumberField(),
    points: numberField(0),
    detail: textField(),
    notes: textField()
  });
}

function speciesMovementField() {
  return new fields.SchemaField({
    mode: textField(),
    speed: textField(),
    notes: textField()
  });
}

function modifierCustomizationFields(pointModifierInitial) {
  return {
    appliesTo: textField(),
    category: textField(),
    pointModifier: numberField(pointModifierInitial),
    assignmentRange: textField(),
    allowedAttributes: textField(),
    rulesNotes: htmlField()
  };
}

function modifierReferenceField(pointModifierInitial) {
  return new fields.SchemaField({
    name: textField(),
    sourceId: textField(),
    uuid: textField(),
    appliesTo: textField(),
    category: textField(),
    allowedAttributes: textField(),
    pointModifier: numberField(pointModifierInitial),
    assignmentCount: numberField(1, { min: 0 }),
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
      sourceAbbreviation: textField(),
      sourceModuleId: textField(),
      sourceCategory: textField(),
      importId: textField()
    };
  }
}

export class Anime5eAttributeData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      effectiveRank: optionalNumberField(),
      costAdjustment: numberField(0),
      finalCostOverride: optionalNumberField(),
      overrideNotes: textField(),
      ability: textField(),
      category: textField(),
      effectActive: booleanField(true),
      energyPaid: booleanField(false),
      durationRemaining: textField(),
      effectTargets: textField(),
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
      activeTrainingTechnique: textField(),
      trainingBenefit: textField(),
      trainingTechniques: textField(),
      spellName: textField(),
      spellLevel: textField(),
      spellEffect: textField(),
      spellEnergyCost: textField(),
      spellPrerequisites: textField(),
      spellUsage: textField(),
      movementModes: textField(),
      weaponNotes: textField(),
      trackingNotes: textField(),
      progression: textField(),
      enhancementReferences: arrayField(modifierReferenceField(1)),
      limiterReferences: arrayField(modifierReferenceField(-1))
    };
  }
}

export class Anime5eDefectData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ability: textField(),
      effectActive: booleanField(true),
      pointsReturned: numberField(0, { min: 0 })
    };
  }
}

export class Anime5eAdventuringRiskData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      category: textField("Hazard"),
      status: textField("Active"),
      dc: optionalNumberField(),
      save: textField(),
      interval: textField(),
      onset: textField(),
      duration: textField(),
      damage: textField(),
      effect: textField(),
      riskNotes: htmlField()
    };
  }
}

export class Anime5eCraftingProjectData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      targetItem: textField(),
      status: textField("Planning"),
      materialCost: textField(),
      progress: numberField(0, { min: 0 }),
      requiredProgress: numberField(0, { min: 0 }),
      dc: optionalNumberField(),
      linkedItemUuid: textField(),
      materials: htmlField(),
      projectNotes: htmlField()
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
      embeddedAttributePoints: numberField(0, { min: 0 }),
      embeddedDefectPoints: numberField(0, { min: 0 }),
      attunement: textField(),
      attributeSummary: textField(),
      containedAttributes: htmlField(),
      containedDefects: htmlField()
    };
  }
}

export class Anime5eSpeciesData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      points: numberField(0, { min: 0 }),
      speciesSize: textField(),
      abilityBonuses: arrayField(speciesAbilityBonusField()),
      attributes: arrayField(speciesTraitField()),
      defects: arrayField(speciesTraitField()),
      languages: arrayField(textField()),
      movement: arrayField(speciesMovementField()),
      traitNotes: htmlField()
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
      category: textField(),
      ability: textField(),
      checkBonus: numberField(0),
      dc: optionalNumberField(),
      energyCost: textField(),
      roll: textField(),
      effect: htmlField(),
      repeatedEffects: htmlField(),
      activationLimits: htmlField(),
      trackingNotes: htmlField()
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
      points: numberField(0),
      sizeCategory: textField(),
      costModifier: numberField(0),
      armourClassModifier: numberField(0),
      attackModifier: numberField(0),
      damageModifier: textField(),
      strengthModifier: textField(),
      strengthCheckModifier: textField(),
      movementModifier: textField(),
      rangeSpeedModifier: textField(),
      liftCarryModifier: textField(),
      receivedDamageModifier: textField(),
      typicalHeight: textField(),
      typicalWeight: textField(),
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
      school: textField(),
      castTime: textField(),
      range: textField(),
      components: textField(),
      duration: textField(),
      saveDC: optionalNumberField(),
      attackBonus: optionalNumberField(),
      spellcastingAbility: textField(),
      energyCost: textField(),
      roll: textField(),
      damage: textField(),
      damageType: textField(),
      effect: htmlField(),
      psionicsNotes: htmlField()
    };
  }
}

export class Anime5eEnhancementData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ...modifierCustomizationFields(1)
    };
  }
}

export class Anime5eLimiterData extends Anime5eBaseItemData {
  static defineSchema() {
    return {
      ...super.defineSchema(),
      ...modifierCustomizationFields(-1)
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
      owner: textField(),
      rider: textField(),
      linkedActorUuid: textField(),
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
      owner: textField(),
      pilot: textField(),
      occupants: textField(),
      linkedActorUuid: textField(),
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
      proficiencyRequirement: textField(),
      range: textField(),
      rangeRank: numberField(0, { min: 0 }),
      ammo: textField(),
      charges: numberField(0, { min: 0 }),
      maxCharges: numberField(0, { min: 0 }),
      value: textField(),
      weight: textField(),
      sourceTable: textField(),
      effectiveRank: optionalNumberField(),
      costAdjustment: numberField(0),
      finalCostOverride: optionalNumberField(),
      overrideNotes: textField(),
      enhancementReferences: arrayField(modifierReferenceField(1)),
      limiterReferences: arrayField(modifierReferenceField(-1)),
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
      proficiencyRequirement: textField(),
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
      owner: textField(),
      linkedActorUuid: textField(),
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
