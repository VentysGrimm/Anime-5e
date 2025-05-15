export default class Anime5eActor extends Actor {
    /** @override */
    prepareData() {
        super.prepareData();
        const actorData = this;

        // Make separate methods for each actor type
        if (actorData.type === 'player') this._preparePlayerData(actorData);
        else if (actorData.type === 'npc') this._prepareNPCData(actorData);
        else if (actorData.type === 'monster') this._prepareMonsterData(actorData);
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

        // Calculate modifiers
        if (data.abilities) {
            for (let [key, ability] of Object.entries(data.abilities)) {
                ability.mod = Math.floor((ability.value - 10) / 2);
            }
        }

        // Calculate HP
        if (data.attributes?.hp) {
            const hp = data.attributes.hp;
            hp.max = hp.base + (data.abilities?.constitution?.mod || 0) * hp.level;
        }

        // Calculate MP
        if (data.attributes?.mp) {
            const mp = data.attributes.mp;
            mp.max = mp.base + (data.abilities?.wisdom?.mod || 0) * mp.level;
        }

        // Calculate AC
        if (data.attributes?.ac) {
            const ac = data.attributes.ac;
            ac.value = 10 + (data.abilities?.dexterity?.mod || 0);
            // Add armor bonus if wearing armor
            if (data.armor && data.armor.value) {
                ac.value += data.armor.value;
            }
        }
    }

    /**
     * Prepare NPC type specific data
     */
    _prepareNPCData(actorData) {
        const data = actorData.system;
        
        // NPC specific calculations
        if (data.attributes?.hp) {
            const hp = data.attributes.hp;
            hp.max = hp.base;
        }

        if (data.attributes?.mp) {
            const mp = data.attributes.mp;
            mp.max = mp.base;
        }
    }

    /**
     * Prepare Monster type specific data
     */
    _prepareMonsterData(actorData) {
        const data = actorData.system;
        
        // Monster specific calculations
        if (data.attributes?.hp) {
            const hp = data.attributes.hp;
            hp.max = hp.base + (hp.bonus || 0);
        }

        // Calculate challenge rating bonuses
        if (data.cr) {
            data.proficiencyBonus = Math.max(2, Math.floor(data.cr / 4) + 2);
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