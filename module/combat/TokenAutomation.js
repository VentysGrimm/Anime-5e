export default class TokenAutomation {
    static init() {
        // Register hooks for token automation
        Hooks.on("updateActor", TokenAutomation._onUpdateActor);
        Hooks.on("updateToken", TokenAutomation._onUpdateToken);
        Hooks.on("createActiveEffect", TokenAutomation._onCreateEffect);
        Hooks.on("deleteActiveEffect", TokenAutomation._onDeleteEffect);
    }

    static async _onUpdateActor(actor, changes, options, userId) {
        if (!game.user.isGM && game.userId !== userId) return;

        // Handle HP changes
        if (hasProperty(changes, "system.hp.value")) {
            const tokens = actor.getActiveTokens();
            const hpValue = changes.system.hp.value;
            const maxHp = actor.system.hp.max;
            const hpRatio = hpValue / maxHp;

            for (let token of tokens) {
                // Update token bar
                await token.update({
                    "bar1": {
                        attribute: "hp"
                    }
                });

                // Visual effects based on HP
                if (hpRatio <= 0.25) {
                    await TokenAutomation._createBloodEffect(token);
                }

                // Handle defeat state
                if (hpValue <= 0) {
                    await TokenAutomation._handleDefeat(token);
                }
            }
        }

        // Handle MP changes
        if (hasProperty(changes, "system.mp.value")) {
            const tokens = actor.getActiveTokens();
            for (let token of tokens) {
                await token.update({
                    "bar2": {
                        attribute: "mp"
                    }
                });
            }
        }

        // Handle Energy Point changes
        if (hasProperty(changes, "system.energy.value")) {
            const tokens = actor.getActiveTokens();
            for (let token of tokens) {
                await token.update({
                    "bar3": {
                        attribute: "energy"
                    }
                });
            }
        }
    }

    static async _onUpdateToken(token, changes, options, userId) {
        if (!game.user.isGM && game.userId !== userId) return;

        // Handle token movement
        if (hasProperty(changes, "x") || hasProperty(changes, "y")) {
            const combat = game.combat;
            if (!combat) return;

            const combatant = combat.combatants.find(c => c.tokenId === token.id);
            if (!combatant) return;

            // Check if this was a move action
            const actions = combatant.getFlag("anime5e", "actions") || {};
            if (actions.move) {
                await combatant.setFlag("anime5e", "actions", {
                    ...actions,
                    move: false
                });
            }
        }
    }

    static async _onCreateEffect(effect, options, userId) {
        if (!game.user.isGM && game.userId !== userId) return;

        const actor = effect.parent;
        if (!actor) return;

        const tokens = actor.getActiveTokens();
        for (let token of tokens) {
            // Add visual effect based on effect type
            await TokenAutomation._createEffectAnimation(token, effect);
        }
    }

    static async _onDeleteEffect(effect, options, userId) {
        if (!game.user.isGM && game.userId !== userId) return;

        const actor = effect.parent;
        if (!actor) return;

        const tokens = actor.getActiveTokens();
        for (let token of tokens) {
            // Remove visual effect
            await TokenAutomation._removeEffectAnimation(token, effect);
        }
    }

    static async _createBloodEffect(token) {
        if (!token.object) return;

        // Create blood splatter effect
        const bloodData = {
            file: "modules/anime5e/assets/effects/blood.png",
            position: {
                x: token.x + (token.width * canvas.grid.size) / 2,
                y: token.y + (token.height * canvas.grid.size) / 2
            },
            anchor: {
                x: 0.5,
                y: 0.5
            },
            angle: Math.random() * 360,
            scale: {
                x: 0.5,
                y: 0.5
            },
            alpha: 0.75
        };

        await canvas.effects.addChild(new PIXI.Sprite.from(bloodData.file));
    }

    static async _handleDefeat(token) {
        if (!token.object) return;

        // Visual effect for defeat
        const defeatData = {
            file: "modules/anime5e/assets/effects/defeat.png",
            position: token.center,
            anchor: 0.5,
            angle: 0,
            scale: canvas.grid.size / 100
        };

        // Create the effect
        const effect = await canvas.effects.addChild(new PIXI.Sprite.from(defeatData.file));

        // Animate the effect
        const duration = 1000;
        const start = Date.now();
        const animate = async () => {
            const elapsed = Date.now() - start;
            const t = Math.min(elapsed / duration, 1.0);

            effect.alpha = 1 - t;
            effect.scale.x = defeatData.scale * (1 + t);
            effect.scale.y = defeatData.scale * (1 + t);

            if (t < 1.0) {
                requestAnimationFrame(animate);
            } else {
                effect.destroy();
            }
        };

        requestAnimationFrame(animate);

        // Update token
        await token.update({
            overlayEffect: "icons/svg/skull.svg"
        });

        // Update combatant if in combat
        const combat = game.combat;
        if (combat) {
            const combatant = combat.combatants.find(c => c.tokenId === token.id);
            if (combatant) {
                await combatant.update({defeated: true});
            }
        }
    }

    static async _createEffectAnimation(token, effect) {
        if (!token.object) return;

        // Create effect sprite
        const sprite = new PIXI.Sprite.from(effect.icon);
        sprite.anchor.set(0.5);
        sprite.position.set(
            token.x + (token.width * canvas.grid.size) / 2,
            token.y + (token.height * canvas.grid.size) / 2
        );
        sprite.alpha = 0;

        canvas.effects.addChild(sprite);

        // Animate in
        const duration = 500;
        const start = Date.now();
        const animate = async () => {
            const elapsed = Date.now() - start;
            const t = Math.min(elapsed / duration, 1.0);

            sprite.alpha = t;
            sprite.scale.x = 1 + (1 - t);
            sprite.scale.y = 1 + (1 - t);

            if (t < 1.0) {
                requestAnimationFrame(animate);
            } else {
                sprite.alpha = 1;
                sprite.scale.set(1);
            }
        };

        requestAnimationFrame(animate);

        // Store sprite reference
        token.object.effects = token.object.effects || new Map();
        token.object.effects.set(effect.id, sprite);
    }

    static async _removeEffectAnimation(token, effect) {
        if (!token.object || !token.object.effects) return;

        const sprite = token.object.effects.get(effect.id);
        if (!sprite) return;

        // Animate out
        const duration = 500;
        const start = Date.now();
        const animate = async () => {
            const elapsed = Date.now() - start;
            const t = Math.min(elapsed / duration, 1.0);

            sprite.alpha = 1 - t;
            sprite.scale.x = 1 + t;
            sprite.scale.y = 1 + t;

            if (t < 1.0) {
                requestAnimationFrame(animate);
            } else {
                sprite.destroy();
                token.object.effects.delete(effect.id);
            }
        };

        requestAnimationFrame(animate);
    }
} 