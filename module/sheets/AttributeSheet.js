export class AttributeSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "item", "attribute"],
            template: "systems/anime5e/templates/item/attribute-sheet.html",
            width: 520,
            height: 480,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }]
        });
    }

    getData() {
        const data = super.getData();
        data.system = data.item.system;
        
        // Add config data for dropdowns
        data.config = {
            attributeCategories: CONFIG.ANIME5E.CharacterAttributes.Types
        };
        
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Prerequisites management
        html.find('.add-prereq').click(this._onAddPrerequisite.bind(this));
        html.find('.remove-prereq').click(this._onRemovePrerequisite.bind(this));

        // Effects management
        html.find('.add-effect').click(this._onAddEffect.bind(this));
        html.find('.remove-effect').click(this._onRemoveEffect.bind(this));

        // Handle input changes
        html.find('input[type="text"]').change(this._onEntryChange.bind(this));
    }

    async _onAddPrerequisite(event) {
        event.preventDefault();
        const prerequisites = duplicate(this.item.system.requirements.prerequisites || []);
        prerequisites.push("");
        await this.item.update({ "system.requirements.prerequisites": prerequisites });
    }

    async _onRemovePrerequisite(event) {
        event.preventDefault();
        const prereqId = event.currentTarget.dataset.prereqId;
        const prerequisites = duplicate(this.item.system.requirements.prerequisites);
        prerequisites.splice(prereqId, 1);
        await this.item.update({ "system.requirements.prerequisites": prerequisites });
    }

    async _onAddEffect(event) {
        event.preventDefault();
        const effects = duplicate(this.item.system.effects || []);
        effects.push("");
        await this.item.update({ "system.effects": effects });
    }

    async _onRemoveEffect(event) {
        event.preventDefault();
        const effectId = event.currentTarget.dataset.effectId;
        const effects = duplicate(this.item.system.effects);
        effects.splice(effectId, 1);
        await this.item.update({ "system.effects": effects });
    }

    _onEntryChange(event) {
        const input = event.currentTarget;
        const field = input.dataset.field;
        const value = input.value;

        if (input.dataset.prereqId !== undefined) {
            const prerequisites = duplicate(this.item.system.requirements.prerequisites);
            prerequisites[input.dataset.prereqId] = value;
            this.item.update({ "system.requirements.prerequisites": prerequisites });
        } else if (input.dataset.effectId !== undefined) {
            const effects = duplicate(this.item.system.effects);
            effects[input.dataset.effectId] = value;
            this.item.update({ "system.effects": effects });
        }
    }
} 