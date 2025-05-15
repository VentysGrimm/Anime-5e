/**
 * System data schema definitions
 */

export const ANIME5E = {};

/**
 * The set of Actor types which may be created
 */
ANIME5E.actorTypes = new Set([
    "player",
    "npc",
    "monster"
]);

/**
 * The set of Item types which may be created
 */
ANIME5E.itemTypes = new Set([
    "weapon",
    "armor",
    "attribute",
    "defect",
    "enhancement",
    "limiter",
    "vehicle",
    "equipment",
    "race",
    "power"
]);

/**
 * Actor data schema
 */
ANIME5E.actorDataSchema = {
    player: {
        attributes: {
            hp: {
                value: { type: "Number", default: 10 },
                max: { type: "Number", default: 10 },
                base: { type: "Number", default: 10 }
            },
            mp: {
                value: { type: "Number", default: 10 },
                max: { type: "Number", default: 10 },
                base: { type: "Number", default: 10 }
            },
            ac: {
                value: { type: "Number", default: 10 }
            }
        },
        abilities: {
            strength: {
                value: { type: "Number", default: 10 },
                mod: { type: "Number", default: 0 }
            },
            dexterity: {
                value: { type: "Number", default: 10 },
                mod: { type: "Number", default: 0 }
            },
            constitution: {
                value: { type: "Number", default: 10 },
                mod: { type: "Number", default: 0 }
            },
            intelligence: {
                value: { type: "Number", default: 10 },
                mod: { type: "Number", default: 0 }
            },
            wisdom: {
                value: { type: "Number", default: 10 },
                mod: { type: "Number", default: 0 }
            },
            charisma: {
                value: { type: "Number", default: 10 },
                mod: { type: "Number", default: 0 }
            }
        },
        level: { type: "Number", default: 1 },
        experience: { type: "Number", default: 0 },
        proficiencyBonus: { type: "Number", default: 2 },
        initiative: { type: "Number", default: 0 },
        speed: { type: "Number", default: 30 }
    },
    npc: {
        attributes: {
            hp: {
                value: { type: "Number", default: 5 },
                max: { type: "Number", default: 5 },
                base: { type: "Number", default: 5 }
            },
            mp: {
                value: { type: "Number", default: 5 },
                max: { type: "Number", default: 5 },
                base: { type: "Number", default: 5 }
            },
            ac: {
                value: { type: "Number", default: 10 }
            }
        },
        cr: { type: "Number", default: 0 },
        proficiencyBonus: { type: "Number", default: 2 },
        initiative: { type: "Number", default: 0 },
        speed: { type: "Number", default: 30 }
    },
    monster: {
        attributes: {
            hp: {
                value: { type: "Number", default: 15 },
                max: { type: "Number", default: 15 },
                base: { type: "Number", default: 15 }
            },
            mp: {
                value: { type: "Number", default: 5 },
                max: { type: "Number", default: 5 },
                base: { type: "Number", default: 5 }
            },
            ac: {
                value: { type: "Number", default: 12 }
            }
        },
        cr: { type: "Number", default: 1 },
        proficiencyBonus: { type: "Number", default: 2 },
        initiative: { type: "Number", default: 0 },
        speed: { type: "Number", default: 30 },
        traits: {
            type: "Array",
            default: []
        },
        actions: {
            type: "Array",
            default: []
        },
        reactions: {
            type: "Array",
            default: []
        },
        legendaryActions: {
            type: "Array",
            default: []
        }
    }
};

/**
 * Item data schema
 */
ANIME5E.itemDataSchema = {
    weapon: {
        damage: { type: "String", default: "1d6" },
        damageType: { 
            type: "String", 
            default: "physical",
            options: ["physical", "fire", "ice", "lightning", "force", "psychic", "radiant", "necrotic"]
        },
        weaponType: {
            type: "String",
            default: "melee",
            options: ["melee", "ranged"]
        },
        properties: { type: "Array", default: [] },
        range: { type: "Number", default: 5 },
        enhancement: { type: "Number", default: 0 },
        weight: { type: "Number", default: 1 },
        quantity: { type: "Number", default: 1 },
        value: { type: "Number", default: 0 },
        description: { type: "String", default: "" }
    },
    armor: {
        baseAC: { type: "Number", default: 10 },
        type: {
            type: "String",
            default: "light",
            options: ["light", "medium", "heavy", "shield"]
        },
        enhancement: { type: "Number", default: 0 },
        weight: { type: "Number", default: 1 },
        quantity: { type: "Number", default: 1 },
        value: { type: "Number", default: 0 },
        description: { type: "String", default: "" }
    },
    attribute: {
        baseCost: { type: "Number", default: 1 },
        level: { type: "Number", default: 1 },
        type: {
            type: "String",
            options: [
                "artificialParts",
                "combatMastery",
                "dynamicSorcery",
                "energyBlast",
                "enhancedMovement",
                "extraActions",
                "fastHealing",
                "forceField",
                "heightened",
                "mindShield"
            ]
        },
        upgrades: { type: "Array", default: [] },
        description: { type: "String", default: "" }
    },
    defect: {
        basePoints: { type: "Number", default: 1 },
        severity: { type: "Number", default: 0 },
        type: {
            type: "String",
            options: [
                "achilles",
                "cursed",
                "dependent",
                "energyDrain",
                "haunted",
                "nemesis",
                "physicalDisability",
                "phobia",
                "restricted",
                "unskilled"
            ]
        },
        description: { type: "String", default: "" }
    },
    enhancement: {
        baseBonus: { type: "Number", default: 1 },
        powerCost: { type: "Number", default: 1 },
        type: {
            type: "String",
            default: "multiplier",
            options: ["multiplier", "flat", "percentage"]
        },
        applicableTo: { type: "Array", default: [] },
        requirements: {
            rankMin: { type: "Number", default: 0 },
            rankMax: { type: "Number", default: null },
            categories: { type: "Array", default: [] }
        },
        description: { type: "String", default: "" }
    },
    limiter: {
        baseReduction: { type: "Number", default: 10 },
        returnRate: { type: "Number", default: 0.5 },
        type: {
            type: "String",
            default: "multiplier",
            options: ["multiplier", "flat", "percentage"]
        },
        applicableTo: { type: "Array", default: [] },
        requirements: {
            rankMin: { type: "Number", default: 0 },
            rankMax: { type: "Number", default: null },
            categories: { type: "Array", default: [] }
        },
        description: { type: "String", default: "" }
    },
    vehicle: {
        speed: { type: "Number", default: 30 },
        capacity: { type: "Number", default: 5 },
        type: { type: "String", default: "ground" },
        value: { type: "Number", default: 0 },
        description: { type: "String", default: "" }
    },
    equipment: {
        weight: { type: "Number", default: 1 },
        quantity: { type: "Number", default: 1 },
        value: { type: "Number", default: 1 },
        description: { type: "String", default: "" }
    },
    race: {
        size: { 
            type: "String",
            default: "medium",
            options: ["tiny", "small", "medium", "large", "huge"]
        },
        traits: { type: "Array", default: [] },
        attributes: { type: "Array", default: [] },
        defects: { type: "Array", default: [] },
        languages: { type: "Array", default: ["common"] },
        culture: { type: "String", default: "" },
        lifespan: { type: "String", default: "" },
        description: { type: "String", default: "" }
    },
    power: {
        type: {
            type: "String",
            default: "attack",
            options: ["attack", "utility", "buff", "debuff", "healing"]
        },
        powerSource: {
            type: "String",
            default: "ki",
            options: ["ki", "magic", "tech", "idol"]
        },
        cost: { type: "Number", default: 1 },
        level: { type: "Number", default: 1 },
        range: { type: "Number", default: 5 },
        duration: { type: "String", default: "instant" },
        description: { type: "String", default: "" }
    }
};

/**
 * The set of Actor preparation methods which should be re-run when certain updates occur
 */
ANIME5E.actorPreparationMethods = {
    player: new Set(["prepareBaseData", "prepareDerivedData", "prepareEmbeddedDocuments"]),
    npc: new Set(["prepareBaseData", "prepareDerivedData", "prepareEmbeddedDocuments"]),
    monster: new Set(["prepareBaseData", "prepareDerivedData", "prepareEmbeddedDocuments"])
};

/**
 * The set of Item preparation methods which should be re-run when certain updates occur
 */
ANIME5E.itemPreparationMethods = {
    weapon: new Set(["prepareBaseData", "prepareDerivedData"]),
    armor: new Set(["prepareBaseData", "prepareDerivedData"]),
    attribute: new Set(["prepareBaseData", "prepareDerivedData"]),
    defect: new Set(["prepareBaseData", "prepareDerivedData"]),
    enhancement: new Set(["prepareBaseData", "prepareDerivedData"]),
    limiter: new Set(["prepareBaseData", "prepareDerivedData"]),
    vehicle: new Set(["prepareBaseData", "prepareDerivedData"]),
    equipment: new Set(["prepareBaseData", "prepareDerivedData"]),
    race: new Set(["prepareBaseData", "prepareDerivedData", "prepareEmbeddedDocuments"]),
    power: new Set(["prepareBaseData", "prepareDerivedData"])
}; 