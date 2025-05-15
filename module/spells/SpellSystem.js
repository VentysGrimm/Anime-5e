export default class SpellSystem {
    static init() {
        // Register hooks for spell system
        Hooks.on("ready", () => {
            game.anime5e = game.anime5e || {};
            game.anime5e.spellSystem = new SpellSystem();
        });
    }

    constructor() {
        this.registerHooks();
    }

    registerHooks() {
        Hooks.on("preUpdateActor", this._onPreUpdateActor.bind(this));
        Hooks.on("createChatMessage", this._onCreateChatMessage.bind(this));
    }

    /**
     * Calculate the energy cost for a spell based on its parameters
     */
    calculateEnergyCost(spellData) {
        let baseCost = spellData.system.baseCost || 1;
        let modifiers = 0;

        // Add cost for range increase
        if (spellData.system.range.extended) {
            modifiers += Math.floor(spellData.system.range.value / 10);
        }

        // Add cost for area increase
        if (spellData.system.area.extended) {
            modifiers += Math.floor(spellData.system.area.value / 5);
        }

        // Add cost for duration increase
        if (spellData.system.duration.extended) {
            modifiers += spellData.system.duration.rounds;
        }

        // Add cost for power boost
        if (spellData.system.powerBoost) {
            modifiers += spellData.system.powerBoost * 2;
        }

        return baseCost + modifiers;
    }

    /**
     * Check if actor has enough energy to cast the spell
     */
    canCastSpell(actor, spellData) {
        const cost = this.calculateEnergyCost(spellData);
        return actor.system.energy.value >= cost;
    }

    /**
     * Cast a spell, consuming energy points and applying effects
     */
    async castSpell(actor, spellData) {
        const cost = this.calculateEnergyCost(spellData);
        
        if (!this.canCastSpell(actor, spellData)) {
            ui.notifications.error("Not enough Energy Points to cast this spell!");
            return false;
        }

        // Consume energy points
        await actor.update({
            "system.energy.value": actor.system.energy.value - cost
        });

        // Create chat message for spell cast
        await this._createSpellChatMessage(actor, spellData, cost);

        // Apply spell effects
        await this._applySpellEffects(actor, spellData);

        return true;
    }

    /**
     * Create a chat message for spell casting
     */
    async _createSpellChatMessage(actor, spellData, cost) {
        const templateData = {
            actor: actor,
            spell: spellData,
            cost: cost,
            modifiers: {
                range: spellData.system.range.extended,
                area: spellData.system.area.extended,
                duration: spellData.system.duration.extended,
                powerBoost: spellData.system.powerBoost
            }
        };

        const content = await renderTemplate(
            "systems/anime5e/templates/chat/spell-cast.html",
            templateData
        );

        await ChatMessage.create({
            speaker: ChatMessage.getSpeaker({ actor }),
            content: content,
            type: CONST.CHAT_MESSAGE_TYPES.SPELL
        });
    }

    /**
     * Apply spell effects to targets
     */
    async _applySpellEffects(actor, spellData) {
        const targets = game.user.targets;
        if (!targets.size) return;

        const effect = {
            label: spellData.name,
            icon: spellData.img,
            origin: actor.uuid,
            duration: {
                rounds: spellData.system.duration.rounds,
                seconds: spellData.system.duration.rounds * 6
            },
            flags: {
                anime5e: {
                    spellId: spellData._id,
                    powerBoost: spellData.system.powerBoost
                }
            }
        };

        // Add spell-specific changes
        if (spellData.system.changes) {
            effect.changes = spellData.system.changes.map(c => ({
                key: c.key,
                mode: CONST.ACTIVE_EFFECT_MODES[c.mode],
                value: c.value * (1 + (spellData.system.powerBoost || 0) * 0.5)
            }));
        }

        // Apply to all targets
        for (let target of targets) {
            if (target.actor) {
                await target.actor.createEmbeddedDocuments("ActiveEffect", [effect]);
            }
        }
    }

    /**
     * Handle pre-update actor hook for energy point validation
     */
    _onPreUpdateActor(actor, changes, options, userId) {
        if (!game.user.isGM && game.userId !== userId) return;

        // Validate energy point changes
        if (hasProperty(changes, "system.energy.value")) {
            const newValue = changes.system.energy.value;
            const maxEnergy = actor.system.energy.max;

            // Ensure energy points don't go below 0 or above max
            changes.system.energy.value = Math.clamped(newValue, 0, maxEnergy);
        }
    }

    /**
     * Handle chat message creation for spell rolls
     */
    _onCreateChatMessage(message, options, userId) {
        if (!game.user.isGM && game.userId !== userId) return;

        // Handle spell damage rolls
        if (message.getFlag("anime5e", "spellDamage")) {
            this._handleSpellDamageRoll(message);
        }
    }

    /**
     * Handle spell damage rolls
     */
    async _handleSpellDamageRoll(message) {
        const spellId = message.getFlag("anime5e", "spellId");
        const actor = message.speaker.actor ? game.actors.get(message.speaker.actor) : null;
        
        if (!actor) return;

        const spell = actor.items.get(spellId);
        if (!spell) return;

        const roll = message.roll;
        if (!roll) return;

        // Apply damage to targets
        const targets = game.user.targets;
        if (!targets.size) return;

        for (let target of targets) {
            if (!target.actor) continue;

            const damage = roll.total;
            const powerBoost = spell.system.powerBoost || 0;
            const finalDamage = Math.floor(damage * (1 + powerBoost * 0.5));

            await target.actor.update({
                "system.hp.value": Math.max(0, target.actor.system.hp.value - finalDamage)
            });
        }
    }
} 