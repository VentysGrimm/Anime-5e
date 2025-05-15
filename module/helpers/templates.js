/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export async function preloadHandlebarsTemplates() {
    const templatePaths = [
        // Actor Sheet Partials
        "templates/actor/parts/actor-abilities.html",
        "templates/actor/parts/actor-attributes.html",
        "templates/actor/parts/actor-features.html",
        "templates/actor/parts/actor-items.html",
        "templates/actor/parts/actor-spells.html",
        "templates/actor/parts/actor-effects.html",
        
        // Item Sheet Partials
        "templates/item/parts/item-abilities.html",
        "templates/item/parts/item-description.html",
        "templates/item/parts/item-effects.html"
    ];

    return loadTemplates(templatePaths);
} 