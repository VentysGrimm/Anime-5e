export const MODULE_ID = "anime5e-mounts-and-monsters";

export const SOURCE_TAGS = {
  book: "Anime 5E Mounts and Monsters",
  abbreviation: "MM",
  moduleId: MODULE_ID
};

Hooks.once("init", () => {
  console.log(`anime5e-mounts-and-monsters | Anime 5e content module loaded`);
});
