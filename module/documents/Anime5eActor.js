export default class Anime5eActor extends Actor {
    /** @override */
    prepareData() {
        super.prepareData();
        const actorData = this;

        // Calculate ability modifiers first as they're used by other calculations
        this._calculateAbilityModifiers(actorData);

        // Make separate methods for each actor type
        if (actorData.type === 'player') this._preparePlayerData(actorData);
        else if (actorData.type === 'npc') this._prepareNPCData(actorData);
        else if (actorData.type === 'monster') this._prepareMonsterData(actorData);

        // Calculate derived stats that are common to all actor types
        this._calculateDerivedStats(actorData);
    }

    /**
     * Calculate ability modifiers
     * @private
     */
    _calculateAbilityModifiers(actorData) {
        if (!actorData.system?.abilities) return;

        const abilities = actorData.system.abilities;
        for (let [key, ability] of Object.entries(abilities)) {
            ability.mod = Math.floor((ability.value - 10) / 2);
        }
    }

    /**
     * Calculate derived statistics
     * @private
     */
    _calculateDerivedStats(actorData) {
        const system = actorData.system;

        // Calculate AC
        if (system.ac) {
            // Get dexterity modifier
            const dexMod = system.abilities?.dex?.mod || 0;
            system.ac.dexMod = dexMod;

            // Calculate total AC
            system.ac.value = system.ac.base + 
                            system.ac.dexMod + 
                            system.ac.armor + 
                            system.ac.shield + 
                            system.ac.bonus;
        }

        // Calculate initiative if not already set
        if (system.initiative) {
            const dexMod = system.abilities?.dex?.mod || 0;
            system.initiative.value = dexMod + (system.initiative.bonus || 0);
        }
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Set default token configuration
        const prototypeToken = {
            disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
            displayName: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            displayBars: CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
            bar1: { attribute: "attributes.hp" },
            bar2: { attribute: "attributes.mp" }
        };

        // Set default image based on actor type
        const img = this._getDefaultImage(data.type);
        if (img) this.updateSource({ img });

        // Set default token image to match actor image
        if (img) prototypeToken.texture = { src: img };
        this.updateSource({ prototypeToken });

        // Set default data structure based on type
        const createData = this._getDefaultData(data.type);
        if (createData) this.updateSource(createData);
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);

        // Handle armor updates
        if (changed.items) {
            const equippedArmor = changed.items.filter(i => 
                i.type === "armor" && i.system?.equipped);
            
            if (equippedArmor.length > 0) {
                let armorBonus = 0;
                let shieldBonus = 0;

                for (let armor of equippedArmor) {
                    if (armor.system.type === "shield") {
                        shieldBonus += armor.system.baseAC;
                    } else {
                        armorBonus += armor.system.baseAC;
                    }
                }

                changed.system = changed.system || {};
                changed.system.ac = changed.system.ac || {};
                changed.system.ac.armor = armorBonus;
                changed.system.ac.shield = shieldBonus;
            }
        }

        // Validate the update data
        const validationErrors = this._validateActorData(changed);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
        }

        // Handle specific updates
        await this._handleSpecificUpdates(changed);
    }

    /**
     * Validate actor data before updates
     * @private
     */
    _validateActorData(data) {
        const errors = [];
        const type = this.type;

        // Common validations for all actor types
        if (data.system?.attributes) {
            const attrs = data.system.attributes;
            
            // Validate HP
            if (attrs.hp !== undefined) {
                if (attrs.hp.value > attrs.hp.max) {
                    errors.push("HP cannot exceed maximum");
                }
                if (attrs.hp.value < 0) {
                    errors.push("HP cannot be negative");
                }
            }

            // Validate MP
            if (attrs.mp !== undefined) {
                if (attrs.mp.value > attrs.mp.max) {
                    errors.push("MP cannot exceed maximum");
                }
                if (attrs.mp.value < 0) {
                    errors.push("MP cannot be negative");
                }
            }
        }

        // Type-specific validations
        switch (type) {
            case 'player':
                errors.push(...this._validatePlayerData(data));
                break;
            case 'npc':
                errors.push(...this._validateNPCData(data));
                break;
            case 'monster':
                errors.push(...this._validateMonsterData(data));
                break;
        }

        return errors.filter(Boolean); // Remove any undefined/null entries
    }

    /**
     * Validate player-specific data
     * @private
     */
    _validatePlayerData(data) {
        const errors = [];
        const system = data.system;

        if (system?.abilities) {
            // Validate ability scores
            for (let [key, ability] of Object.entries(system.abilities)) {
                if (ability.value !== undefined) {
                    if (ability.value < 0) errors.push(`${key} cannot be negative`);
                    if (ability.value > 20) errors.push(`${key} cannot exceed 20`);
                }
            }
        }

        if (system?.level !== undefined) {
            if (system.level < 1) errors.push("Level cannot be less than 1");
            if (system.level > 20) errors.push("Level cannot exceed 20");
        }

        if (system?.experience !== undefined) {
            if (system.experience < 0) errors.push("Experience cannot be negative");
        }

        return errors;
    }

    /**
     * Validate NPC-specific data
     * @private
     */
    _validateNPCData(data) {
        const errors = [];
        const system = data.system;

        if (system?.cr !== undefined) {
            if (system.cr < 0) errors.push("Challenge Rating cannot be negative");
        }

        return errors;
    }

    /**
     * Validate monster-specific data
     * @private
     */
    _validateMonsterData(data) {
        const errors = [];
        const system = data.system;

        if (system?.cr !== undefined) {
            if (system.cr < 0) errors.push("Challenge Rating cannot be negative");
        }

        return errors;
    }

    /**
     * Get default image based on actor type
     * @private
     */
    _getDefaultImage(type) {
        const defaultImages = {
            player: "systems/anime5e/assets/icons/player.svg",
            npc: "systems/anime5e/assets/icons/npc.svg",
            monster: "systems/anime5e/assets/icons/monster.svg"
        };
        return defaultImages[type];
    }

    /**
     * Get default data structure based on actor type
     * @private
     */
    _getDefaultData(type) {
        const defaults = {
            player: {
                system: {
                    abilities: {
                        strength: { value: 10 },
                        dexterity: { value: 10 },
                        constitution: { value: 10 },
                        intelligence: { value: 10 },
                        wisdom: { value: 10 },
                        charisma: { value: 10 }
                    },
                    attributes: {
                        hp: { value: 10, max: 10, base: 10 },
                        mp: { value: 10, max: 10, base: 10 },
                        ac: { value: 10 }
                    },
                    level: 1,
                    experience: 0
                }
            },
            npc: {
                system: {
                    attributes: {
                        hp: { value: 5, max: 5, base: 5 },
                        mp: { value: 5, max: 5, base: 5 },
                        ac: { value: 10 }
                    },
                    cr: 0
                }
            },
            monster: {
                system: {
                    attributes: {
                        hp: { value: 15, max: 15, base: 15 },
                        mp: { value: 5, max: 5, base: 5 },
                        ac: { value: 12 }
                    },
                    cr: 1
                }
            }
        };
        return defaults[type];
    }

    /**
     * Handle specific update cases
     * @private
     */
    async _handleSpecificUpdates(changed) {
        // Handle level changes
        if (changed.system?.level) {
            await this._onLevelChange(changed.system.level);
        }

        // Handle ability score changes
        if (changed.system?.abilities) {
            await this._onAbilityScoreChange(changed.system.abilities);
        }
    }

    /**
     * Handle level change effects
     * @private
     */
    async _onLevelChange(newLevel) {
        // Recalculate HP and MP maximums
        const hp = this.system.attributes.hp;
        const mp = this.system.attributes.mp;
        
        hp.max = hp.base + (this.system.abilities?.constitution?.mod || 0) * newLevel;
        mp.max = mp.base + (this.system.abilities?.wisdom?.mod || 0) * newLevel;
        
        await this.update({
            "system.attributes.hp.max": hp.max,
            "system.attributes.mp.max": mp.max
        });
    }

    /**
     * Handle ability score change effects
     * @private
     */
    async _onAbilityScoreChange(abilities) {
        // Recalculate dependent values
        if (this.type === 'player') {
            const updates = {};
            
            // Update AC if dexterity changed
            if (abilities.dexterity) {
                const dexMod = Math.floor((abilities.dexterity.value - 10) / 2);
                updates["system.attributes.ac.value"] = 10 + dexMod;
            }

            // Update HP if constitution changed
            if (abilities.constitution) {
                const conMod = Math.floor((abilities.constitution.value - 10) / 2);
                updates["system.attributes.hp.max"] = this.system.attributes.hp.base + (conMod * this.system.level);
            }

            // Update MP if wisdom changed
            if (abilities.wisdom) {
                const wisMod = Math.floor((abilities.wisdom.value - 10) / 2);
                updates["system.attributes.mp.max"] = this.system.attributes.mp.base + (wisMod * this.system.level);
            }

            if (Object.keys(updates).length > 0) {
                await this.update(updates);
            }
        }
    }

    /**
     * Prepare Character type specific data
     */
    _preparePlayerData(actorData) {
        const data = actorData.system;

        // Calculate level
        data.level = data.experience ? Math.floor(data.experience / 1000) + 1 : 1;

        // Calculate HP
        if (data.hp) {
            const hp = data.hp;
            const conMod = data.abilities?.con?.mod || 0;
            hp.max = hp.base + (conMod * data.level);
        }

        // Calculate MP
        if (data.mp) {
            const mp = data.mp;
            const wisMod = data.abilities?.wis?.mod || 0;
            mp.max = mp.base + (wisMod * data.level);
        }

        // Calculate proficiency bonus
        data.proficiencyBonus = Math.floor((data.level + 7) / 4);
    }

    /**
     * Prepare NPC type specific data
     */
    _prepareNPCData(actorData) {
        const data = actorData.system;
        
        // Calculate proficiency bonus based on CR
        if (data.cr !== undefined) {
            data.proficiencyBonus = Math.max(2, Math.floor(data.cr / 4) + 2);
        }

        // Calculate HP and MP
        if (data.hp) {
            const hp = data.hp;
            const conMod = data.abilities?.con?.mod || 0;
            hp.max = hp.base + conMod;
        }

        if (data.mp) {
            const mp = data.mp;
            const wisMod = data.abilities?.wis?.mod || 0;
            mp.max = mp.base + wisMod;
        }
    }

    /**
     * Prepare Monster type specific data
     */
    _prepareMonsterData(actorData) {
        const data = actorData.system;
        
        // Calculate proficiency bonus based on CR
        if (data.cr !== undefined) {
            data.proficiencyBonus = Math.max(2, Math.floor(data.cr / 4) + 2);
        }

        // Calculate HP and MP
        if (data.hp) {
            const hp = data.hp;
            const conMod = data.abilities?.con?.mod || 0;
            hp.max = hp.base + (hp.bonus || 0) + conMod;
        }

        if (data.mp) {
            const mp = data.mp;
            const wisMod = data.abilities?.wis?.mod || 0;
            mp.max = mp.base + (mp.bonus || 0) + wisMod;
        }
    }

    /** @override */
    getRollData() {
        const data = super.getRollData();
        
        // Add level for easier access in rolls
        data.level = this.system.level;

        // Add ability modifiers
        data.abilities = {};
        for (let [key, ability] of Object.entries(this.system.abilities || {})) {
            data.abilities[key] = ability.mod;
        }

        // Add proficiency bonus if applicable
        if (this.type === 'player' || this.type === 'npc') {
            data.prof = Math.floor((data.level + 7) / 4);
        } else if (this.type === 'monster') {
            data.prof = this.system.proficiencyBonus;
        }

        return data;
    }
} 