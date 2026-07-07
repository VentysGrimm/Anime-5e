import {
  Anime5eCharacterData,
  Anime5eCompanionData,
  Anime5eItemConstructData,
  Anime5eMechaData as Anime5eMechaActorData,
  Anime5eMonsterData,
  Anime5eNpcData,
  Anime5eVehicleData as Anime5eVehicleActorData
} from "../module/documents/actor-data.mjs";
import {
  Anime5eAdventuringRiskData,
  Anime5eArmorData,
  Anime5eAttributeData,
  Anime5eBackgroundData,
  Anime5eClassData,
  Anime5eCraftingProjectData,
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
import {
  Anime5eCompendiumImportDialog,
  showCoreCompendiumImportDialog
} from "../module/apps/compendium-import-dialog.mjs";
import {
  Anime5eEncounterThreatDialog,
  showEncounterThreatDialog
} from "../module/apps/encounter-threat-dialog.mjs";
import { importCoreCompendiumData } from "../module/data/compendiums.mjs";
import * as Anime5eClassBenefits from "../module/rules/class-benefits.mjs";
import * as Anime5eCombatManoeuvres from "../module/rules/combat-manoeuvres.mjs";
import { registerCreationWorkflowHooks } from "../module/rules/creation-workflow.mjs";
import * as Anime5eDynamicPowers from "../module/rules/dynamic-powers.mjs";
import * as Anime5ePoints from "../module/rules/points.mjs";
import * as Anime5eResources from "../module/rules/resources.mjs";
import * as Anime5eRolls from "../module/rules/rolls.mjs";
import * as Anime5eSpeciesTraits from "../module/rules/species-traits.mjs";
import { Anime5eActorSheet, Anime5eBasicActorSheet } from "../module/sheets/actor-sheet.mjs";
import { Anime5eItemSheet } from "../module/sheets/item-sheet.mjs";

export const ANIME5E = {
  id: "anime5e",
  title: "Anime 5e",
  characterActorTypes: ["character"],
  basicActorTypes: ["companion", "itemConstruct", "mecha", "monster", "npc", "vehicle"],
  actorTypes: ["character", "companion", "itemConstruct", "mecha", "monster", "npc", "vehicle"],
  itemTypes: [
    "adventuringRisk",
    "armor",
    "attribute",
    "background",
    "class",
    "craftingProject",
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
    classBenefits: Anime5eClassBenefits,
    combatManoeuvres: Anime5eCombatManoeuvres,
    dynamicPowers: Anime5eDynamicPowers,
    importCoreCompendiumData,
    points: Anime5ePoints,
    resources: Anime5eResources,
    rolls: Anime5eRolls,
    speciesTraits: Anime5eSpeciesTraits,
    showEncounterThreatDialog,
    showCoreCompendiumImportDialog
  };

  CONFIG.ANIME5E = ANIME5E;

  game.settings.registerMenu(ANIME5E.id, "coreCompendiumImport", {
    name: "Anime 5e Source Compendiums",
    label: "Import / Update",
    hint: "Import or update source-backed core and supplemental content into the declared Anime 5e compendium packs.",
    icon: "fa-solid fa-file-import",
    type: Anime5eCompendiumImportDialog,
    restricted: true
  });

  game.settings.registerMenu(ANIME5E.id, "encounterThreatTool", {
    name: "Anime 5e Encounter Threat",
    label: "Open",
    hint: "Open the manual Challenge Rating and Encounter Threat calculator shell.",
    icon: "fa-solid fa-scale-balanced",
    type: Anime5eEncounterThreatDialog,
    restricted: true
  });

  game.settings.register(ANIME5E.id, "energyUsageMode", {
    name: "Energy Usage Mode",
    hint: "Choose whether Attribute use spends Energy automatically, leaves Energy costs as manual notes, or disables Energy bookkeeping.",
    scope: "world",
    config: true,
    type: String,
    choices: {
      tracked: "Tracked",
      manual: "Manual",
      disabled: "Disabled"
    },
    default: "tracked"
  });

  game.settings.register(ANIME5E.id, "applyRangePenalties", {
    name: "Apply Range Penalties",
    hint: "Subtract configured common-attack range penalties from attack rolls.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(ANIME5E.id, "showMarginOfSuccess", {
    name: "Show Margin of Success",
    hint: "Display the difference between attack roll totals and entered target Armour Class values.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  game.settings.register(ANIME5E.id, "showCriticalRollNotes", {
    name: "Show Critical Roll Notes",
    hint: "Annotate d20 attack rolls that keep a natural 20 or natural 1.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false
  });

  Object.assign(CONFIG.Actor.dataModels, {
    character: Anime5eCharacterData,
    companion: Anime5eCompanionData,
    itemConstruct: Anime5eItemConstructData,
    mecha: Anime5eMechaActorData,
    monster: Anime5eMonsterData,
    npc: Anime5eNpcData,
    vehicle: Anime5eVehicleActorData
  });

  Object.assign(CONFIG.Item.dataModels, {
    adventuringRisk: Anime5eAdventuringRiskData,
    armor: Anime5eArmorData,
    attribute: Anime5eAttributeData,
    background: Anime5eBackgroundData,
    class: Anime5eClassData,
    craftingProject: Anime5eCraftingProjectData,
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

  registerCreationWorkflowHooks();
});

Hooks.once("ready", () => {
  console.log(`${ANIME5E.title} | Ready`);
});
