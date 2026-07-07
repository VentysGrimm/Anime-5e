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

const CRITICAL_FAILURE_TABLE = Object.freeze({
  2: "Overextended reach causes a clothing or gear mishap.",
  3: "Combat focus breaks; Initiative becomes 1 for the rest of the battle.",
  4: "Overexertion strains a muscle; Strength-related rolls suffer disadvantage for 24 hours.",
  5: "The attacker is off balance; opponents gain advantage against them until their next Initiative.",
  6: "A twisted ankle halves movement until several hours of rest or healing.",
  7: "The attacker drops their weapon.",
  8: "Grip weakens; attack rolls suffer disadvantage during the next round.",
  9: "The weapon hits a solid surface and may be damaged or broken.",
  10: "A nearby ally is hit instead and takes half damage.",
  11: "The attacker hits themself and takes half damage.",
  12: "The attacker falls; opponents gain advantage and positive Dexterity AC modifiers do not apply until their next Initiative."
});

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

function formatSignedValue(value) {
  const number = Number(value) || 0;
  return number >= 0 ? `+${number}` : String(number);
}

function normalizeD20Mode(mode) {
  return D20_MODE_FORMULAS[mode] ? mode : "normal";
}

function firstD20Total(roll) {
  const die = roll?.dice?.find((candidate) => candidate.faces === 20);
  const activeResults = die?.results?.filter((result) => result.active !== false).map((result) => Number(result.result));
  if (activeResults?.length) return activeResults[0];
  return Number.isFinite(Number(die?.total)) ? Number(die.total) : null;
}

export function describeCriticalFailureTableResult(value) {
  return CRITICAL_FAILURE_TABLE[Number(value)] ?? "";
}

export function criticalFailureConsequenceCount(total, targetNumber) {
  const target = Number(targetNumber);
  if (!Number.isFinite(target)) return 0;

  const margin = Number(total) - target;
  if (margin <= -15) return 2;
  if (margin <= -11) return 1;
  return 0;
}

export function buildCriticalRollDetails({ total, d20 = null, targetNumber = null, failureRolls = [] } = {}) {
  const details = [];
  const target = Number(targetNumber);

  if (Number.isFinite(target)) {
    const margin = Number(total) - target;
    if (margin >= 15) {
      details.push({ label: "Critical Hit", value: "Outrageous success: triple final damage after all modifiers." });
    } else if (margin >= 11) {
      details.push({ label: "Critical Hit", value: "Extreme success: double final damage after all modifiers." });
    } else if (margin <= -15) {
      details.push({ label: "Critical Failure", value: "Outrageous failure: apply two Table 22 consequences." });
    } else if (margin <= -11) {
      details.push({ label: "Critical Failure", value: "Extreme failure: apply one Table 22 consequence." });
    }
  }

  for (const failureRoll of failureRolls) {
    const description = describeCriticalFailureTableResult(failureRoll);
    if (description) details.push({ label: `Table 22 (${failureRoll})`, value: description });
  }

  if (d20 === 20) {
    details.push({ label: "Optional Natural 20", value: "Alternative rule: natural 20 may count as double-damage critical." });
  }
  if (d20 === 1) {
    details.push({ label: "Optional Natural 1", value: "Alternative rule: natural 1 may trigger a critical failure." });
  }

  return details;
}

export function buildD20Formula(modifiers = [], options = {}) {
  const mode = normalizeD20Mode(options.mode);
  const modifierList = Array.isArray(modifiers) ? modifiers : [modifiers];
  return [D20_MODE_FORMULAS[mode], ...modifierList.map((modifier) => signedModifier(modifier))].join(" ");
}

export function renderRollFlavor({ actor = null, label = "Roll", formula = "", result = "", mode = "normal", details = [] } = {}) {
  const modeKey = normalizeD20Mode(mode);
  const actorName = actor?.name ?? "Anime 5e";
  const detailRows = details
    .filter((detail) => detail?.label && detail.value !== undefined && detail.value !== null && detail.value !== "")
    .map((detail) => `<dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>`)
    .join("");

  return `
    <article class="anime5e chat-card roll-card">
      <h3>${escapeHtml(label)}</h3>
      <dl class="roll-summary">
        <dt>Actor</dt><dd>${escapeHtml(actorName)}</dd>
        <dt>Formula</dt><dd>${escapeHtml(formula)}</dd>
        <dt>Mode</dt><dd>${escapeHtml(D20_MODE_LABELS[modeKey])}</dd>
        <dt>Result</dt><dd>${escapeHtml(result)}</dd>
        ${detailRows}
      </dl>
    </article>
  `;
}

export async function evaluateAnime5eFormula(formula) {
  if (!formula) throw new Error("A roll formula is required.");

  const roll = new Roll(formula);
  await roll.evaluate();
  return roll;
}

export async function rollAnime5eFormula({
  formula,
  actor = null,
  label = "Roll",
  mode = "normal",
  speaker = null,
  details = [],
  targetNumber = null,
  showMargin = false,
  showCritical = false
} = {}) {
  if (!formula) throw new Error("A roll formula is required.");

  const rollMode = normalizeD20Mode(mode);
  const roll = await evaluateAnime5eFormula(formula);
  const resolvedDetails = [...details];
  const hasTarget = targetNumber !== null && targetNumber !== undefined && targetNumber !== "";
  const target = hasTarget ? Number(targetNumber) : NaN;
  if (Number.isFinite(target)) {
    resolvedDetails.push({ label: "Target", value: target });
    if (showMargin) resolvedDetails.push({ label: "Margin", value: formatSignedValue(roll.total - target) });
  }

  if (showCritical) {
    const d20 = firstD20Total(roll);
    const failureCount = Number.isFinite(target) ? criticalFailureConsequenceCount(roll.total, target) : 0;
    const failureRolls = [];
    for (let index = 0; index < failureCount; index += 1) {
      const failureRoll = await evaluateAnime5eFormula("2d6");
      failureRolls.push(failureRoll.total);
    }
    resolvedDetails.push(...buildCriticalRollDetails({
      total: roll.total,
      d20,
      targetNumber: Number.isFinite(target) ? target : null,
      failureRolls
    }));
  }

  return roll.toMessage({
    speaker: speaker ?? (actor ? ChatMessage.getSpeaker({ actor }) : ChatMessage.getSpeaker()),
    flavor: renderRollFlavor({
      actor,
      label,
      formula,
      result: roll.total,
      mode: rollMode,
      details: resolvedDetails
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
