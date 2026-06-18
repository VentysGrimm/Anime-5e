import { Anime5eCharacterData, Anime5eNpcData } from "../module/documents/actor-data.mjs";
import {
  Anime5eArmorData,
  Anime5eAttributeData,
  Anime5eBackgroundData,
  Anime5eClassData,
  Anime5eDefectData,
  Anime5eEquipmentData,
  Anime5eFeatureData,
  Anime5ePowerData,
  Anime5eSpeciesData,
  Anime5eSpellData,
  Anime5eTechniqueData,
  Anime5eTraitData,
  Anime5eWeaponData
} from "../module/documents/item-data.mjs";
import { importCoreCompendiumData } from "../module/data/compendiums.mjs";
import { Anime5eActorSheet } from "../module/sheets/actor-sheet.mjs";
import { Anime5eItemSheet } from "../module/sheets/item-sheet.mjs";

export const ANIME5E = {
  id: "anime5e",
  title: "Anime 5e",
  actorTypes: ["character", "npc"],
  itemTypes: [
    "armor",
    "attribute",
    "background",
    "class",
    "defect",
    "equipment",
    "feature",
    "power",
    "species",
    "spell",
    "technique",
    "trait",
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
    npc: Anime5eNpcData
  });

  Object.assign(CONFIG.Item.dataModels, {
    armor: Anime5eArmorData,
    attribute: Anime5eAttributeData,
    background: Anime5eBackgroundData,
    class: Anime5eClassData,
    defect: Anime5eDefectData,
    equipment: Anime5eEquipmentData,
    feature: Anime5eFeatureData,
    power: Anime5ePowerData,
    species: Anime5eSpeciesData,
    spell: Anime5eSpellData,
    technique: Anime5eTechniqueData,
    trait: Anime5eTraitData,
    weapon: Anime5eWeaponData
  });

  const { DocumentSheetConfig } = foundry.applications.apps;

  DocumentSheetConfig.registerSheet(Actor, ANIME5E.id, Anime5eActorSheet, {
    label: "ANIME5E.Sheets.Actor",
    makeDefault: true,
    types: ANIME5E.actorTypes
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
