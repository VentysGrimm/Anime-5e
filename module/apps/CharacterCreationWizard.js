export default class CharacterCreationWizard extends FormApplication {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["anime5e", "character-wizard"],
            template: "systems/anime5e/templates/apps/character-wizard.html",
            width: 600,
            height: 800,
            title: game.i18n.localize("ANIME5E.CharacterWizard"),
            closeOnSubmit: false,
            tabs: [{
                navSelector: ".wizard-tabs",
                contentSelector: ".wizard-body",
                initial: "basics"
            }],
            scrollY: ["form"]
        });
    }

    constructor(actor = null, options = {}) {
        super(options);
        this.actor = actor;
        this.step = 1;
        this.maxSteps = 6;
        this.data = {
            basics: {
                name: "",
                playerName: "",
                background: ""
            },
            race: null,
            class: {
                name: "",
                level: 1
            },
            abilities: {
                str: 10,
                dex: 10,
                con: 10,
                int: 10,
                wis: 10,
                cha: 10
            },
            attributes: [],
            defects: [],
            powers: [],
            pointBuy: {
                starting: 100,
                spent: 0,
                remaining: 100
            }
        };
    }

    async getData(options={}) {
        const context = await super.getData(options);
        
        // Add wizard data
        context.step = this.step;
        context.maxSteps = this.maxSteps;
        context.data = this.data;
        
        // Add available items
        context.races = game.items.filter(i => i.type === "race").map(i => i.toObject());
        context.classes = CONFIG.ANIME5E.characterClasses;
        
        // Add step information
        context.isLastStep = this.step === this.maxSteps;
        
        // Add config data
        context.config = CONFIG.ANIME5E;

        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Navigation buttons
        html.find(".wizard-nav button").click(this._onNavigate.bind(this));

        // Point buy inputs
        html.find(".ability-score input").change(this._onAbilityChange.bind(this));
        html.find(".attribute-select").change(this._onAttributeChange.bind(this));
        html.find(".defect-select").change(this._onDefectChange.bind(this));
        html.find(".power-select").change(this._onPowerChange.bind(this));

        // Race selection
        html.find(".race-select").change(this._onRaceSelect.bind(this));

        // Class selection
        html.find(".class-select").change(this._onClassSelect.bind(this));

        // Delete buttons
        html.find(".item-delete").click(this._onItemDelete.bind(this));
    }

    async _updateObject(event, formData) {
        event.preventDefault();
        
        // Update the data based on form values
        this.data = foundry.utils.mergeObject(this.data, formData);

        if (this.step === this.maxSteps) {
            await this._createCharacter();
        } else {
            this.step++;
            this.render(true);
        }
    }

    async _createCharacter() {
        try {
            // Create base actor
            const actorData = {
                name: this.data.basics.name,
                type: "character",
                system: {
                    player: this.data.basics.playerName,
                    background: this.data.basics.background,
                    class: this.data.class.name,
                    level: this.data.class.level,
                    abilities: foundry.utils.deepClone(this.data.abilities),
                    points: {
                        starting: this.data.pointBuy.starting,
                        spent: this.data.pointBuy.spent,
                        remaining: this.data.pointBuy.remaining
                    }
                }
            };

            const actor = await Actor.create(actorData);

            // Add items in sequence
            if (this.data.race) {
                await actor.createEmbeddedDocuments("Item", [this.data.race]);
            }

            const itemsToCreate = [
                ...this.data.attributes,
                ...this.data.defects,
                ...this.data.powers
            ].filter(i => i);

            if (itemsToCreate.length) {
                await actor.createEmbeddedDocuments("Item", itemsToCreate);
            }

            // Close wizard and open character sheet
            this.close();
            actor.sheet.render(true);

            // Show success notification
            ui.notifications.info(game.i18n.format("ANIME5E.CharacterCreated", {name: this.data.basics.name}));

        } catch (error) {
            console.error("Character Creation Error:", error);
            ui.notifications.error(game.i18n.localize("ANIME5E.CharacterCreationError"));
        }
    }

    _onNavigate(event) {
        event.preventDefault();
        const direction = event.currentTarget.dataset.direction;
        
        if (direction === "next" && this.step < this.maxSteps) {
            this.step++;
        } else if (direction === "prev" && this.step > 1) {
            this.step--;
        }
        
        this.render(true);
    }

    _onAbilityChange(event) {
        const ability = event.currentTarget.dataset.ability;
        const value = Math.clamped(parseInt(event.currentTarget.value), 8, 18);
        this.data.abilities[ability] = value;
        this._updatePointBuy();
        this.render(false);
    }

    async _onAttributeChange(event) {
        const attributeId = event.currentTarget.value;
        const attribute = game.items.get(attributeId);
        if (attribute) {
            this.data.attributes.push(attribute.toObject());
            this._updatePointBuy();
            this.render(false);
        }
    }

    async _onDefectChange(event) {
        const defectId = event.currentTarget.value;
        const defect = game.items.get(defectId);
        if (defect) {
            this.data.defects.push(defect.toObject());
            this._updatePointBuy();
            this.render(false);
        }
    }

    async _onPowerChange(event) {
        const powerId = event.currentTarget.value;
        const power = game.items.get(powerId);
        if (power) {
            this.data.powers.push(power.toObject());
            this._updatePointBuy();
            this.render(false);
        }
    }

    async _onRaceSelect(event) {
        const raceId = event.currentTarget.value;
        const race = game.items.get(raceId);
        if (race) {
            this.data.race = race.toObject();
            this._updatePointBuy();
            this.render(false);
        }
    }

    _onClassSelect(event) {
        const className = event.currentTarget.value;
        this.data.class.name = className;
        this.render(false);
    }

    _onItemDelete(event) {
        event.preventDefault();
        const itemType = event.currentTarget.dataset.type;
        const itemIndex = parseInt(event.currentTarget.dataset.index);

        switch (itemType) {
            case "attribute":
                this.data.attributes.splice(itemIndex, 1);
                break;
            case "defect":
                this.data.defects.splice(itemIndex, 1);
                break;
            case "power":
                this.data.powers.splice(itemIndex, 1);
                break;
        }

        this._updatePointBuy();
        this.render(false);
    }

    _updatePointBuy() {
        let spent = 0;

        // Calculate ability score costs
        Object.values(this.data.abilities).forEach(value => {
            spent += Math.max(0, (value - 10) * 2);
        });

        // Add attribute costs
        this.data.attributes.forEach(attr => {
            spent += attr.system.cost * attr.system.rank.value;
        });

        // Add power costs
        this.data.powers.forEach(power => {
            spent += power.system.cost;
        });

        // Subtract defect refunds
        this.data.defects.forEach(defect => {
            spent -= defect.system.refund * defect.system.rank.value;
        });

        // Update point buy data
        this.data.pointBuy.spent = spent;
        this.data.pointBuy.remaining = this.data.pointBuy.starting - spent;
    }
} 