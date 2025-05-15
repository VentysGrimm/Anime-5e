export class NPCSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "actor", "npc"],
            template: "systems/anime5e/templates/actor/npc-sheet.html",
            width: 600,
            height: 680,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }],
            dragDrop: [{
                dragSelector: ".item-list .item",
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
        
        // Add the actor's data
        context.actor = this.actor;
        context.system = this.actor.system;
        context.flags = this.actor.flags;

        // Add NPC-specific data
        if (this.actor.type === 'npc') {
            await this._prepareNPCItems(context);
            await this._prepareAbilities(context);
        }

        // Add roll data for TinyMCE editors
        context.rollData = this.actor.getRollData();

        // Add config data
        context.config = CONFIG.ANIME5E;

        // Add owner permissions
        context.isOwner = this.actor.isOwner;
        context.isEditable = this.isEditable;

        return context;
    }

    async _prepareItems(context) {
        // Categorize items
        const attributes = [];
        const defects = [];
        const weapons = [];
        const armor = [];
        const items = [];

        // Iterate through items, allocating to containers
        for (const item of this.actor.items) {
            item.img = item.img || foundry.CONST.DEFAULT_TOKEN;
            switch (item.type) {
                case 'attribute':
                    attributes.push(item);
                    break;
                case 'defect':
                    defects.push(item);
                    break;
                case 'weapon':
                    weapons.push(item);
                    break;
                case 'armor':
                    armor.push(item);
                    break;
                default:
                    items.push(item);
            }
        }

        // Assign to context
        context.attributes = attributes;
        context.defects = defects;
        context.equipment = {
            weapons: weapons,
            armor: armor,
            items: items
        };
    }

    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;

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

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            if (item) item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
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

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));
    }

    /**
     * Validate that an item type is allowed to be added to this actor
     * @param {Item} item - The item to validate
     * @returns {boolean} - Whether the item type is valid
     * @private
     */
    _validateItemType(item) {
        const allowedTypes = new Set([
            'weapon', 'armor', 'attribute', 'power'
        ]);
        return allowedTypes.has(item.type);
    }

    /**
     * Handle creating a new Owned Item for the actor
     * @param {Event} event - The originating click event
     * @private
     */
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
            await Item.create(itemData, {parent: this.actor});
        } catch (error) {
            console.error("Failed to create item:", error);
            ui.notifications.error(game.i18n.localize("ANIME5E.ItemCreationError"));
        }
    }

    /**
     * Handle clickable rolls
     * @param {Event} event - The originating click event
     * @private
     */
    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            try {
                const roll = new Roll(dataset.roll, this.actor.getRollData());
                const label = dataset.label ? `Rolling ${dataset.label}` : '';
                
                await roll.evaluate({async: true});
                
                await roll.toMessage({
                    speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                    flavor: label,
                    rollMode: game.settings.get("core", "rollMode")
                });
            } catch (error) {
                console.error("Roll failed:", error);
                ui.notifications.error(game.i18n.localize("ANIME5E.RollError"));
            }
        }
    }
} 