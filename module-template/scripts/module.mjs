export const MODULE_ID = "anime5e-example-expansion";

export const SOURCE_TAGS = {
  book: "Anime 5e Example Expansion",
  abbreviation: "EXAMPLE",
  moduleId: MODULE_ID
};

Hooks.once("init", () => {
  console.log(`${MODULE_ID} | Anime 5e content module loaded`);
});
