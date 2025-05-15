export class ArmorSheet extends ItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "sheet", "item", "armor"],
            template: "systems/anime5e/templates/item/armor-sheet.html",
            width: 520,
            height: 480,
            tabs: [{
                navSelector: ".sheet-tabs",
                contentSelector: ".sheet-body",
                initial: "description"
            }],
            dragDrop: [{
                dragSelector: ".enhancement-list .item, .limiter-list .item",
                dropSelector: null
            }]
        });
    }

    async getData() {
        const context = await super.getData();
        
        // Add the item's data to context.data
        const itemData = this.item.toObject(false);
        context.item = itemData;
        context.system = itemData.system;
        
        // Add config data for dropdowns
        context.config = {
            armorTypes: CONFIG.ANIME5E.ArmorTypes,
            properties: CONFIG.ANIME5E.ArmorProperties
        };
        
        // Calculate final cost based on enhancements and limiters
        this._calculateFinalCost(context.item);
        
        // Add roll data for TinyMCE editors
        context.rollData = context.item.getRollData();
        
        return context;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add enhancement/limiter
        html.find('.add-enhancement').click(this._onAddEnhancement.bind(this));
        html.find('.add-limiter').click(this._onAddLimiter.bind(this));

        // Remove enhancement/limiter
        html.find('.remove-enhancement').click(this._onRemoveEnhancement.bind(this));
        html.find('.remove-limiter').click(this._onRemoveLimiter.bind(this));

        // Toggle checkboxes
        html.find('.toggle-checkbox').change(this._onToggleCheckbox.bind(this));
    }

    _calculateFinalCost(item) {
        let finalCost = item.system.baseCost;
        
        // Apply enhancements
        for (let enhancement of item.system.enhancements) {
            switch (enhancement.system.cost.type) {
                case "multiplier":
                    finalCost *= enhancement.system.cost.value;
                    break;
                case "flat":
                    finalCost += enhancement.system.cost.value;
                    break;
                case "percentage":
                    finalCost += (finalCost * enhancement.system.cost.value / 100);
                    break;
            }
        }
        
        // Apply limiters
        for (let limiter of item.system.limiters) {
            switch (limiter.system.refund.type) {
                case "multiplier":
                    finalCost *= (1 - limiter.system.refund.value);
                    break;
                case "flat":
                    finalCost -= limiter.system.refund.value;
                    break;
                case "percentage":
                    finalCost -= (finalCost * limiter.system.refund.value / 100);
                    break;
            }
        }
        
        // Update the final cost if it changed
        if (item.system.finalCost !== finalCost) {
            item.update({"system.finalCost": Math.max(0, Math.round(finalCost))});
        }
    }

    async _onAddEnhancement(event) {
        event.preventDefault();
        const enhancementDialog = new Dialog({
            title: "Add Enhancement",
            content: await renderTemplate("systems/anime5e/templates/dialogs/add-enhancement.html", {
                enhancements: game.items.filter(i => i.type === "enhancement")
            }),
            buttons: {
                add: {
                    label: "Add",
                    callback: async (html) => {
                        const enhancementId = html.find("select[name='enhancement']").val();
                        const enhancement = game.items.get(enhancementId);
                        const enhancements = duplicate(this.item.system.enhancements);
                        enhancements.push(enhancement);
                        await this.item.update({"system.enhancements": enhancements});
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
        });
        enhancementDialog.render(true);
    }

    async _onAddLimiter(event) {
        event.preventDefault();
        const limiterDialog = new Dialog({
            title: "Add Limiter",
            content: await renderTemplate("systems/anime5e/templates/dialogs/add-limiter.html", {
                limiters: game.items.filter(i => i.type === "limiter")
            }),
            buttons: {
                add: {
                    label: "Add",
                    callback: async (html) => {
                        const limiterId = html.find("select[name='limiter']").val();
                        const limiter = game.items.get(limiterId);
                        const limiters = duplicate(this.item.system.limiters);
                        limiters.push(limiter);
                        await this.item.update({"system.limiters": limiters});
                    }
                },
                cancel: {
                    label: "Cancel"
                }
            }
        });
        limiterDialog.render(true);
    }

    _onRemoveEnhancement(event) {
        event.preventDefault();
        const idx = event.currentTarget.dataset.idx;
        const enhancements = duplicate(this.item.system.enhancements);
        enhancements.splice(idx, 1);
        this.item.update({"system.enhancements": enhancements});
    }

    _onRemoveLimiter(event) {
        event.preventDefault();
        const idx = event.currentTarget.dataset.idx;
        const limiters = duplicate(this.item.system.limiters);
        limiters.splice(idx, 1);
        this.item.update({"system.limiters": limiters});
    }

    _onToggleCheckbox(event) {
        const field = event.currentTarget.dataset.field;
        const value = event.currentTarget.checked;
        this.item.update({[`system.properties.${field}`]: value});
    }
} 