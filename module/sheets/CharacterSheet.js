import CharacterCreationWizard from "../apps/CharacterCreationWizard.js";

export default class PlayerCharacterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "actor", "player-character"],
            template: "systems/anime5e/templates/actor/player-character-sheet.html",
            width: 800,
            height: 1000,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "stats"
            }],
            dragDrop: [{
                dragSelector: ".item-list .item",
                dropSelector: null
            }]
        });
    }

    getData() {
        const data = super.getData();
        data.dtypes = ["String", "Number", "Boolean"];

        // Prepare items
        if (this.actor.type == 'character') {
            this._prepareCharacterItems(data);
            this._calculatePointBuy(data);
        }

        return data;
    }

    _prepareCharacterItems(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers
        const inventory = [];
        const attributes = [];
        const defects = [];
        const powers = [];

        // Iterate through items, allocating to containers
        for (let i of sheetData.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === 'item') {
                inventory.push(i);
            }
            else if (i.type === 'attribute') {
                attributes.push(i);
            }
            else if (i.type === 'defect') {
                defects.push(i);
            }
            else if (i.type === 'power') {
                powers.push(i);
            }
        }

        // Assign and return
        actorData.inventory = inventory;
        actorData.attributes = attributes;
        actorData.defects = defects;
        actorData.powers = powers;
    }

    _calculatePointBuy(sheetData) {
        const data = sheetData.actor.system;
        
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

    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Inventory Item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Update Inventory Item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete Inventory Item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.delete();
            li.slideUp(200, () => this.render(false));
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

    _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type,
            data: duplicate(header.dataset)
        };
        delete itemData.data["type"];
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
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

    _onRoll(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;

        if (dataset.roll) {
            let roll = new Roll(dataset.roll, this.actor.getRollData());
            let label = dataset.label ? `Rolling ${dataset.label}` : '';
            roll.toMessage({
                speaker: ChatMessage.getSpeaker({ actor: this.actor }),
                flavor: label
            });
        }
    }

    _onResourceChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const dataset = element.dataset;
        const value = Number(element.value);

        if (dataset.resource) {
            let update = {};
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