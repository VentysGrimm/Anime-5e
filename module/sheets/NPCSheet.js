export class NPCSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "actor", "npc"],
            template: "systems/anime5e/templates/actor/npc-sheet.html",
            width: 720,
            height: 680,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }],
            dragDrop: [{
                dragSelector: ".item-list .item",
                dropSelector: null
            }]
        });
    }

    getData() {
        const data = super.getData();
        data.system = data.actor.system;

        // Add configuration data
        data.config = {
            allegiances: {
                neutral: "Neutral",
                ally: "Ally",
                enemy: "Enemy"
            },
            abilities: CONFIG.ANIME5E.Abilities,
            skills: CONFIG.ANIME5E.Skills
        };

        // Prepare items
        this._prepareItems(data);

        // Calculate ability modifiers
        for (let [key, ability] of Object.entries(data.system.abilities)) {
            ability.mod = Math.floor((ability.value - 10) / 2);
        }

        return data;
    }

    _prepareItems(data) {
        // Categorize items
        const attributes = [];
        const defects = [];
        const weapons = [];
        const armor = [];
        const items = [];

        for (let item of data.actor.items) {
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

        // Assign to data
        data.attributes = attributes;
        data.defects = defects;
        data.equipment = {
            weapons: weapons,
            armor: armor,
            items: items
        };
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add item
        html.find('.item-create').click(this._onItemCreate.bind(this));

        // Edit item
        html.find('.item-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.sheet.render(true);
        });

        // Delete item
        html.find('.item-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".item");
            const item = this.actor.items.get(li.data("itemId"));
            item.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Allegiance change
        html.find('.allegiance-select').change(this._onAllegianceChange.bind(this));

        // Resource value changes
        html.find('.resource-value').change(this._onResourceChange.bind(this));

        // Ability score changes
        html.find('.ability-score').change(this._onAbilityChange.bind(this));
    }

    async _onItemCreate(event) {
        event.preventDefault();
        const header = event.currentTarget;
        const type = header.dataset.type;
        const itemData = {
            name: `New ${type.capitalize()}`,
            type: type
        };
        await Item.create(itemData, {parent: this.actor});
    }

    _onAllegianceChange(event) {
        event.preventDefault();
        const newAllegiance = event.currentTarget.value;
        this.actor.update({"system.allegiance": newAllegiance});

        // Update token border color based on allegiance
        const tokens = this.actor.getActiveTokens();
        const borderColors = {
            neutral: 0x808080, // Gray
            ally: 0x00ff00,    // Green
            enemy: 0xff0000     // Red
        };

        for (let token of tokens) {
            token.update({
                "borderColor": borderColors[newAllegiance]
            });
        }
    }

    _onResourceChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const resource = element.dataset.resource;
        const field = element.dataset.field;
        const value = Number(element.value);

        this.actor.update({
            [`system.attributes.${resource}.${field}`]: value
        });
    }

    _onAbilityChange(event) {
        event.preventDefault();
        const element = event.currentTarget;
        const ability = element.dataset.ability;
        const value = Number(element.value);
        const mod = Math.floor((value - 10) / 2);

        this.actor.update({
            [`system.abilities.${ability}.value`]: value,
            [`system.abilities.${ability}.mod`]: mod
        });
    }
} 