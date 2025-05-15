export const NPCTemplate = {
    name: "",
    type: "npc",
    img: "icons/svg/mystery-man.svg",
    system: {
        description: "",
        allegiance: "neutral", // neutral, ally, enemy
        level: 1,
        challenge: 1, // Challenge rating/difficulty
        attributes: {
            hp: {
                value: 10,
                max: 10
            },
            mp: {
                value: 5,
                max: 5
            },
            ep: {
                value: 3,
                max: 3
            },
            ac: 10,
            initiative: 0,
            speed: 30
        },
        abilities: {
            str: {
                value: 10,
                mod: 0
            },
            dex: {
                value: 10,
                mod: 0
            },
            con: {
                value: 10,
                mod: 0
            },
            int: {
                value: 10,
                mod: 0
            },
            wis: {
                value: 10,
                mod: 0
            },
            cha: {
                value: 10,
                mod: 0
            }
        },
        skills: {}, // Will be populated with skill proficiencies
        traits: {
            attributes: [], // Array of attribute items
            defects: []    // Array of defect items
        },
        equipment: {
            weapons: [],
            armor: [],
            items: []
        },
        rewards: {
            xp: 0,
            items: [] // Loot items
        },
        behavior: {
            tactics: "", // Combat behavior description
            motivations: "", // Character motivations
            quirks: "" // Personality quirks
        }
    }
}; 