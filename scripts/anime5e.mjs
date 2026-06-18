import { Anime5eCharacterData, Anime5eNpcData } from "../module/documents/actor-data.mjs";
import { Anime5eEquipmentData, Anime5eFeatureData, Anime5ePowerData } from "../module/documents/item-data.mjs";
import { Anime5eActorSheet } from "../module/sheets/actor-sheet.mjs";
import { Anime5eItemSheet } from "../module/sheets/item-sheet.mjs";

export const ANIME5E = {
  id: "anime5e",
  title: "Anime 5e",
  actorTypes: ["character", "npc"],
  itemTypes: ["equipment", "feature", "power"]
};

Hooks.once("init", () => {
  console.log(`${ANIME5E.title} | Initializing system`);

  game.anime5e = {
    config: ANIME5E
  };

  CONFIG.ANIME5E = ANIME5E;

  Object.assign(CONFIG.Actor.dataModels, {
    character: Anime5eCharacterData,
    npc: Anime5eNpcData
  });

  Object.assign(CONFIG.Item.dataModels, {
    equipment: Anime5eEquipmentData,
    feature: Anime5eFeatureData,
    power: Anime5ePowerData
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
