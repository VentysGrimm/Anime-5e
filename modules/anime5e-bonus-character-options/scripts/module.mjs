export const MODULE_ID = "anime5e-bonus-character-options";

export const SOURCE_TAGS = {
  book: "Anime 5E Bonus Character Options",
  abbreviation: "BCO",
  moduleId: MODULE_ID
};

Hooks.once("init", () => {
  console.log(`anime5e-bonus-character-options | Anime 5e content module loaded`);
});
