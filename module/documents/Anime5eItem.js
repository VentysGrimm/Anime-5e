export default class Anime5eItem extends Item {
    /** @override */
    prepareData() {
        super.prepareData();
        const itemData = this;

        // Handle different item types
        switch (itemData.type) {
            case 'attribute':
                this._prepareAttributeData(itemData);
                break;
            case 'defect':
                this._prepareDefectData(itemData);
                break;
            case 'armor':
                this._prepareArmorData(itemData);
                break;
            case 'weapon':
                this._prepareWeaponData(itemData);
                break;
            case 'vehicle':
                this._prepareVehicleData(itemData);
                break;
            case 'equipment':
                this._prepareEquipmentData(itemData);
                break;
            case 'enhancement':
                this._prepareEnhancementData(itemData);
                break;
            case 'limiter':
                this._prepareLimiterData(itemData);
                break;
        }
    }

    /**
     * Prepare Attribute type specific data
     */
    _prepareAttributeData(itemData) {
        const data = itemData.system;
        // Calculate total cost
        data.totalCost = data.baseCost + (data.upgrades?.reduce((sum, upgrade) => sum + upgrade.cost, 0) || 0);
        
        // Calculate attribute bonuses
        if (data.level) {
            data.bonus = Math.floor(data.level / 2);
        }
    }

    /**
     * Prepare Defect type specific data
     */
    _prepareDefectData(itemData) {
        const data = itemData.system;
        // Calculate point returns
        data.totalPoints = data.basePoints + (data.severity || 0);
    }

    /**
     * Prepare Armor type specific data
     */
    _prepareArmorData(itemData) {
        const data = itemData.system;
        // Calculate total AC
        data.totalAC = data.baseAC + (data.enhancement || 0);
        
        // Calculate weight if applicable
        if (data.weight) {
            data.totalWeight = data.weight * (data.quantity || 1);
        }
    }

    /**
     * Prepare Weapon type specific data
     */
    _prepareWeaponData(itemData) {
        const data = itemData.system;
        // Parse damage formula
        if (data.damage) {
            data.damageFormula = data.damage + (data.enhancement ? ` + ${data.enhancement}` : '');
        }

        // Calculate weight if applicable
        if (data.weight) {
            data.totalWeight = data.weight * (data.quantity || 1);
        }
    }

    /**
     * Prepare Vehicle type specific data
     */
    _prepareVehicleData(itemData) {
        const data = itemData.system;
        // Calculate speed modifications
        if (data.speed && data.speedMod) {
            data.totalSpeed = data.speed + data.speedMod;
        }

        // Calculate capacity if applicable
        if (data.capacity && data.capacityMod) {
            data.totalCapacity = data.capacity + data.capacityMod;
        }
    }

    /**
     * Prepare Equipment type specific data
     */
    _prepareEquipmentData(itemData) {
        const data = itemData.system;
        // Calculate total weight
        if (data.weight) {
            data.totalWeight = data.weight * (data.quantity || 1);
        }

        // Calculate total value
        if (data.value) {
            data.totalValue = data.value * (data.quantity || 1);
        }
    }

    /**
     * Prepare Enhancement type specific data
     */
    _prepareEnhancementData(itemData) {
        const data = itemData.system;
        // Calculate enhancement bonuses
        data.totalBonus = data.baseBonus + (data.additionalBonus || 0);
        
        // Calculate power cost if applicable
        if (data.powerCost) {
            data.totalPowerCost = data.powerCost * (data.level || 1);
        }
    }

    /**
     * Prepare Limiter type specific data
     */
    _prepareLimiterData(itemData) {
        const data = itemData.system;
        // Calculate limiter effects
        data.totalReduction = data.baseReduction + (data.additionalReduction || 0);
        
        // Calculate point returns
        data.pointReturn = Math.floor(data.totalReduction * data.returnRate);
    }

    /** @override */
    getRollData() {
        const data = super.getRollData();
        const itemData = this;

        // Add type-specific roll data
        switch (itemData.type) {
            case 'weapon':
                data.damage = itemData.system.damageFormula;
                data.enhancement = itemData.system.enhancement;
                break;
            case 'attribute':
                data.level = itemData.system.level;
                data.bonus = itemData.system.bonus;
                break;
        }

        return data;
    }

    /**
     * Handle item rolls
     */
    async roll() {
        const item = this;

        // Handle different roll types based on item type
        switch (item.type) {
            case 'weapon':
                return this._rollWeaponDamage();
            case 'attribute':
                return this._rollAttribute();
            // Add other roll types as needed
        }
    }

    /**
     * Roll weapon damage
     */
    async _rollWeaponDamage() {
        const item = this;
        const data = item.system;

        if (!data.damage) return;

        const roll = new Roll(data.damageFormula);
        const title = `${item.name} - Damage Roll`;

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: title
        });

        return roll;
    }

    /**
     * Roll an attribute check
     */
    async _rollAttribute() {
        const item = this;
        const data = item.system;

        const roll = new Roll("1d20 + @bonus", { bonus: data.bonus || 0 });
        const title = `${item.name} - Attribute Check`;

        roll.toMessage({
            speaker: ChatMessage.getSpeaker({ actor: this.actor }),
            flavor: title
        });

        return roll;
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);

        // Set default icon based on item type
        const img = this._getDefaultImage(data.type);
        if (img) this.updateSource({ img });

        // Set default data structure based on type
        const createData = this._getDefaultData(data.type);
        if (createData) this.updateSource(createData);
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);

        // Validate the update data
        const validationErrors = this._validateItemData(changed);
        if (validationErrors.length > 0) {
            throw new Error(`Validation failed: ${validationErrors.join(", ")}`);
        }

        // Handle specific updates
        await this._handleSpecificUpdates(changed);
    }

    /**
     * Validate item data before updates
     * @private
     */
    _validateItemData(data) {
        const errors = [];
        const type = this.type;

        // Common validations for all item types
        if (data.system?.quantity !== undefined) {
            if (data.system.quantity < 0) errors.push("Quantity cannot be negative");
        }

        if (data.system?.weight !== undefined) {
            if (data.system.weight < 0) errors.push("Weight cannot be negative");
        }

        if (data.system?.value !== undefined) {
            if (data.system.value < 0) errors.push("Value cannot be negative");
        }

        // Type-specific validations
        switch (type) {
            case 'weapon':
                errors.push(...this._validateWeaponData(data));
                break;
            case 'armor':
                errors.push(...this._validateArmorData(data));
                break;
            case 'attribute':
                errors.push(...this._validateAttributeData(data));
                break;
            case 'defect':
                errors.push(...this._validateDefectData(data));
                break;
            case 'enhancement':
                errors.push(...this._validateEnhancementData(data));
                break;
            case 'limiter':
                errors.push(...this._validateLimiterData(data));
                break;
            case 'vehicle':
                errors.push(...this._validateVehicleData(data));
                break;
        }

        return errors.filter(Boolean);
    }

    /**
     * Validate weapon-specific data
     * @private
     */
    _validateWeaponData(data) {
        const errors = [];
        const system = data.system;

        if (system?.damage) {
            if (!this._isValidDiceFormula(system.damage)) {
                errors.push("Invalid damage formula");
            }
        }

        if (system?.enhancement !== undefined) {
            if (system.enhancement < 0) errors.push("Enhancement bonus cannot be negative");
            if (system.enhancement > 5) errors.push("Enhancement bonus cannot exceed +5");
        }

        if (system?.range !== undefined) {
            if (system.range < 0) errors.push("Range cannot be negative");
        }

        return errors;
    }

    /**
     * Validate armor-specific data
     * @private
     */
    _validateArmorData(data) {
        const errors = [];
        const system = data.system;

        if (system?.baseAC !== undefined) {
            if (system.baseAC < 0) errors.push("Base AC cannot be negative");
        }

        if (system?.enhancement !== undefined) {
            if (system.enhancement < 0) errors.push("Enhancement bonus cannot be negative");
            if (system.enhancement > 5) errors.push("Enhancement bonus cannot exceed +5");
        }

        if (system?.type && !['light', 'medium', 'heavy', 'shield'].includes(system.type)) {
            errors.push("Invalid armor type");
        }

        return errors;
    }

    /**
     * Validate attribute-specific data
     * @private
     */
    _validateAttributeData(data) {
        const errors = [];
        const system = data.system;

        if (system?.baseCost !== undefined) {
            if (system.baseCost < 0) errors.push("Base cost cannot be negative");
        }

        if (system?.level !== undefined) {
            if (system.level < 0) errors.push("Level cannot be negative");
            if (system.level > 20) errors.push("Level cannot exceed 20");
        }

        return errors;
    }

    /**
     * Validate defect-specific data
     * @private
     */
    _validateDefectData(data) {
        const errors = [];
        const system = data.system;

        if (system?.basePoints !== undefined) {
            if (system.basePoints < 0) errors.push("Base points cannot be negative");
        }

        if (system?.severity !== undefined) {
            if (system.severity < 0) errors.push("Severity cannot be negative");
            if (system.severity > 3) errors.push("Severity cannot exceed 3");
        }

        return errors;
    }

    /**
     * Validate enhancement-specific data
     * @private
     */
    _validateEnhancementData(data) {
        const errors = [];
        const system = data.system;

        if (system?.baseBonus !== undefined) {
            if (system.baseBonus < 0) errors.push("Base bonus cannot be negative");
        }

        if (system?.powerCost !== undefined) {
            if (system.powerCost < 0) errors.push("Power cost cannot be negative");
        }

        return errors;
    }

    /**
     * Validate limiter-specific data
     * @private
     */
    _validateLimiterData(data) {
        const errors = [];
        const system = data.system;

        if (system?.baseReduction !== undefined) {
            if (system.baseReduction < 0) errors.push("Base reduction cannot be negative");
            if (system.baseReduction > 100) errors.push("Base reduction cannot exceed 100%");
        }

        if (system?.returnRate !== undefined) {
            if (system.returnRate < 0) errors.push("Return rate cannot be negative");
            if (system.returnRate > 1) errors.push("Return rate cannot exceed 1");
        }

        return errors;
    }

    /**
     * Validate vehicle-specific data
     * @private
     */
    _validateVehicleData(data) {
        const errors = [];
        const system = data.system;

        if (system?.speed !== undefined) {
            if (system.speed < 0) errors.push("Speed cannot be negative");
        }

        if (system?.capacity !== undefined) {
            if (system.capacity < 0) errors.push("Capacity cannot be negative");
        }

        return errors;
    }

    /**
     * Get default image based on item type
     * @private
     */
    _getDefaultImage(type) {
        const defaultImages = {
            weapon: "systems/anime5e/assets/icons/items/weapon.svg",
            armor: "systems/anime5e/assets/icons/items/armor.svg",
            attribute: "systems/anime5e/assets/icons/items/attribute.svg",
            defect: "systems/anime5e/assets/icons/items/defect.svg",
            enhancement: "systems/anime5e/assets/icons/items/enhancement.svg",
            limiter: "systems/anime5e/assets/icons/items/limiter.svg",
            vehicle: "systems/anime5e/assets/icons/items/vehicle.svg",
            equipment: "systems/anime5e/assets/icons/items/equipment.svg"
        };
        return defaultImages[type];
    }

    /**
     * Get default data structure based on item type
     * @private
     */
    _getDefaultData(type) {
        const defaults = {
            weapon: {
                system: {
                    damage: "1d6",
                    enhancement: 0,
                    weight: 1,
                    quantity: 1,
                    range: 5,
                    properties: []
                }
            },
            armor: {
                system: {
                    baseAC: 10,
                    enhancement: 0,
                    weight: 1,
                    quantity: 1,
                    type: "light"
                }
            },
            attribute: {
                system: {
                    baseCost: 1,
                    level: 1,
                    description: "",
                    upgrades: []
                }
            },
            defect: {
                system: {
                    basePoints: 1,
                    severity: 0,
                    description: ""
                }
            },
            enhancement: {
                system: {
                    baseBonus: 1,
                    powerCost: 1,
                    description: ""
                }
            },
            limiter: {
                system: {
                    baseReduction: 10,
                    returnRate: 0.5,
                    description: ""
                }
            },
            vehicle: {
                system: {
                    speed: 30,
                    capacity: 5,
                    description: ""
                }
            },
            equipment: {
                system: {
                    weight: 1,
                    quantity: 1,
                    value: 1,
                    description: ""
                }
            }
        };
        return defaults[type];
    }

    /**
     * Validate dice roll formula
     * @private
     */
    _isValidDiceFormula(formula) {
        try {
            new Roll(formula);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Handle specific update cases
     * @private
     */
    async _handleSpecificUpdates(changed) {
        const type = this.type;
        const system = changed.system;

        if (!system) return;

        switch (type) {
            case 'weapon':
                if (system.damage || system.enhancement) {
                    this._updateWeaponDamage(system);
                }
                break;
            case 'armor':
                if (system.baseAC || system.enhancement) {
                    this._updateArmorAC(system);
                }
                break;
        }
    }

    /**
     * Update weapon damage formula
     * @private
     */
    _updateWeaponDamage(system) {
        if (system.damage) {
            system.damageFormula = system.damage + (system.enhancement ? ` + ${system.enhancement}` : '');
        }
    }

    /**
     * Update armor AC
     * @private
     */
    _updateArmorAC(system) {
        if (system.baseAC !== undefined || system.enhancement !== undefined) {
            const baseAC = system.baseAC ?? this.system.baseAC;
            const enhancement = system.enhancement ?? this.system.enhancement;
            system.totalAC = baseAC + enhancement;
        }
    }
} 