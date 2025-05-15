export const AttributeTemplate = {
    name: "",
    type: "attribute",
    img: "icons/svg/item-bag.svg",
    system: {
        description: "",
        cost: 1,
        rank: {
            value: 1,
            min: 1,
            max: 5
        },
        isCustom: false,
        category: "",
        effects: [],
        requirements: {
            minLevel: 1,
            prerequisites: []
        },
        activation: {
            type: "", // passive, action, bonus, reaction
            cost: 0,
            condition: ""
        }
    }
};

export const DefectTemplate = {
    name: "",
    type: "defect",
    img: "icons/svg/item-bag.svg",
    system: {
        description: "",
        refund: 1,
        rank: {
            value: 1,
            min: 1,
            max: 5
        },
        isCustom: false,
        category: "",
        effects: [],
        trigger: {
            type: "", // constant, conditional, situational
            condition: ""
        },
        complications: []
    }
};

export const RaceTemplate = {
    name: "",
    type: "race",
    img: "icons/svg/item-bag.svg",
    system: {
        description: "",
        traits: {
            attributes: [], // Array of attribute objects to be added
            defects: []    // Array of defect objects to be added
        },
        size: "medium",
        raceAbilities: [], // Additional racial abilities that aren't attributes
        culture: "",
        lifespan: "",
        languages: []
    }
};

export const EnhancementTemplate = {
    name: "",
    type: "enhancement",
    img: "icons/svg/upgrade.svg",
    system: {
        description: "",
        cost: {
            type: "multiplier", // multiplier, flat, percentage
            value: 1.0
        },
        applicableTo: [], // array of trait types this can be applied to (attribute, defect)
        effects: [],
        requirements: {
            minRank: 1,
            maxRank: null,
            traitCategories: [] // specific categories this can be applied to
        },
        isCustom: false
    }
};

export const LimiterTemplate = {
    name: "",
    type: "limiter",
    img: "icons/svg/downgrade.svg",
    system: {
        description: "",
        refund: {
            type: "multiplier", // multiplier, flat, percentage
            value: 0.5
        },
        applicableTo: [], // array of trait types this can be applied to (attribute, defect)
        effects: [],
        requirements: {
            minRank: 1,
            maxRank: null,
            traitCategories: [] // specific categories this can be applied to
        },
        isCustom: false
    }
};

export const WeaponTemplate = {
    name: "",
    type: "weapon",
    img: "icons/svg/sword.svg",
    system: {
        description: "",
        weaponType: "melee", // melee, ranged
        properties: {
            damage: "1d6",
            damageType: "physical",
            range: 5, // feet for melee, feet/squares for ranged
            weight: 1,
            hands: 1, // 1 or 2 hands
            properties: [] // light, heavy, finesse, thrown, etc.
        },
        enhancements: [], // Array of enhancement items
        limiters: [], // Array of limiter items
        baseCost: 10, // Base cost in points
        finalCost: 10, // Cost after enhancements/limiters
        equipped: false
    }
};

export const ArmorTemplate = {
    name: "",
    type: "armor",
    img: "icons/svg/shield.svg",
    system: {
        description: "",
        armorType: "light", // light, medium, heavy, shield
        properties: {
            ac: 10,
            dexBonus: true, // Can add DEX modifier?
            maxDexBonus: null, // Maximum DEX bonus allowed
            weight: 1,
            stealthDisadvantage: false
        },
        enhancements: [],
        limiters: [],
        baseCost: 10,
        finalCost: 10,
        equipped: false
    }
};

export const VehicleTemplate = {
    name: "",
    type: "vehicle",
    img: "icons/svg/tank.svg",
    system: {
        description: "",
        vehicleType: "land", // land, water, air
        properties: {
            ac: 15,
            hp: 100,
            speed: 30,
            capacity: 5, // number of passengers
            weight: 100,
            size: "large" // medium, large, huge, gargantuan
        },
        enhancements: [],
        limiters: [],
        baseCost: 50,
        finalCost: 50,
        crew: {
            required: 1,
            maximum: 1
        }
    }
}; 