export class EnhancementSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "item", "enhancement"],
            template: "systems/anime5e/templates/item/enhancement-sheet.html",
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
        
        // Add config data for dropdowns and checkboxes
        data.config = {
            traitTypes: {
                attribute: "Attributes",
                defect: "Defects"
            },
            traitCategories: {
                ...CONFIG.ANIME5E.CharacterAttributes.Types,
                ...CONFIG.ANIME5E.CharacterDefects.Types
            }
        };
        
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Effects management
        html.find('.add-effect').click(this._onAddEffect.bind(this));
        html.find('.remove-effect').click(this._onRemoveEffect.bind(this));

        // Handle checkbox changes
        html.find('input[type="checkbox"]').change(this._onCheckboxChange.bind(this));
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

    _onCheckboxChange(event) {
        const checkbox = event.currentTarget;
        const field = checkbox.name;
        const value = checkbox.value;
        
        // Handle array fields (applicableTo and traitCategories)
        if (field.includes('applicableTo') || field.includes('traitCategories')) {
            const array = duplicate(getProperty(this.item, field) || []);
            if (checkbox.checked) {
                array.push(value);
            } else {
                array.splice(array.indexOf(value), 1);
            }
            this.item.update({ [field]: array });
        }
    }

    _updateObject(event, formData) {
        // Handle special cases before passing to parent
        if (formData["system.cost.value"]) {
            formData["system.cost.value"] = Number(formData["system.cost.value"]);
        }
        
        super._updateObject(event, formData);
    }
} 