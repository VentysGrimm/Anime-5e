export class DefectSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "item", "defect"],
            template: "systems/anime5e/templates/item/defect-sheet.html",
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
            defectCategories: CONFIG.ANIME5E.CharacterDefects.Types
        };
        
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Complications management
        html.find('.add-complication').click(this._onAddComplication.bind(this));
        html.find('.remove-complication').click(this._onRemoveComplication.bind(this));

        // Effects management
        html.find('.add-effect').click(this._onAddEffect.bind(this));
        html.find('.remove-effect').click(this._onRemoveEffect.bind(this));

        // Handle input changes
        html.find('input[type="text"]').change(this._onEntryChange.bind(this));
    }

    async _onAddComplication(event) {
        event.preventDefault();
        const complications = duplicate(this.item.system.complications || []);
        complications.push("");
        await this.item.update({ "system.complications": complications });
    }

    async _onRemoveComplication(event) {
        event.preventDefault();
        const complicationId = event.currentTarget.dataset.complicationId;
        const complications = duplicate(this.item.system.complications);
        complications.splice(complicationId, 1);
        await this.item.update({ "system.complications": complications });
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

        if (input.dataset.complicationId !== undefined) {
            const complications = duplicate(this.item.system.complications);
            complications[input.dataset.complicationId] = value;
            this.item.update({ "system.complications": complications });
        } else if (input.dataset.effectId !== undefined) {
            const effects = duplicate(this.item.system.effects);
            effects[input.dataset.effectId] = value;
            this.item.update({ "system.effects": effects });
        }
    }
} 