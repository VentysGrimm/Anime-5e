// Import necessary modules and configurations
import { ANIME5E } from "./config/constants.js";
import { AnimeActor } from "./documents/AnimeActor.js";
import { AnimeItem } from "./documents/AnimeItem.js";
import { preloadHandlebarsTemplates } from "./helpers/templates.js";
import { CharacterSheet } from "./sheets/CharacterSheet.js";
import { NPCSheet } from "./sheets/NPCSheet.js";
import { MonsterSheet } from "./sheets/MonsterSheet.js";
import { RaceSheet } from "./sheets/RaceSheet.js";
import { AttributeSheet } from "./sheets/AttributeSheet.js";
import { DefectSheet } from "./sheets/DefectSheet.js";
import { EnhancementSheet } from "./sheets/EnhancementSheet.js";
import { LimiterSheet } from "./sheets/LimiterSheet.js";

Hooks.once('init', async function() {
    console.log('Anime5E | Initializing Anime 5E System');

    // Define custom document classes
    CONFIG.ANIME5E = ANIME5E;
    CONFIG.Actor.documentClass = AnimeActor;
    CONFIG.Item.documentClass = AnimeItem;

    // Register actor types
    CONFIG.Actor.types = Array.from(ANIME5E.actorTypes);
    
    // Register actor type labels
    CONFIG.Actor.typeLabels = {
        player: "ANIME5E.ActorTypePlayer",
        npc: "ANIME5E.ActorTypeNPC",
        monster: "ANIME5E.ActorTypeMonster"
    };

    // Register item types
    CONFIG.Item.types = Array.from(ANIME5E.itemTypes);

    // Register item type labels
    CONFIG.Item.typeLabels = {
        weapon: "ANIME5E.Items.Weapon",
        armor: "ANIME5E.Items.Armor",
        attribute: "ANIME5E.Items.Attribute",
        defect: "ANIME5E.Items.Defect",
        enhancement: "ANIME5E.Items.Enhancement",
        limiter: "ANIME5E.Items.Limiter",
        vehicle: "ANIME5E.Items.Vehicle",
        equipment: "ANIME5E.Items.Equipment",
        race: "ANIME5E.Items.Race",
        power: "ANIME5E.Items.Power"
    };

    // Register sheet application classes
    Actors.unregisterSheet("core", ActorSheet);
    
    // Register actor sheets
    Actors.registerSheet("anime5e", CharacterSheet, {
        types: ["player"],
        makeDefault: true,
        label: "ANIME5E.Sheets.PlayerCharacter"
    });
    
    Actors.registerSheet("anime5e", NPCSheet, {
        types: ["npc"],
        makeDefault: true,
        label: "ANIME5E.Sheets.NPC"
    });
    
    Actors.registerSheet("anime5e", MonsterSheet, {
        types: ["monster"],
        makeDefault: true,
        label: "ANIME5E.Sheets.Monster"
    });

    // Register item sheets
    Items.unregisterSheet("core", ItemSheet);

    // Register item sheets
    Items.registerSheet("anime5e", RaceSheet, {
        types: ["race"],
        makeDefault: true,
        label: "ANIME5E.Sheets.Race"
    });

    Items.registerSheet("anime5e", AttributeSheet, {
        types: ["attribute"],
        makeDefault: true,
        label: "ANIME5E.Sheets.Attribute"
    });

    Items.registerSheet("anime5e", DefectSheet, {
        types: ["defect"],
        makeDefault: true,
        label: "ANIME5E.Sheets.Defect"
    });

    Items.registerSheet("anime5e", EnhancementSheet, {
        types: ["enhancement"],
        makeDefault: true,
        label: "ANIME5E.Sheets.Enhancement"
    });

    Items.registerSheet("anime5e", LimiterSheet, {
        types: ["limiter"],
        makeDefault: true,
        label: "ANIME5E.Sheets.Limiter"
    });

    // Register custom Handlebars helpers
    Handlebars.registerHelper('formatCost', function(cost) {
        return cost > 0 ? `+${cost}` : cost;
    });

    Handlebars.registerHelper('isCustomItem', function(item) {
        return item.system.isCustom;
    });

    // Preload Handlebars templates
    await preloadHandlebarsTemplates();
});

Hooks.once('ready', async function() {
    // Any one-time system initialization that needs to happen after init
    console.log('Anime5E | System Ready');
});

// Handle custom item creation dialog
async function createCustomItemDialog(itemType) {
    const template = itemType === "attribute" ? AttributeTemplate : itemType === "defect" ? DefectTemplate : itemType === "enhancement" ? EnhancementTemplate : LimiterTemplate;
    
    const dialog = new Dialog({
        title: `Create Custom ${itemType.capitalize()}`,
        content: await renderTemplate(`systems/anime5e/templates/dialogs/custom-${itemType}.html`, template),
        buttons: {
            create: {
                label: "Create",
                callback: async (html) => {
                    const form = html.find('form')[0];
                    const formData = new FormData(form);
                    const data = Object.fromEntries(formData.entries());
                    
                    // Create the custom item
                    const item = await Item.create({
                        ...template,
                        name: data.name,
                        system: {
                            ...template.system,
                            description: data.description,
                            cost: parseInt(data.cost),
                            isCustom: true
                        }
                    });
                    
                    return item;
                }
            },
            cancel: {
                label: "Cancel"
            }
        },
        default: "create"
    });
    
    dialog.render(true);
} 