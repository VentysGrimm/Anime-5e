export default class MonsterSheet extends ActorSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "actor", "monster"],
            template: "systems/anime5e/templates/actor/monster-sheet.html",
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
        if (this.actor.type == 'monster') {
            this._prepareMonsterData(data);
        }

        return data;
    }

    _prepareMonsterData(sheetData) {
        const actorData = sheetData.actor;

        // Initialize containers
        const features = [];
        const attacks = [];
        const spells = [];

        // Iterate through items, allocating to containers
        for (let i of sheetData.items) {
            i.img = i.img || DEFAULT_TOKEN;
            if (i.type === 'feature') {
                features.push(i);
            }
            else if (i.type === 'attack') {
                attacks.push(i);
            }
            else if (i.type === 'spell') {
                spells.push(i);
            }
        }

        // Assign and return
        actorData.features = features;
        actorData.attacks = attacks;
        actorData.spells = spells;

        // Calculate CR and XP
        this._calculateChallengeRating(actorData);
    }

    _calculateChallengeRating(actorData) {
        const cr = actorData.system.cr;
        const xpTable = {
            0: 0,
            0.125: 25,
            0.25: 50,
            0.5: 100,
            1: 200,
            2: 450,
            3: 700,
            4: 1100,
            5: 1800,
            6: 2300,
            7: 2900,
            8: 3900,
            9: 5000,
            10: 5900
        };
        actorData.system.xp = xpTable[cr] || 0;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Everything below here is only needed if the sheet is editable
        if (!this.options.editable) return;

        // Add Feature
        html.find('.add-feature').click(this._onAddFeature.bind(this));

        // Add Attack
        html.find('.add-attack').click(this._onAddAttack.bind(this));

        // Add Spell
        html.find('.add-spell').click(this._onAddSpell.bind(this));

        // Edit controls
        html.find('.feature-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".feature-item");
            const feature = this.actor.items.get(li.data("featureId"));
            feature.sheet.render(true);
        });

        html.find('.attack-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".attack-item");
            const attack = this.actor.items.get(li.data("attackId"));
            attack.sheet.render(true);
        });

        html.find('.spell-edit').click(ev => {
            const li = $(ev.currentTarget).parents(".spell-item");
            const spell = this.actor.items.get(li.data("spellId"));
            spell.sheet.render(true);
        });

        // Delete controls
        html.find('.feature-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".feature-item");
            const feature = this.actor.items.get(li.data("featureId"));
            feature.delete();
            li.slideUp(200, () => this.render(false));
        });

        html.find('.attack-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".attack-item");
            const attack = this.actor.items.get(li.data("attackId"));
            attack.delete();
            li.slideUp(200, () => this.render(false));
        });

        html.find('.spell-delete').click(ev => {
            const li = $(ev.currentTarget).parents(".spell-item");
            const spell = this.actor.items.get(li.data("spellId"));
            spell.delete();
            li.slideUp(200, () => this.render(false));
        });

        // Rollable abilities
        html.find('.rollable').click(this._onRoll.bind(this));

        // Handle allegiance changes
        html.find('select[name="system.allegiance"]').change(this._onAllegianceChange.bind(this));
    }

    _onAddFeature(event) {
        event.preventDefault();
        const itemData = {
            name: "New Feature",
            type: "feature"
        };
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    _onAddAttack(event) {
        event.preventDefault();
        const itemData = {
            name: "New Attack",
            type: "attack",
            system: {
                bonus: 0,
                damage: "1d6",
                type: "slashing"
            }
        };
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
    }

    _onAddSpell(event) {
        event.preventDefault();
        const itemData = {
            name: "New Spell",
            type: "spell",
            system: {
                mpCost: 1,
                range: "30 feet",
                duration: "Instantaneous"
            }
        };
        return this.actor.createEmbeddedDocuments("Item", [itemData]);
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

    _onAllegianceChange(event) {
        event.preventDefault();
        const allegiance = event.target.value;
        
        // Update token border color based on allegiance
        const borderColors = {
            hostile: 0xff0000,    // Red
            neutral: 0xffff00,    // Yellow
            friendly: 0x00ff00    // Green
        };

        // Update all tokens linked to this actor
        const tokens = this.actor.getActiveTokens();
        tokens.forEach(token => {
            token.update({
                "borderColor": borderColors[allegiance]
            });
        });
    }
} 