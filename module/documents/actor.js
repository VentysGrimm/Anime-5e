export class Anime5eActor extends Actor {
    prepareData() {
        super.prepareData();

        const actorData = this.data;
        const data = actorData.data;
        const flags = actorData.flags;

        // Make separate methods for each Actor type (character, npc, etc.)
        if (actorData.type === 'character') this._prepareCharacterData(actorData);
    }

    /** @override */
    async _preCreate(data, options, user) {
        await super._preCreate(data, options, user);
        // Any pre-creation initialization
    }

    /** @override */
    async _preUpdate(changed, options, user) {
        await super._preUpdate(changed, options, user);

        // Handle race changes
        if (changed.system?.race) {
            const oldRace = this.system.race;
            const newRace = changed.system.race;

            if (oldRace) {
                // Remove old racial traits
                await this._removeRacialTraits(oldRace);
            }

            if (newRace) {
                // Add new racial traits
                await this._addRacialTraits(newRace);
            }
        }
    }

    /**
     * Remove racial traits (attributes and defects) from the character
     * @private
     */
    async _removeRacialTraits(race) {
        if (!race.system?.traits) return;

        const itemsToRemove = [];
        
        // Find items that were added by the race
        for (let item of this.items) {
            if (item.getFlag('anime5e', 'racialTrait')) {
                itemsToRemove.push(item.id);
            }
        }

        // Remove the items
        if (itemsToRemove.length > 0) {
            await this.deleteEmbeddedDocuments('Item', itemsToRemove);
        }
    }

    /**
     * Add racial traits (attributes and defects) to the character
     * @private
     */
    async _addRacialTraits(race) {
        if (!race.system?.traits) return;

        const itemsToAdd = [];

        // Add attributes
        for (let attribute of race.system.traits.attributes) {
            const newAttribute = duplicate(attribute);
            newAttribute.flags = newAttribute.flags || {};
            newAttribute.flags.anime5e = { racialTrait: true };
            itemsToAdd.push(newAttribute);
        }

        // Add defects
        for (let defect of race.system.traits.defects) {
            const newDefect = duplicate(defect);
            newDefect.flags = newDefect.flags || {};
            newDefect.flags.anime5e = { racialTrait: true };
            itemsToAdd.push(newDefect);
        }

        // Create the items
        if (itemsToAdd.length > 0) {
            await this.createEmbeddedDocuments('Item', itemsToAdd);
        }
    }

    _prepareCharacterData(actorData) {
        const data = actorData.data;

        // Calculate level
        const level = Math.max(1, data.attributes.level.value ?? 1);

        // Calculate modifiers from ability scores
        for (let [key, ability] of Object.entries(data.abilities)) {
            ability.mod = Math.floor((ability.value - 10) / 2);
        }

        // Calculate HP
        const hp = {
            max: data.attributes.hp.base + (data.abilities.con.mod * level),
            value: data.attributes.hp.value
        };
        data.attributes.hp = {...data.attributes.hp, ...hp};

        // Calculate MP
        const mp = {
            max: data.attributes.mp.base + (data.abilities.wis.mod * level),
            value: data.attributes.mp.value
        };
        data.attributes.mp = {...data.attributes.mp, ...mp};

        // Calculate initiative
        data.attributes.init.mod = data.abilities.dex.mod;

        // Calculate armor class
        data.attributes.ac.value = 10 + data.abilities.dex.mod;

        // Calculate racial trait points
        this._calculateRacialTraitPoints(actorData);
    }

    /**
     * Calculate points from racial traits
     * @private
     */
    _calculateRacialTraitPoints(actorData) {
        const data = actorData.data;
        let racialAttributePoints = 0;
        let racialDefectPoints = 0;

        // Calculate points from racial traits
        for (let item of this.items) {
            if (item.getFlag('anime5e', 'racialTrait')) {
                if (item.type === 'attribute') {
                    racialAttributePoints += item.system.cost * item.system.rank.value;
                } else if (item.type === 'defect') {
                    racialDefectPoints += item.system.refund * item.system.rank.value;
                }
            }
        }

        // Store the calculated points
        data.points.racial = {
            attributes: racialAttributePoints,
            defects: racialDefectPoints
        };
    }

    getRollData() {
        const data = super.getRollData();
        
        // Add level for easier access
        data.level = this.data.data.attributes.level.value ?? 1;
        
        return data;
    }
} 