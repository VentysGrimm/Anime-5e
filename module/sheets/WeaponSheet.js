export class WeaponSheet extends ItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "item", "weapon"],
            template: "systems/anime5e/templates/item/weapon-sheet.html",
            width: 520,
            height: 480,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }],
            dragDrop: [{
                dragSelector: ".enhancement-list .item, .limiter-list .item",
                dropSelector: null
            }],
            filters: [{
                inputSelector: ".filter-input",
                contentSelector: ".filterable-list"
            }]
        });
    }

    async getData(options={}) {
        const context = await super.getData(options);
        
        // Add the item's data
        context.item = this.item;
        context.system = this.item.system;
        context.flags = this.item.flags;
        
        // Add weapon-specific data
        await this._prepareWeaponData(context);
        
        // Add roll data for TinyMCE editors
        context.rollData = this.item.getRollData();

        // Add config data
        context.config = CONFIG.ANIME5E;
        
        // Add owner permissions
        context.isOwner = this.item.isOwner;
        context.isEditable = this.isEditable;
        
        return context;
    }

    async _onDropItem(event, data) {
        if (!this.item.isOwner) return false;

        // Get the item from the drag data
        const item = await Item.implementation.fromDropData(data);
        if (!item) return;

        // Validate item type is allowed
        if (!this._validateItemType(item)) {
            ui.notifications.warn(game.i18n.format("ANIME5E.InvalidItemType", {type: item.type}));
            return false;
        }

        // Handle item drop
        return super._onDropItem(event, data);
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Enhancement/Limiter
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Enhancement/Limiter
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.item.items.get(li.data("itemId"));
            if (item) item.sheet.render(true);
        });

        // Delete Enhancement/Limiter
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.item.items.get(li.data("itemId"));
            if (item) {
                new Dialog({
                    title: game.i18n.localize("ANIME5E.DeleteItemTitle"),
                    content: game.i18n.format("ANIME5E.DeleteItemContent", {name: item.name}),
                    buttons: {
                        delete: {
                            icon: '<i class="fas fa-trash"></i>',
                            label: game.i18n.localize("Delete"),
                            callback: () => {
                                item.delete();
                                li.slideUp(200, () => this.render(false));
                            }
                        },
                        cancel: {
                            icon: '<i class="fas fa-times"></i>',
                            label: game.i18n.localize("Cancel")
                        }
                    },
                    default: "cancel"
                }).render(true);
            }
        });

        // Handle damage formula input
        html.find('.damage-formula').change(this._onDamageFormulaChange.bind(this));

        // Handle weapon property toggles
        html.find('.weapon-property').click(this._onWeaponPropertyToggle.bind(this));
    }

    async _validateItemType(item) {
        const allowedTypes = new Set(['enhancement', 'limiter']);
        return allowedTypes.has(item.type);
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;

        // Validate item type
        if (!this._validateItemType({type})) {
            ui.notifications.warn(game.i18n.format("ANIME5E.InvalidItemType", {type}));
            return;
        }

        // Create the item
        const itemData = {
            name: game.i18n.format("ANIME5E.ItemNew", { type: type.capitalize() }),
            type: type,
            system: foundry.utils.deepClone(header.dataset)
        };
        delete itemData.system.type;

        try {
            await Item.create(itemData, {parent: this.item});
        } catch (error) {
            console.error("Failed to create item:", error);
            ui.notifications.error(game.i18n.localize("ANIME5E.ItemCreationError"));
        }
    }

    async _onDamageFormulaChange(event) {
        event.preventDefault();
        const formula = event.currentTarget.value;

        // Validate the damage formula
        try {
            const roll = new Roll(formula);
            await roll.evaluate({async: true});
            
            await this.item.update({
                "system.damage.formula": formula
            });
        } catch (error) {
            console.error("Invalid damage formula:", error);
            ui.notifications.error(game.i18n.localize("ANIME5E.InvalidDamageFormula"));
        }
    }

    async _onWeaponPropertyToggle(event) {
        event.preventDefault();
        const property = event.currentTarget.dataset.property;
        const isActive = this.item.system.properties[property] || false;

        try {
            await this.item.update({
                [`system.properties.${property}`]: !isActive
            });
        } catch (error) {
            console.error("Failed to toggle weapon property:", error);
            ui.notifications.error(game.i18n.localize("ANIME5E.PropertyToggleError"));
        }
    }

    async _prepareWeaponData(context) {
        // Add weapon properties
        context.weaponProperties = CONFIG.ANIME5E.weaponProperties;
        
        // Add weapon types
        context.weaponTypes = CONFIG.ANIME5E.weaponTypes;
        
        // Add weapon ranges
        context.weaponRanges = CONFIG.ANIME5E.weaponRanges;
        
        // Add damage types
        context.damageTypes = CONFIG.ANIME5E.damageTypes;
        
        // Prepare enhancements and limiters
        const enhancements = this.item.items.filter(i => i.type === "enhancement");
        const limiters = this.item.items.filter(i => i.type === "limiter");
        
        context.enhancements = enhancements.map(e => e.toObject(false));
        context.limiters = limiters.map(l => l.toObject(false));
        
        // Calculate total enhancement bonus
        context.totalEnhancementBonus = enhancements.reduce((sum, e) => sum + (e.system.bonus || 0), 0);
        
        // Calculate total limiter penalty
        context.totalLimiterPenalty = limiters.reduce((sum, l) => sum + (l.system.penalty || 0), 0);
    }
} 