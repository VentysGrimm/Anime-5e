/**
 * The Anime 5E game system for Foundry Virtual Tabletop
 * A system for playing Anime 5E games.
 * Author: Ventys Grimm
 */

export const ANIME5E = {};

/**
 * The set of Actor types supported by the system
 * @type {Set<string>}
 */
ANIME5E.actorTypes = new Set(["player", "npc", "monster"]);

/**
 * The set of Item types supported by the system
 * @type {Set<string>}
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
 * The set of Ability Scores used within the system
 * @type {Object}
 */
ANIME5E.abilities = {
    str: "ANIME5E.AbilityStr",
    dex: "ANIME5E.AbilityDex",
    con: "ANIME5E.AbilityCon",
    int: "ANIME5E.AbilityInt",
    wis: "ANIME5E.AbilityWis",
    cha: "ANIME5E.AbilityCha"
};

/**
 * Character class options
 * @type {Object}
 */
ANIME5E.characterClasses = {
    fighter: "ANIME5E.ClassFighter",
    mage: "ANIME5E.ClassMage",
    rogue: "ANIME5E.ClassRogue",
    cleric: "ANIME5E.ClassCleric"
};

/**
 * Allegiance types for NPCs and Monsters
 * @type {Object}
 */
ANIME5E.allegiances = {
    friendly: "ANIME5E.AllegianceFriendly",
    neutral: "ANIME5E.AllegianceNeutral",
    hostile: "ANIME5E.AllegianceHostile"
};

/**
 * Weapon types
 * @type {Object}
 */
ANIME5E.weaponTypes = {
    melee: "ANIME5E.WeaponMelee",
    ranged: "ANIME5E.WeaponRanged",
    thrown: "ANIME5E.WeaponThrown"
};

/**
 * Armor types
 * @type {Object}
 */
ANIME5E.armorTypes = {
    light: "ANIME5E.ArmorLight",
    medium: "ANIME5E.ArmorMedium",
    heavy: "ANIME5E.ArmorHeavy",
    shield: "ANIME5E.ArmorShield"
};

/**
 * Power types
 * @type {Object}
 */
ANIME5E.powerTypes = {
    attack: "ANIME5E.PowerAttack",
    utility: "ANIME5E.PowerUtility",
    buff: "ANIME5E.PowerBuff",
    debuff: "ANIME5E.PowerDebuff",
    healing: "ANIME5E.PowerHealing"
};

/**
 * Power sources
 * @type {Object}
 */
ANIME5E.powerSources = {
    ki: "ANIME5E.PowerSourceKi",
    magic: "ANIME5E.PowerSourceMagic",
    tech: "ANIME5E.PowerSourceTech",
    idol: "ANIME5E.PowerSourceIdol"
};

/**
 * Vehicle types
 * @type {Object}
 */
ANIME5E.vehicleTypes = {
    ground: "ANIME5E.VehicleGround",
    air: "ANIME5E.VehicleAir",
    water: "ANIME5E.VehicleWater",
    space: "ANIME5E.VehicleSpace"
};

/**
 * Creature sizes
 * @type {Object}
 */
ANIME5E.creatureSizes = {
    tiny: "ANIME5E.SizeTiny",
    small: "ANIME5E.SizeSmall",
    medium: "ANIME5E.SizeMedium",
    large: "ANIME5E.SizeLarge",
    huge: "ANIME5E.SizeHuge",
    gargantuan: "ANIME5E.SizeGargantuan"
};

/**
 * Default token configuration values for Actor types
 * @type {Object}
 */
ANIME5E.tokenDefaults = {
    player: {
        displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
        vision: true,
        actorLink: true,
        bar1: { attribute: "attributes.hp" },
        bar2: { attribute: "attributes.mp" }
    },
    npc: {
        displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
        displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
        vision: false,
        actorLink: false,
        bar1: { attribute: "attributes.hp" },
        bar2: { attribute: "attributes.mp" }
    },
    monster: {
        displayName: CONST.TOKEN_DISPLAY_MODES.HOVER,
        displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
        disposition: CONST.TOKEN_DISPOSITIONS.HOSTILE,
        vision: false,
        actorLink: false,
        bar1: { attribute: "attributes.hp" },
        bar2: { attribute: "attributes.mp" }
    }
}; 