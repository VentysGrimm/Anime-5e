import { AnimeActorData } from "../data/actor.js";

/**
 * Extend the base Actor document
 * @extends {Actor}
 */
export class AnimeActor extends Actor {

    /** @override */
    static defineSchema() {
        return AnimeActorData;
    }

    /** @override */
    prepareData() {
        super.prepareData();

        const actorData = this.system;
        const flags = this.flags.anime5e || {};

        // Make separate methods for each Actor type (player, npc, monster)
        this._prepareBaseData();
        this._prepareDerivedData();

        // Call type-specific preparation methods
        switch (this.type) {
            case "player":
                this._preparePlayerData(actorData);
                break;
            case "npc":
                this._prepareNPCData(actorData);
                break;
            case "monster":
                this._prepareMonsterData(actorData);
                break;
        }
    }

    /**
     * Prepare base data that's common to all actor types
     * @private
     */
    _prepareBaseData() {
        const system = this.system;

        // Calculate ability modifiers
        for (let [key, ability] of Object.entries(system.abilities)) {
            ability.mod = Math.floor((ability.value - 10) / 2);
        }

        // Calculate base AC
        if (system.attributes?.ac) {
            const ac = system.attributes.ac;
            ac.value = ac.base + (system.abilities?.dexterity?.mod || 0);
        }
    }

    /**
     * Prepare data that requires items or effects to be processed
     * @private
     */
    _prepareDerivedData() {
        const system = this.system;

        // Process active effects
        this.effects.forEach(e => e.apply(this));

        // Process equipped items
        this.items.forEach(item => {
            if (item.type === "armor" && item.system.equipped) {
                this._applyArmorToAC(item);
            }
        });
    }

    /**
     * Prepare Player type specific data
     */
    _preparePlayerData(actorData) {
        if (!actorData) return;

        // Calculate level from experience
        actorData.level = actorData.experience ? Math.floor(actorData.experience / 1000) + 1 : 1;

        // Calculate HP
        if (actorData.attributes?.hp) {
            const hp = actorData.attributes.hp;
            hp.max = hp.base + (actorData.abilities?.constitution?.mod || 0) * actorData.level;
        }

        // Calculate MP
        if (actorData.attributes?.mp) {
            const mp = actorData.attributes.mp;
            mp.max = mp.base + (actorData.abilities?.wisdom?.mod || 0) * actorData.level;
        }
    }

    /**
     * Prepare NPC type specific data
     */
    _prepareNPCData(actorData) {
        if (!actorData) return;

        // Add NPC-specific calculations here
        if (actorData.attributes?.hp) {
            const hp = actorData.attributes.hp;
            hp.max = hp.base + (actorData.abilities?.constitution?.mod || 0);
        }
    }

    /**
     * Prepare Monster type specific data
     */
    _prepareMonsterData(actorData) {
        if (!actorData) return;

        // Add monster-specific calculations here
        if (actorData.cr) {
            actorData.proficiencyBonus = Math.max(2, Math.floor(actorData.cr / 4) + 2);
        }
    }

    /**
     * Apply armor item effects to AC
     * @param {Item} item The armor item being worn
     * @private
     */
    _applyArmorToAC(item) {
        const system = this.system;
        const armorData = item.system;

        if (!system.attributes?.ac || !armorData.ac) return;

        const ac = system.attributes.ac;
        const dexMod = system.abilities?.dexterity?.mod || 0;

        // Calculate AC based on armor type
        if (armorData.type === "light") {
            ac.value = armorData.ac + dexMod;
        } else if (armorData.type === "medium") {
            ac.value = armorData.ac + Math.min(dexMod, 2);
        } else if (armorData.type === "heavy") {
            ac.value = armorData.ac;
        } else if (armorData.type === "shield") {
            ac.value += 2; // Shield bonus
        }

        // Apply any bonus AC
        ac.value += armorData.bonus || 0;
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
        if (this.type === "player" || this.type === "npc") {
            data.prof = Math.floor((data.level + 7) / 4);
        } else if (this.type === "monster") {
            data.prof = this.system.proficiencyBonus;
        }

        return data;
    }
} 