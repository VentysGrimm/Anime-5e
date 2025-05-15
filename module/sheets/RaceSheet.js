import { AttributeTemplate, DefectTemplate } from "../templates/item-templates.js";

export class RaceSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "item", "race"],
            template: "systems/anime5e/templates/item/race-sheet.html",
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
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add trait buttons
        html.find('.add-trait').click(this._onAddTrait.bind(this));
        html.find('.remove-trait').click(this._onRemoveTrait.bind(this));

        // Language management
        html.find('.add-language').click(this._onAddLanguage.bind(this));
        html.find('.remove-language').click(this._onRemoveLanguage.bind(this));

        // Make trait entries draggable for reordering
        html.find('.trait-entry').each((i, el) => {
            el.setAttribute('draggable', true);
            el.addEventListener('dragstart', this._onDragStart.bind(this));
            el.addEventListener('dragover', this._onDragOver.bind(this));
            el.addEventListener('drop', this._onDrop.bind(this));
        });
    }

    async _onAddTrait(event) {
        event.preventDefault();
        const traitType = event.currentTarget.dataset.traitType;
        const traits = duplicate(this.item.system.traits);
        
        if (traitType === "attribute") {
            const newAttribute = duplicate(AttributeTemplate);
            traits.attributes.push(newAttribute);
        } else if (traitType === "defect") {
            const newDefect = duplicate(DefectTemplate);
            traits.defects.push(newDefect);
        }

        await this.item.update({ "system.traits": traits });
    }

    async _onRemoveTrait(event) {
        event.preventDefault();
        const traitType = event.currentTarget.dataset.traitType;
        const traitId = event.currentTarget.dataset.traitId;
        const traits = duplicate(this.item.system.traits);

        if (traitType === "attribute") {
            traits.attributes.splice(traitId, 1);
        } else if (traitType === "defect") {
            traits.defects.splice(traitId, 1);
        }

        await this.item.update({ "system.traits": traits });
    }

    async _onAddLanguage(event) {
        event.preventDefault();
        const languages = duplicate(this.item.system.languages || []);
        languages.push("");
        await this.item.update({ "system.languages": languages });
    }

    async _onRemoveLanguage(event) {
        event.preventDefault();
        const languageId = event.currentTarget.dataset.languageId;
        const languages = duplicate(this.item.system.languages);
        languages.splice(languageId, 1);
        await this.item.update({ "system.languages": languages });
    }

    _onDragStart(event) {
        event.dataTransfer.setData("text/plain", event.currentTarget.dataset.traitId);
    }

    _onDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('drag-hover');
    }

    async _onDrop(event) {
        event.preventDefault();
        const draggedId = parseInt(event.dataTransfer.getData("text/plain"));
        const dropId = parseInt(event.currentTarget.dataset.traitId);
        
        if (draggedId === dropId) return;

        const traitType = event.currentTarget.closest('.trait-list').classList.contains('attributes') 
            ? 'attributes' 
            : 'defects';
        
        const traits = duplicate(this.item.system.traits);
        const list = traits[traitType];
        
        const [removed] = list.splice(draggedId, 1);
        list.splice(dropId, 0, removed);
        
        await this.item.update({ "system.traits": traits });
    }
} 