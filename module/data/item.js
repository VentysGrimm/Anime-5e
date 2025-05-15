/**
 * Data definition for Item documents
 */
export class AnimeItemData extends foundry.abstract.TypeDataModel {
    /** @inheritdoc */
    static defineSchema() {
        const fields = foundry.data.fields;
        return {
            description: new fields.HTMLField(),
            source: new fields.StringField(),
            // Common fields
            weight: new fields.NumberField({initial: 0, min: 0}),
            cost: new fields.NumberField({initial: 0}),
            quantity: new fields.NumberField({initial: 1, min: 0}),
            // Weapon fields
            weaponType: new fields.StringField(),
            damage: new fields.StringField(),
            damageType: new fields.StringField(),
            range: new fields.NumberField({initial: 5}),
            properties: new fields.ArrayField(new fields.StringField()),
            // Armor fields
            armorType: new fields.StringField(),
            ac: new fields.NumberField({initial: 10}),
            dexBonus: new fields.BooleanField(),
            maxDexBonus: new fields.NumberField(),
            strengthRequired: new fields.NumberField(),
            stealthDisadvantage: new fields.BooleanField(),
            // Attribute fields
            rank: new fields.SchemaField({
                value: new fields.NumberField({initial: 1, min: 1}),
                max: new fields.NumberField({initial: 5, min: 1})
            }),
            // Power fields
            powerType: new fields.StringField(),
            powerSource: new fields.StringField(),
            mpCost: new fields.NumberField({initial: 1, min: 0}),
            duration: new fields.StringField(),
            // Vehicle fields
            vehicleType: new fields.StringField(),
            speed: new fields.NumberField({initial: 30}),
            capacity: new fields.NumberField({initial: 1}),
            // Race fields
            size: new fields.StringField({initial: "medium"}),
            traits: new fields.ArrayField(new fields.StringField()),
            languages: new fields.ArrayField(new fields.StringField()),
            // Enhancement/Limiter fields
            effect: new fields.HTMLField(),
            requirements: new fields.StringField(),
            // Custom item flag
            isCustom: new fields.BooleanField()
        };
    }

    /** @inheritdoc */
    static migrateData(source) {
        // Handle data migration when needed
        return source;
    }

    /** @inheritdoc */
    static validateData(source) {
        // Validate data integrity
        return true;
    }

    /**
     * Prepare derived data for items
     */
    prepareDerivedData() {
        super.prepareDerivedData();

        // Handle type-specific preparations
        switch (this.type) {
            case "weapon":
                this._prepareWeaponData();
                break;
            case "armor":
                this._prepareArmorData();
                break;
            case "attribute":
                this._prepareAttributeData();
                break;
            case "power":
                this._preparePowerData();
                break;
        }
    }

    /**
     * Prepare weapon-specific data
     * @private
     */
    _prepareWeaponData() {
        if (!this.system.damage) return;
        // Add weapon-specific calculations here
    }

    /**
     * Prepare armor-specific data
     * @private
     */
    _prepareArmorData() {
        if (!this.system.ac) return;
        // Add armor-specific calculations here
    }

    /**
     * Prepare attribute-specific data
     * @private
     */
    _prepareAttributeData() {
        if (!this.system.rank) return;
        // Add attribute-specific calculations here
    }

    /**
     * Prepare power-specific data
     * @private
     */
    _preparePowerData() {
        if (!this.system.mpCost) return;
        // Add power-specific calculations here
    }
} 