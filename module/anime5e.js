// Import necessary modules and configurations
import { ANIME5E } from "./schema.js";
import { Anime5eActor } from "./documents/actor.js";
import Anime5eItem from "./documents/Anime5eItem.js";
import { preloadHandlebarsTemplates } from "./templates.js";
import { AttributeTemplate, DefectTemplate, RaceTemplate, EnhancementTemplate, LimiterTemplate } from "./templates/item-templates.js";
import { RaceSheet } from "./sheets/RaceSheet.js";
import { AttributeSheet } from "./sheets/AttributeSheet.js";
import { DefectSheet } from "./sheets/DefectSheet.js";
import { EnhancementSheet } from "./sheets/EnhancementSheet.js";
import { LimiterSheet } from "./sheets/LimiterSheet.js";
import Anime5eActor from "./documents/Anime5eActor.js";

Hooks.once('init', async function() {
    console.log('Anime5E | Initializing Anime 5E System');

    // Define custom document classes
    CONFIG.ANIME5E = ANIME5E;
    CONFIG.Actor.documentClass = Anime5eActor;
    CONFIG.Item.documentClass = Anime5eItem;

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
    Items.unregisterSheet("core", ItemSheet);

    // Register the race sheet
    Items.registerSheet("anime5e", RaceSheet, {
        types: ["race"],
        makeDefault: true
    });

    // Register the attribute sheet
    Items.registerSheet("anime5e", AttributeSheet, {
        types: ["attribute"],
        makeDefault: true
    });

    // Register the defect sheet
    Items.registerSheet("anime5e", DefectSheet, {
        types: ["defect"],
        makeDefault: true
    });

    // Register the enhancement sheet
    Items.registerSheet("anime5e", EnhancementSheet, {
        types: ["enhancement"],
        makeDefault: true
    });

    // Register the limiter sheet
    Items.registerSheet("anime5e", LimiterSheet, {
        types: ["limiter"],
        makeDefault: true
    });

    // Register template data for custom items
    CONFIG.Item.templates = {
        ...CONFIG.Item.templates,
        "attribute": AttributeTemplate,
        "defect": DefectTemplate,
        "race": RaceTemplate,
        "enhancement": EnhancementTemplate,
        "limiter": LimiterTemplate
    };

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

    // Register context menu options for Attributes and Defects
    const customItemOptions = {
        name: "Create Custom",
        icon: '<i class="fas fa-plus"></i>',
        condition: li => true,
        callback: li => {
            const itemType = li.data("item-type");
            const template = itemType === "attribute" ? AttributeTemplate : itemType === "defect" ? DefectTemplate : itemType === "enhancement" ? EnhancementTemplate : LimiterTemplate;
            const actor = game.actors.get(li.parents('[data-actor-id]').data("actor-id"));
            
            template.system.isCustom = true;
            actor.createEmbeddedDocuments("Item", [template]);
        }
    };

    // Add context menu option to both Attributes and Defects lists
    const attributeList = html.find(".attributes-list");
    const defectList = html.find(".defects-list");
    
    new ContextMenu(attributeList, ".item", [customItemOptions]);
    new ContextMenu(defectList, ".item", [customItemOptions]);
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