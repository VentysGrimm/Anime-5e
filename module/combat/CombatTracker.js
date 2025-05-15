export default class Anime5ECombatTracker extends CombatTracker {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["anime5e", "combat-tracker"],
            template: "systems/anime5e/templates/combat/combat-tracker.html",
            title: "Combat Tracker",
            scrollY: [".directory-list"]
        });
    }

    getData() {
        const data = super.getData();
        const combat = this.viewed;
        
        if (!combat) return data;

        // Add custom data for each combatant
        data.turns = data.turns.map(turn => {
            const combatant = combat.combatants.get(turn.id);
            const actor = combatant.actor;
            
            return {
                ...turn,
                // Add HP tracking
                hp: actor?.system.hp || { value: 0, max: 0 },
                // Add MP tracking
                mp: actor?.system.mp || { value: 0, max: 0 },
                // Add Energy Points tracking
                energy: actor?.system.energy || { value: 0, max: 0 },
                // Add status effects
                effects: actor?.effects.map(e => ({
                    id: e.id,
                    label: e.label,
                    icon: e.icon,
                    duration: e.duration
                })) || [],
                // Add action tracking
                actions: combatant.getFlag("anime5e", "actions") || {
                    standard: true,
                    move: true,
                    swift: true
                }
            };
        });

        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);

        // Add damage/healing buttons
        html.find(".damage-heal").click(this._onDamageHeal.bind(this));
        
        // Add status effect controls
        html.find(".effect-control").click(this._onEffectControl.bind(this));
        
        // Add action tracking
        html.find(".action-toggle").click(this._onActionToggle.bind(this));
    }

    async _onDamageHeal(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        const combatantId = btn.closest(".combatant").dataset.combatantId;
        const combatant = this.viewed.combatants.get(combatantId);
        const actor = combatant.actor;

        // Create dialog for damage/healing
        const d = await new Dialog({
            title: "Apply Damage/Healing",
            content: `
                <form>
                    <div class="form-group">
                        <label>Amount:</label>
                        <input type="number" name="amount" value="0"/>
                    </div>
                    <div class="form-group">
                        <label>Type:</label>
                        <select name="type">
                            <option value="damage">Damage</option>
                            <option value="healing">Healing</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Resource:</label>
                        <select name="resource">
                            <option value="hp">Hit Points</option>
                            <option value="mp">Magic Points</option>
                            <option value="energy">Energy Points</option>
                        </select>
                    </div>
                </form>`,
            buttons: {
                apply: {
                    icon: '<i class="fas fa-check"></i>',
                    label: "Apply",
                    callback: (html) => {
                        const amount = Number(html.find('[name="amount"]').val());
                        const type = html.find('[name="type"]').val();
                        const resource = html.find('[name="resource"]').val();
                        
                        // Calculate new value
                        const current = actor.system[resource].value;
                        const max = actor.system[resource].max;
                        const newValue = type === "damage" 
                            ? Math.max(0, current - amount)
                            : Math.min(max, current + amount);
                        
                        // Update actor
                        actor.update({
                            [`system.${resource}.value`]: newValue
                        });

                        // Create chat message
                        ChatMessage.create({
                            speaker: ChatMessage.getSpeaker({ actor }),
                            content: `${actor.name} ${type === "damage" ? "takes" : "heals"} ${amount} ${type === "damage" ? "damage" : "healing"} to ${resource}.`
                        });
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-times"></i>',
                    label: "Cancel"
                }
            },
            default: "apply"
        }).render(true);
    }

    async _onEffectControl(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        const combatantId = btn.closest(".combatant").dataset.combatantId;
        const combatant = this.viewed.combatants.get(combatantId);
        const actor = combatant.actor;

        if (btn.dataset.action === "add") {
            const effectData = {
                label: "New Effect",
                icon: "icons/svg/aura.svg",
                duration: {
                    rounds: 1,
                    turns: null
                }
            };
            await actor.createEmbeddedDocuments("ActiveEffect", [effectData]);
        }
        else if (btn.dataset.action === "edit") {
            const effect = actor.effects.get(btn.dataset.effectId);
            effect.sheet.render(true);
        }
        else if (btn.dataset.action === "delete") {
            const effect = actor.effects.get(btn.dataset.effectId);
            await effect.delete();
        }
    }

    async _onActionToggle(event) {
        event.preventDefault();
        const btn = event.currentTarget;
        const combatantId = btn.closest(".combatant").dataset.combatantId;
        const combatant = this.viewed.combatants.get(combatantId);
        const actionType = btn.dataset.actionType;

        const actions = combatant.getFlag("anime5e", "actions") || {
            standard: true,
            move: true,
            swift: true
        };

        await combatant.setFlag("anime5e", "actions", {
            ...actions,
            [actionType]: !actions[actionType]
        });
    }

    async _onNextTurn() {
        await super._onNextTurn();
        const combat = this.viewed;
        
        if (!combat) return;

        // Reset actions for the new combatant
        const currentCombatant = combat.combatant;
        await currentCombatant.setFlag("anime5e", "actions", {
            standard: true,
            move: true,
            swift: true
        });

        // Process active effects
        for (let combatant of combat.combatants) {
            const actor = combatant.actor;
            if (!actor) continue;

            for (let effect of actor.effects) {
                if (!effect.duration.rounds) continue;

                // Decrease duration
                const newRounds = effect.duration.rounds - 1;
                if (newRounds <= 0) {
                    await effect.delete();
                } else {
                    await effect.update({
                        "duration.rounds": newRounds
                    });
                }
            }
        }
    }
} 