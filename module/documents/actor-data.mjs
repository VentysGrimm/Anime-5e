import { applyPointSummaryToSystem } from "../rules/points.mjs";
import { ABILITY_KEYS, calculateCoreAttributeEffects } from "../rules/attribute-effects.mjs";

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

function numberOrFallback(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
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
    baseValue: numberField(initial),
    effectBonus: numberField(0),
    effectiveValue: numberField(initial),
    modifier: numberField(0)
  });
}

function resourceField(initial = 10, options = {}) {
  const valueOptions = options.allowNegative ? {} : { min: 0 };

  return new fields.SchemaField({
    value: numberField(initial, valueOptions),
    max: numberField(initial, { min: 0 }),
    baseMax: numberField(initial, { min: 0 }),
    effectBonus: numberField(0)
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
        experienceValue: optionalNumberField(),
        totalPoints: optionalNumberField(),
        communities: textField(),
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
      creation: new fields.SchemaField({
        startingLevel: numberField(1, { min: 1 }),
        startingExperience: numberField(0, { min: 0 }),
        abilityPointMode: textField("Score equals Point cost"),
        speciesApplied: textField(),
        sizeTemplateApplied: textField(),
        classApplied: textField(),
        validationStatus: textField("draft"),
        validationNotes: textField()
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
        goals: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        family: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        history: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        personality: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        group: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        advancement: new fields.HTMLField({ required: false, blank: true, initial: "" }),
        journal: new fields.HTMLField({ required: false, blank: true, initial: "" })
      }),
      points: new fields.SchemaField({
        spent: numberField(0, { min: 0 }),
        refunded: numberField(0, { min: 0 }),
        abilityScoreCost: numberField(0, { min: 0 }),
        speciesCost: numberField(0, { min: 0 }),
        classCost: numberField(0, { min: 0 }),
        classBonusPoints: numberField(0, { min: 0 }),
        attributeCost: numberField(0, { min: 0 }),
        defectRefund: numberField(0, { min: 0 }),
        equipmentCost: numberField(0, { min: 0 }),
        totalRefunded: numberField(0, { min: 0 }),
        totalSpent: numberField(0, { min: 0 }),
        available: numberField(0),
        remaining: numberField(0)
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
        hitPoints: resourceField(20, { allowNegative: true }),
        energy: resourceField(10),
        armourClass: numberField(10),
        baseArmourClass: numberField(10),
        armourClassEffectBonus: numberField(0),
        baseMovementSpeed: numberField(30, { min: 0 }),
        movementSpeed: numberField(30, { min: 0 }),
        movementSpeedMultiplier: textField("x1"),
        flightSpeed: textField(),
        waterSpeed: textField(),
        specialMovement: textField(),
        movementSummary: textField(),
        armourNotes: textField(),
        defenseSummary: textField(),
        offenseSummary: textField(),
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
    const sourceSystem = this.parent?._source?.system ?? this;
    const ownedItems = this.parent?.items?.contents ?? [];
    const attributeEffects = calculateCoreAttributeEffects({ system: sourceSystem, items: ownedItems });

    for (const abilityKey of ABILITY_KEYS) {
      const ability = this.abilities[abilityKey];
      const sourceAbility = sourceSystem.abilities?.[abilityKey] ?? ability;
      const baseValue = numberOrFallback(sourceAbility.value, numberOrFallback(ability.value, 10));
      const effectBonus = attributeEffects.abilityBonuses[abilityKey] ?? 0;
      const effectiveValue = Math.max(0, baseValue + effectBonus);

      ability.value = baseValue;
      ability.baseValue = baseValue;
      ability.effectBonus = effectBonus;
      ability.effectiveValue = effectiveValue;
      ability.modifier = Math.floor((effectiveValue - 10) / 2);
    }

    const baseArmourClass = Math.max(0, numberOrFallback(sourceSystem.combat?.armourClass, numberOrFallback(this.combat.armourClass, 10)));
    this.combat.baseArmourClass = baseArmourClass;
    this.combat.armourClassEffectBonus = attributeEffects.armourClassBonus;
    this.combat.armourClass = Math.max(0, baseArmourClass + attributeEffects.armourClassBonus);

    const hitPoints = this.combat.hitPoints;
    const baseHitPointMax = Math.max(0, numberOrFallback(sourceSystem.combat?.hitPoints?.max, numberOrFallback(hitPoints.max, 20)));
    hitPoints.baseMax = baseHitPointMax;
    hitPoints.effectBonus = attributeEffects.hitPointMaxBonus;
    hitPoints.max = Math.max(0, baseHitPointMax + attributeEffects.hitPointMaxBonus);
    hitPoints.value = numberOrFallback(sourceSystem.combat?.hitPoints?.value, hitPoints.value);
    hitPoints.value = Math.min(hitPoints.value, hitPoints.max);
    hitPoints.value = Math.max(-hitPoints.max, hitPoints.value);

    const energy = this.combat.energy;
    const baseEnergyMax = Math.max(0, numberOrFallback(sourceSystem.combat?.energy?.max, numberOrFallback(energy.max, 10)));
    energy.baseMax = baseEnergyMax;
    energy.effectBonus = attributeEffects.energyMaxBonus;
    energy.max = Math.max(0, baseEnergyMax + attributeEffects.energyMaxBonus);
    energy.value = Math.max(0, Math.min(numberOrFallback(sourceSystem.combat?.energy?.value, energy.value), energy.max));

    const movement = attributeEffects.movement;
    const baseMovementSpeed = Math.max(0, numberOrFallback(sourceSystem.combat?.movementSpeed, numberOrFallback(this.combat.movementSpeed, 30)));
    movement.baseGroundSpeed = baseMovementSpeed;
    this.combat.baseMovementSpeed = baseMovementSpeed;
    this.combat.movementSpeed = movement.groundSpeed;
    this.combat.movementSpeedMultiplier = movement.multiplierLabel;
    this.combat.flightSpeed = movement.flightSpeed;
    this.combat.waterSpeed = movement.waterSpeed;
    this.combat.specialMovement = movement.specialModes.join(", ");
    this.combat.movementSummary = movement.summary.join("; ");

    this.creation.startingLevel = Math.max(1, Number(this.creation.startingLevel) || Number(this.level) || 1);
    this.creation.startingExperience = Math.max(0, Number(this.creation.startingExperience) || Number(this.experience) || 0);

    applyPointSummaryToSystem(this, this.parent?.items?.contents ?? []);
  }
}

export class Anime5eCharacterData extends Anime5eBaseActorData {}

export class Anime5eNpcData extends Anime5eBaseActorData {}

export class Anime5eMonsterData extends Anime5eBaseActorData {}

export class Anime5eCompanionData extends Anime5eBaseActorData {}

export class Anime5eVehicleData extends Anime5eBaseActorData {}

export class Anime5eMechaData extends Anime5eBaseActorData {}
