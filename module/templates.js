export const preloadHandlebarsTemplates = async function() {
    // Define template paths.
    const templatePaths = [
        // Actor Sheet Partials
        "systems/anime5e/templates/actor/parts/actor-abilities.html",
        "systems/anime5e/templates/actor/parts/actor-features.html",
        "systems/anime5e/templates/actor/parts/actor-items.html",
        "systems/anime5e/templates/actor/parts/actor-powers.html",
        "systems/anime5e/templates/actor/parts/actor-effects.html",
        
        // Item Sheet Partials
        "systems/anime5e/templates/item/parts/item-abilities.html",
        "systems/anime5e/templates/item/parts/item-description.html",
        "systems/anime5e/templates/item/parts/item-effects.html"
    ];

    // Load the template parts
    return loadTemplates(templatePaths);
}; 