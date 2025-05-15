import { AnimeItemData } from "../data/item.js";

/**
 * Extend the base Item document
 * @extends {Item}
 */
export class AnimeItem extends Item {

    /** @override */
    static defineSchema() {
        return AnimeItemData;
    }

    /** @override */
    prepareData() {
        super.prepareData();

        // Get the Item's data
        const itemData = this.system;
        const actorData = this.actor ? this.actor.system : null;
        const flags = this.flags.anime5e || {};

        // Handle common item properties
        this._prepareCommonData(itemData);

        // Handle type-specific item properties
        switch (this.type) {
            case "weapon":
                this._prepareWeaponData(itemData, actorData);
                break;
            case "armor":
                this._prepareArmorData(itemData, actorData);
                break;
            case "attribute":
                this._prepareAttributeData(itemData, actorData);
                break;
            case "defect":
                this._prepareDefectData(itemData, actorData);
                break;
            case "enhancement":
                this._prepareEnhancementData(itemData, actorData);
                break;
            case "limiter":
                this._prepareLimiterData(itemData, actorData);
                break;
            case "power":
                this._preparePowerData(itemData, actorData);
                break;
            case "race":
                this._prepareRaceData(itemData, actorData);
                break;
        }
    }

    /**
     * Prepare common item data
     * @private
     */
    _prepareCommonData(itemData) {
        if (!itemData) return;

        // Handle weight and cost calculations
        itemData.totalWeight = itemData.weight * itemData.quantity;
        itemData.totalCost = itemData.cost * itemData.quantity;
    }

    /**
     * Prepare weapon-specific item data
     * @private
     */
    _prepareWeaponData(itemData, actorData) {
        if (!itemData) return;

        // Handle weapon-specific calculations
        if (itemData.weaponType === "ranged") {
            itemData.shortRange = itemData.range;
            itemData.longRange = itemData.range * 3;
        }
    }

    /**
     * Prepare armor-specific item data
     * @private
     */
    _prepareArmorData(itemData, actorData) {
        if (!itemData) return;

        // Handle armor-specific calculations
        if (itemData.armorType === "shield") {
            itemData.acBonus = 2;
        }
    }

    /**
     * Prepare attribute-specific item data
     * @private
     */
    _prepareAttributeData(itemData, actorData) {
        if (!itemData) return;

        // Handle attribute-specific calculations
        itemData.totalCost = itemData.cost * itemData.rank.value;
    }

    /**
     * Prepare defect-specific item data
     * @private
     */
    _prepareDefectData(itemData, actorData) {
        if (!itemData) return;

        // Handle defect-specific calculations
        itemData.totalRefund = itemData.refund * itemData.rank.value;
    }

    /**
     * Prepare enhancement-specific item data
     * @private
     */
    _prepareEnhancementData(itemData, actorData) {
        if (!itemData) return;

        // Handle enhancement-specific calculations
    }

    /**
     * Prepare limiter-specific item data
     * @private
     */
    _prepareLimiterData(itemData, actorData) {
        if (!itemData) return;

        // Handle limiter-specific calculations
    }

    /**
     * Prepare power-specific item data
     * @private
     */
    _preparePowerData(itemData, actorData) {
        if (!itemData) return;

        // Handle power-specific calculations
        if (actorData?.level) {
            itemData.scaledMPCost = itemData.mpCost * Math.ceil(actorData.level / 5);
        }
    }

    /**
     * Prepare race-specific item data
     * @private
     */
    _prepareRaceData(itemData, actorData) {
        if (!itemData) return;

        // Handle race-specific calculations
    }

    /** @override */
    getRollData() {
        const data = super.getRollData();
        
        // Add the item's actor's data to the roll data
        if (this.actor) {
            data.actor = this.actor.getRollData();
        }

        // Add item-specific roll data
        data.item = foundry.utils.deepClone(this.system);

        return data;
    }
} 