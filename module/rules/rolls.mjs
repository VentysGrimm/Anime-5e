const D20_MODE_FORMULAS = {
  normal: "1d20",
  advantage: "2d20kh",
  disadvantage: "2d20kl"
};

const D20_MODE_LABELS = {
  normal: "Normal",
  advantage: "Advantage",
  disadvantage: "Disadvantage"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function signedModifier(value) {
  const modifier = Number(value) || 0;
  return modifier >= 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
}

function normalizeD20Mode(mode) {
  return D20_MODE_FORMULAS[mode] ? mode : "normal";
}

export function buildD20Formula(modifiers = [], options = {}) {
  const mode = normalizeD20Mode(options.mode);
  const modifierList = Array.isArray(modifiers) ? modifiers : [modifiers];
  return [D20_MODE_FORMULAS[mode], ...modifierList.map((modifier) => signedModifier(modifier))].join(" ");
}

export function renderRollFlavor({ actor = null, label = "Roll", formula = "", result = "", mode = "normal" } = {}) {
  const modeKey = normalizeD20Mode(mode);
  const actorName = actor?.name ?? "Anime 5e";

  return `
    <article class="anime5e chat-card roll-card">
      <h3>${escapeHtml(label)}</h3>
      <dl class="roll-summary">
        <dt>Actor</dt><dd>${escapeHtml(actorName)}</dd>
        <dt>Formula</dt><dd>${escapeHtml(formula)}</dd>
        <dt>Mode</dt><dd>${escapeHtml(D20_MODE_LABELS[modeKey])}</dd>
        <dt>Result</dt><dd>${escapeHtml(result)}</dd>
      </dl>
    </article>
  `;
}

export async function rollAnime5eFormula({ formula, actor = null, label = "Roll", mode = "normal", speaker = null } = {}) {
  if (!formula) throw new Error("A roll formula is required.");

  const rollMode = normalizeD20Mode(mode);
  const roll = new Roll(formula);
  await roll.evaluate();

  return roll.toMessage({
    speaker: speaker ?? (actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker()),
    flavor: renderRollFlavor({
      actor,
      label,
      formula,
      result: roll.total,
      mode: rollMode
    })
  });
}

export async function rollAnime5eD20({ actor = null, label = "D20 Roll", modifiers = [], mode = "normal", speaker = null } = {}) {
  return rollAnime5eFormula({
    actor,
    formula: buildD20Formula(modifiers, { mode }),
    label,
    mode,
    speaker
  });
}
