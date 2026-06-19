import {
  Anime5eCharacterData,
  Anime5eCompanionData,
  Anime5eMechaData as Anime5eMechaActorData,
  Anime5eMonsterData,
  Anime5eNpcData,
  Anime5eVehicleData as Anime5eVehicleActorData
} from "../module/documents/actor-data.mjs";
import {
  Anime5eArmorData,
  Anime5eAttributeData,
  Anime5eBackgroundData,
  Anime5eClassData,
  Anime5eDefectData,
  Anime5eEnhancementData,
  Anime5eEquipmentData,
  Anime5eFeatureData,
  Anime5eItemAttributeData,
  Anime5eItemOfPowerData,
  Anime5eLanguageData,
  Anime5eLifepathData,
  Anime5eLimiterData,
  Anime5eLootData,
  Anime5eMaterialData,
  Anime5eMechaData,
  Anime5eMonsterVariantData,
  Anime5eMountData,
  Anime5ePowerData,
  Anime5eProficiencyData,
  Anime5eShieldData,
  Anime5eSkillData,
  Anime5eSizeTemplateData,
  Anime5eSpeciesData,
  Anime5eSpellData,
  Anime5eTechniqueData,
  Anime5eToolData,
  Anime5eTraitData,
  Anime5eVehicleData,
  Anime5eWeaponData
} from "../module/documents/item-data.mjs";
import { importCoreCompendiumData } from "../module/data/compendiums.mjs";
import { Anime5eActorSheet, Anime5eBasicActorSheet } from "../module/sheets/actor-sheet.mjs";
import { Anime5eItemSheet } from "../module/sheets/item-sheet.mjs";

export const ANIME5E = {
  id: "anime5e",
  title: "Anime 5e",
  characterActorTypes: ["character"],
  basicActorTypes: ["companion", "mecha", "monster", "npc", "vehicle"],
  actorTypes: ["character", "companion", "mecha", "monster", "npc", "vehicle"],
  itemTypes: [
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
  ]
};

Hooks.once("init", () => {
  console.log(`${ANIME5E.title} | Initializing system`);

  game.anime5e = {
    config: ANIME5E,
    importCoreCompendiumData
  };

  CONFIG.ANIME5E = ANIME5E;

  Object.assign(CONFIG.Actor.dataModels, {
    character: Anime5eCharacterData,
    companion: Anime5eCompanionData,
    mecha: Anime5eMechaActorData,
    monster: Anime5eMonsterData,
    npc: Anime5eNpcData,
    vehicle: Anime5eVehicleActorData
  });

  Object.assign(CONFIG.Item.dataModels, {
    armor: Anime5eArmorData,
    attribute: Anime5eAttributeData,
    background: Anime5eBackgroundData,
    class: Anime5eClassData,
    defect: Anime5eDefectData,
    enhancement: Anime5eEnhancementData,
    equipment: Anime5eEquipmentData,
    feature: Anime5eFeatureData,
    itemAttribute: Anime5eItemAttributeData,
    itemOfPower: Anime5eItemOfPowerData,
    language: Anime5eLanguageData,
    lifepath: Anime5eLifepathData,
    limiter: Anime5eLimiterData,
    loot: Anime5eLootData,
    material: Anime5eMaterialData,
    mecha: Anime5eMechaData,
    monsterVariant: Anime5eMonsterVariantData,
    mount: Anime5eMountData,
    power: Anime5ePowerData,
    proficiency: Anime5eProficiencyData,
    shield: Anime5eShieldData,
    skill: Anime5eSkillData,
    sizeTemplate: Anime5eSizeTemplateData,
    species: Anime5eSpeciesData,
    spell: Anime5eSpellData,
    technique: Anime5eTechniqueData,
    tool: Anime5eToolData,
    trait: Anime5eTraitData,
    vehicle: Anime5eVehicleData,
    weapon: Anime5eWeaponData
  });

  const { DocumentSheetConfig } = foundry.applications.apps;

  DocumentSheetConfig.registerSheet(Actor, ANIME5E.id, Anime5eActorSheet, {
    label: "ANIME5E.Sheets.Actor",
    makeDefault: true,
    types: ANIME5E.characterActorTypes
  });

  DocumentSheetConfig.registerSheet(Actor, ANIME5E.id, Anime5eBasicActorSheet, {
    label: "ANIME5E.Sheets.BasicActor",
    makeDefault: true,
    types: ANIME5E.basicActorTypes
  });

  DocumentSheetConfig.registerSheet(Item, ANIME5E.id, Anime5eItemSheet, {
    label: "ANIME5E.Sheets.Item",
    makeDefault: true,
    types: ANIME5E.itemTypes
  });
});

Hooks.once("ready", () => {
  console.log(`${ANIME5E.title} | Ready`);
});
