const { DialogV2 } = foundry.applications.api;

function renderEncounterThreatContent() {
  return `
    <section class="anime5e encounter-threat-dialog">
      <p>This shell reserves the Anime 5E Challenge Rating and Encounter Threat workflow while creature data is still being populated.</p>
      <div class="encounter-threat-grid">
        <label>Party Size <input type="number" value="4" min="1" disabled></label>
        <label>Party Level <input type="number" value="1" min="1" disabled></label>
        <label>Creature CR <input type="text" value="Pending" disabled></label>
        <label>Creature Count <input type="number" value="1" min="1" disabled></label>
      </div>
      <p>Use the Core Monsters, Core NPCs, and Core Neomorphs packs for now. Automated threat math will be added after the remaining creature stat blocks are stable.</p>
    </section>
  `;
}

export class Anime5eEncounterThreatDialog extends DialogV2 {
  constructor(options = {}) {
    super({
      window: {
        title: "Anime 5e Encounter Threat"
      },
      content: renderEncounterThreatContent(),
      buttons: [
        {
          action: "close",
          label: "Close",
          default: true
        }
      ],
      ...options
    });
  }
}

export function showEncounterThreatDialog() {
  return new Anime5eEncounterThreatDialog().render({ force: true });
}
