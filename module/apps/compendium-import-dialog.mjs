import { importCoreCompendiumData } from "../data/compendiums.mjs";

const { DialogV2 } = foundry.applications.api;

function renderImportContent() {
  return `
    <section class="anime5e import-dialog">
      <p>Import or update the source-backed Anime 5e starter documents into the declared compendium packs.</p>
      <p>Existing compendium documents are matched by source ID and updated in place. New source entries are created.</p>
    </section>
  `;
}

async function runImport() {
  try {
    return await importCoreCompendiumData();
  } catch (error) {
    console.error("anime5e | Core compendium import failed", error);
    ui.notifications?.error("Anime 5e core compendium import failed. Check the console for details.");
    return false;
  }
}

export class Anime5eCompendiumImportDialog extends DialogV2 {
  constructor(options = {}) {
    super({
      window: {
        title: "Anime 5e Core Compendiums"
      },
      content: renderImportContent(),
      buttons: [
        {
          action: "import",
          label: "Import / Update",
          icon: "fa-solid fa-file-import",
          default: true,
          callback: runImport
        },
        {
          action: "cancel",
          label: "Cancel"
        }
      ],
      ...options
    });
  }
}

export function showCoreCompendiumImportDialog() {
  return new Anime5eCompendiumImportDialog().render({ force: true });
}
