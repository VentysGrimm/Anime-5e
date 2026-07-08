const { DialogV2 } = foundry.applications.api;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function selected(value, expected) {
  return value === expected ? "selected" : "";
}

function renderOptions(options = [], selectedValue = "") {
  return options
    .map((option) => `<option value="${escapeHtml(option.key)}" ${selected(option.key, selectedValue)}>${escapeHtml(option.label)}</option>`)
    .join("");
}

function numberValue(form, field, fallback = 0) {
  const value = Number(form?.elements?.[field]?.value);
  return Number.isFinite(value) ? value : fallback;
}

function textValue(form, field) {
  return String(form?.elements?.[field]?.value ?? "").trim();
}

function readRollDialogForm(form) {
  return {
    abilityKey: textValue(form, "abilityKey") || "strength",
    bonus: numberValue(form, "bonus", 0),
    dc: Math.max(0, Math.trunc(numberValue(form, "dc", 0))),
    label: textValue(form, "label"),
    modeKey: textValue(form, "modeKey") || "ability",
    rollKind: textValue(form, "rollKind") || "check",
    rollMode: textValue(form, "rollMode") || "normal"
  };
}

function renderRollDialogContent({ abilities = [], rollModes = [], d20Modes = [], initial = {} } = {}) {
  return `
    <section class="anime5e roll-dialog">
      <form class="roll-dialog-form">
        <div class="roll-dialog-grid">
          <label>Ability
            <select name="abilityKey">${renderOptions(abilities, initial.abilityKey ?? "strength")}</select>
          </label>
          <label>Mode
            <select name="modeKey">${renderOptions(rollModes, initial.modeKey ?? "ability")}</select>
          </label>
          <label>Roll
            <select name="rollMode">${renderOptions(d20Modes, initial.rollMode ?? "normal")}</select>
          </label>
          <label>Type
            <select name="rollKind">
              <option value="check" ${selected(initial.rollKind ?? "check", "check")}>Check / DC</option>
              <option value="contest" ${selected(initial.rollKind, "contest")}>Contest</option>
            </select>
          </label>
          <label>DC
            <input type="number" name="dc" value="${Math.max(0, Math.trunc(Number(initial.dc) || 0))}" min="0">
          </label>
          <label>Bonus
            <input type="number" name="bonus" value="${Math.trunc(Number(initial.bonus) || 0)}">
          </label>
          <label class="wide">Label
            <input type="text" name="label" value="${escapeHtml(initial.label)}" placeholder="Optional roll label">
          </label>
        </div>
        <div class="roll-dialog-actions">
          <button type="button" data-action="roll-dialog-submit"><i class="fas fa-dice-d20"></i><span>Roll</span></button>
        </div>
      </form>
    </section>
  `;
}

export class Anime5eRollDialog extends DialogV2 {
  constructor({ actor = null, abilities = [], rollModes = [], d20Modes = [], initial = {}, onRoll = null, ...options } = {}) {
    super({
      window: {
        title: `${actor?.name ?? "Anime 5e"} Roll Dialog`
      },
      content: renderRollDialogContent({ abilities, rollModes, d20Modes, initial }),
      buttons: [
        {
          action: "close",
          label: "Close",
          default: true
        }
      ],
      ...options
    });
    this.onRoll = onRoll;
  }

  async _onRender(context, options) {
    if (typeof super._onRender === "function") await super._onRender(context, options);

    const element = this.element instanceof HTMLElement ? this.element : this.element?.[0];
    const form = element?.querySelector(".roll-dialog-form");
    if (!form) return;

    form.querySelector("[data-action='roll-dialog-submit']")?.addEventListener("click", async (event) => {
      event.preventDefault();
      await this.onRoll?.(readRollDialogForm(form));
    });
  }
}

export function showAnime5eRollDialog(options = {}) {
  return new Anime5eRollDialog(options).render({ force: true });
}
