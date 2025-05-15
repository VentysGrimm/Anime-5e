import CharacterCreationWizard from "../apps/CharacterCreationWizard.js";

export class CharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "actor", "character"],
            template: "systems/anime5e/templates/actor/character-sheet.html",
            width: 720,
            height: 680,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "attributes"
            }],
            dragDrop: [{
                dragSelector: ".item-list .item",
                dropSelector: null
            }],
            scrollY: [".sheet-body"]
        });
    }

    /** @override */
    async getData(options={}) {
        const context = await super.getData(options);
        
        // Add the actor's data
        context.actor = this.actor;
        context.system = this.actor.system;
        context.flags = this.actor.flags;
        
        // Add character-specific data
        await this._prepareCharacterItems(context);
        await this._prepareAbilities(context);
        await this._calculatePointBuy(context);

        // Add roll data for TinyMCE editors
        context.rollData = context.actor.getRollData();

        // Add config data
        context.config = CONFIG.ANIME5E;

        // Add owner permissions
        context.isOwner = this.actor.isOwner;
        context.isEditable = this.isEditable;

        return context;
    }

    /** @override */
    async _onDropItem(event, data) {
        if (!this.actor.isOwner) return false;
        
        const item = await Item.implementation.fromDropData(data);
        const itemData = item.toObject();

        // Handle item sorting within the same actor
        if (this.actor.uuid === item.parent?.uuid) {
            return this._onSortItem(event, itemData);
        }

        // Create the owned item
        return this._onDropItemCreate(itemData);
    }

    /** @override */
    async _onDropItemCreate(itemData) {
        itemData = itemData instanceof Array ? itemData : [itemData];
        return this.actor.createEmbeddedDocuments("Item", itemData);
    }

    async _prepareCharacterItems(context) {
        // Initialize containers
        const inventory = [];
        const attributes = [];
        const defects = [];
        const powers = [];

        // Iterate through items, allocating to containers
        for (const item of this.actor.items) {
            item.img = item.img || foundry.CONST.DEFAULT_TOKEN;
            switch (item.type) {
                case 'item':
                    inventory.push(item);
                    break;
                case 'attribute':
                    attributes.push(item);
                    break;
                case 'defect':
                    defects.push(item);
                    break;
                case 'power':
                    powers.push(item);
                    break;
            }
        }

        // Assign to context
        context.inventory = inventory;
        context.attributes = attributes;
        context.defects = defects;
        context.powers = powers;
    }

    _calculatePointBuy(sheetData) {
        const data = sheetData.system;
        
        // Initialize point buy tracking
        data.points = {
            starting: data.points?.starting || 100,
            spent: 0,
            remaining: 0,
            breakdown: {
                abilities: { cost: 0, points: 0 },
                skills: { cost: 0, points: 0 },
                attributes: { cost: 0, points: 0 },
                powers: { cost: 0, points: 0 },
                defects: { cost: 0, points: 0 }
            },
            racial: {
                attributes: 0,
                defects: 0,
                total: 0
            }
        };

        // Calculate costs for each category
        this._calculateAbilityCosts(data);
        this._calculateSkillCosts(data);
        this._calculateAttributeCosts(data);
        this._calculatePowerCosts(data);
        this._calculateDefectRefunds(data);

        // Calculate total points spent
        data.points.spent = Object.values(data.points.breakdown).reduce((total, category) => {
            return total + category.points;
        }, 0);

        // Calculate remaining points
        data.points.remaining = data.points.starting - data.points.spent;
    }

    _calculateAbilityCosts(data) {
        const costs = data.points.breakdown.abilities;
        costs.points = 0;
        
        for (let [key, ability] of Object.entries(data.abilities)) {
            // Cost formula: (value - 10) * 2
            costs.points += Math.max(0, (ability.value - 10) * 2);
        }
        
        costs.cost = costs.points;
    }

    _calculateSkillCosts(data) {
        const costs = data.points.breakdown.skills;
        costs.points = 0;
        
        for (let [key, skill] of Object.entries(data.skills)) {
            // Cost formula: value * 2
            costs.points += skill.value * 2;
        }
        
        costs.cost = costs.points;
    }

    _calculateAttributeCosts(data) {
        const costs = data.points.breakdown.attributes;
        costs.points = 0;
        
        if (data.attributes) {
            for (let attribute of data.attributes) {
                costs.points += attribute.system.cost * attribute.system.rank.value;
            }
        }
        
        costs.cost = costs.points;
    }

    _calculatePowerCosts(data) {
        const costs = data.points.breakdown.powers;
        costs.points = 0;
        
        if (data.powers) {
            for (let power of data.powers) {
                costs.points += power.system.cost;
            }
        }
        
        costs.cost = costs.points;
    }

    _calculateDefectRefunds(data) {
        const costs = data.points.breakdown.defects;
        costs.points = 0;
        
        if (data.defects) {
            for (let defect of data.defects) {
                costs.points += defect.system.refund * defect.system.rank.value;
            }
        }
        
        costs.cost = costs.points;
    }

    /** @override */
    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.isEditable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).closest(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item?.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).closest(".item");
            const item = this.actor.items.get(li.data("itemId"));
            if (item) {
                item.delete();
                li.slideUp(200, () => this.render(false));
            }
        });

        // Add Race
        html.find('.race-select').click(this._onRaceSelect.bind(this));

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));

        // Resource value changes
        html.find('.resource-value').change(this._onResourceChange.bind(this));

        // Handle tab changes
        html.find('.tabs .item').click(this._onTabChange.bind(this));

        // Add wizard launch handler
        html.find('.launch-wizard').click(ev => {
            new CharacterCreationWizard(this.actor).render(true);
        });
    }

    _onRaceSelect(event) {
        event.preventDefault();
        const races = game.items.filter(i => i.type === "race");
        const raceSelectDialog = new Dialog({
            title: "Select Race",
            content: this._getRaceSelectContent(races),
            buttons: {
                select: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Select",
                    callback: html => {
                        const raceId = html.find('select[name="race"]').val();
                        const race = game.items.get(raceId);
                        if (race) {
                            this.actor.createEmbeddedDocuments("Item", [race.toObject()]);
                        }
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            },
            default: "select"
        });
        raceSelectDialog.render(true);
    }

    _getRaceSelectContent(races) {
        let content = '<form><div class="form-group"><label>Race:</label><select name="race">';
        for (let race of races) {
            content += `<option value="${race.id}">${race.name}</option>`;
        }
        content += '</select></div></form>';
        return content;
    }

    async _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            const roll = new Roll(dataset.roll, this.actor.getRollData());
            const label = dataset.label ? `Rolling ${dataset.label}` : '';
            
            // Render the roll
            await roll.evaluate({async: true});
            
            // Create the chat message
            await roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label,
                rollMode: game.settings.get("core", "rollMode")
            });
        }
    }

    _onResourceChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const value = Number(element.value);

        if (dataset.resource) {
            const update = {};
            update[dataset.resource] = value;
            this.actor.update(update);
        }
    }

    _onTabChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const tab = element.dataset.tab;

        // Update active tab
        this.actor.update({"system.activeTab": tab});
    }
} 