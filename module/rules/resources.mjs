function safeAmount(amount) {
  return Math.max(0, Math.trunc(Number(amount) || 0));
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function systemOf(target) {
  return target?.system ?? target ?? {};
}

export function parseHitDieSize(value) {
  const match = String(value ?? "").match(/d\s*(\d+)/i);
  if (match) return Math.max(0, Math.trunc(Number(match[1]) || 0));

  return Math.max(0, Math.trunc(Number(value) || 0));
}

function classHitDiceEntries(system = {}) {
  return Object.values(system.progression?.classes ?? {})
    .map((entry) => ({
      level: safeAmount(entry?.level),
      size: parseHitDieSize(entry?.hitDice),
      label: String(entry?.hitDice ?? "").trim()
    }))
    .filter((entry) => entry.level > 0);
}

export function summarizeHitDice(target = {}) {
  const system = systemOf(target);
  const sourceHitDice = system.combat?.hitDice ?? {};
  const classEntries = classHitDiceEntries(system);
  const pool = classEntries
    .filter((entry) => entry.size > 0)
    .map((entry) => ({
      count: entry.level,
      size: entry.size,
      label: `${entry.level}d${entry.size}`
    }));
  const classTotal = classEntries.reduce((total, entry) => total + entry.level, 0);
  const fallbackTotal = safeAmount(sourceHitDice.total);
  const fallbackSize = parseHitDieSize(sourceHitDice.dieSize) || 8;
  const total = classTotal || fallbackTotal;
  const spent = Math.min(total, safeAmount(sourceHitDice.spent));
  const dieSize = pool[0]?.size ?? fallbackSize;
  const available = Math.max(0, total - spent);
  const effectivePool = pool.length ? pool : (total > 0 ? [{ count: total, size: dieSize, label: `${total}d${dieSize}` }] : []);
  const label = effectivePool.length ? effectivePool.map((entry) => entry.label).join(", ") : `d${dieSize}`;

  return {
    available,
    dieSize,
    label,
    pool: effectivePool,
    spent,
    total
  };
}

function expandedAvailableHitDice(hitDice) {
  const dice = hitDice.pool
    .flatMap((entry) => Array.from({ length: entry.count }, () => entry.size))
    .sort((left, right) => right - left);

  return dice.slice(hitDice.spent);
}

export function buildShortRestHitDiceFormula(target = {}, hitDiceSpent = 0) {
  const system = systemOf(target);
  const hitDice = summarizeHitDice(system);
  const requested = Math.min(safeAmount(hitDiceSpent), hitDice.available);
  const dice = expandedAvailableHitDice(hitDice).slice(0, requested);
  const constitutionModifier = numberOrZero(system.abilities?.constitution?.modifier);
  const constitutionTotal = constitutionModifier * dice.length;
  const counts = dice.reduce((summary, size) => {
    summary.set(size, (summary.get(size) ?? 0) + 1);
    return summary;
  }, new Map());
  const diceTerms = [...counts.entries()]
    .sort(([left], [right]) => right - left)
    .map(([size, count]) => `${count}d${size}`);
  let formula = diceTerms.join(" + ");

  if (constitutionTotal) {
    const sign = constitutionTotal > 0 ? "+" : "-";
    formula = formula ? `${formula} ${sign} ${Math.abs(constitutionTotal)}` : String(constitutionTotal);
  }
  if (!formula) formula = "0";

  return {
    constitutionModifier,
    constitutionTotal,
    dice,
    formula,
    hitDice,
    hitDiceSpent: dice.length,
    requested
  };
}

export function calculateWoundPressure(target = {}) {
  const system = systemOf(target);
  const hitPoints = system.combat?.hitPoints ?? {};
  const current = numberOrZero(hitPoints.value);
  const max = Math.max(0, numberOrZero(hitPoints.max));
  const threshold = max > 0 ? Math.floor(max / 4) : 0;
  const active = max > 0 && current <= threshold;

  return {
    active,
    current,
    max,
    threshold
  };
}

export const ENERGY_USAGE_MODES = {
  tracked: "tracked",
  manual: "manual",
  disabled: "disabled"
};

export function getEnergyUsageMode() {
  try {
    const mode = game.settings.get("anime5e", "energyUsageMode");
    return Object.values(ENERGY_USAGE_MODES).includes(mode) ? mode : ENERGY_USAGE_MODES.tracked;
  } catch {
    return ENERGY_USAGE_MODES.tracked;
  }
}

export async function applyHitPointChange(actor, amount, mode = "damage") {
  const hitPoints = actor.system.combat.hitPoints;
  const current = Number(hitPoints.value) || 0;
  const max = Math.max(0, Number(hitPoints.max) || 0);
  const temporary = Math.max(0, Number(hitPoints.temporary) || 0);
  const minimum = -max;
  const change = safeAmount(amount);
  let next = current;
  let nextTemporary = temporary;
  let absorbed = 0;

  if (mode === "healing") {
    next = Math.min(max, current + change);
  } else {
    absorbed = Math.min(temporary, change);
    nextTemporary = temporary - absorbed;
    const remainingDamage = change - absorbed;
    next = Math.max(minimum, current - remainingDamage);
  }

  await actor.update({
    "system.combat.hitPoints.value": next,
    "system.combat.hitPoints.temporary": nextTemporary
  });
  return { amount: change, absorbed, current, max, next, temporary, nextTemporary };
}

export async function applyDeprivationLoss(actor, amount, mode = "apply") {
  const hitPoints = actor.system.combat.hitPoints;
  const current = Number(hitPoints.value) || 0;
  const baseMax = Math.max(0, Number(hitPoints.baseMax ?? hitPoints.max) || 0);
  const effectBonus = Number(hitPoints.effectBonus) || 0;
  const fullMax = Math.max(0, baseMax + effectBonus);
  const currentLoss = Math.max(0, Number(hitPoints.deprivationLoss) || 0);
  const requestedChange = safeAmount(amount) || 1;
  const nextLoss = mode === "recover"
    ? Math.max(0, currentLoss - requestedChange)
    : Math.min(fullMax, currentLoss + requestedChange);
  const change = Math.abs(nextLoss - currentLoss);
  const nextMax = Math.max(0, fullMax - nextLoss);
  const next = mode === "recover"
    ? Math.min(current, nextMax)
    : Math.max(-fullMax, Math.min(current - change, nextMax));

  await actor.update({
    "system.combat.hitPoints.deprivationLoss": nextLoss,
    "system.combat.hitPoints.value": next
  });

  return {
    amount: change,
    current,
    currentLoss,
    fullMax,
    mode,
    next,
    nextLoss,
    nextMax
  };
}

export async function applyEnergyChange(actor, amount, mode = "spend") {
  if (getEnergyUsageMode() === ENERGY_USAGE_MODES.disabled) {
    const energy = actor.system.combat.energy;
    const current = Math.max(0, Number(energy.value) || 0);
    const max = Math.max(0, Number(energy.max) || 0);
    return { amount: 0, current, max, next: current, disabled: true };
  }

  const energy = actor.system.combat.energy;
  const current = Math.max(0, Number(energy.value) || 0);
  const max = Math.max(0, Number(energy.max) || 0);
  const change = safeAmount(amount);
  const next = mode === "restore"
    ? Math.min(max, current + change)
    : Math.max(0, current - change);

  await actor.update({ "system.combat.energy.value": next });
  return { amount: change, current, max, next };
}

export async function applyShortRestRecovery(actor, { hitDiceSpent = 0, hitPointRecovery = 0, energyRecovery = 0 } = {}) {
  const hitPoints = actor.system.combat.hitPoints;
  const energy = actor.system.combat.energy;
  const hitDice = summarizeHitDice(actor.system);
  const spentDice = Math.min(safeAmount(hitDiceSpent), hitDice.available);
  const hpRecovery = safeAmount(hitPointRecovery);
  const energyEnabled = getEnergyUsageMode() !== ENERGY_USAGE_MODES.disabled;
  const energyAmount = energyEnabled ? safeAmount(energyRecovery) : 0;
  const currentHp = numberOrZero(hitPoints.value);
  const maxHp = Math.max(0, numberOrZero(hitPoints.max));
  const nextHp = Math.min(maxHp, currentHp + hpRecovery);
  const currentEnergy = Math.max(0, numberOrZero(energy.value));
  const maxEnergy = Math.max(0, numberOrZero(energy.max));
  const nextEnergy = energyEnabled ? Math.min(maxEnergy, currentEnergy + energyAmount) : currentEnergy;
  const nextSpent = Math.min(hitDice.total, hitDice.spent + spentDice);
  const update = {
    "system.combat.hitPoints.value": nextHp,
    "system.combat.hitDice.spent": nextSpent
  };

  if (energyEnabled) update["system.combat.energy.value"] = nextEnergy;

  await actor.update(update);

  return {
    energyAmount,
    energyDisabled: !energyEnabled,
    energyCurrent: currentEnergy,
    energyMax: maxEnergy,
    energyNext: nextEnergy,
    hitDiceAfter: nextSpent,
    hitDiceBefore: hitDice.spent,
    hitDiceSpent: spentDice,
    hitDiceTotal: hitDice.total,
    hpCurrent: currentHp,
    hpMax: maxHp,
    hpNext: nextHp,
    hpRecovery
  };
}

export async function applyLongRestRecovery(actor) {
  const hitPoints = actor.system.combat.hitPoints;
  const energy = actor.system.combat.energy;
  const hitDice = summarizeHitDice(actor.system);
  const energyEnabled = getEnergyUsageMode() !== ENERGY_USAGE_MODES.disabled;
  const currentHp = numberOrZero(hitPoints.value);
  const maxHp = Math.max(0, numberOrZero(hitPoints.max));
  const currentEnergy = Math.max(0, numberOrZero(energy.value));
  const maxEnergy = Math.max(0, numberOrZero(energy.max));
  const hitDiceRegained = hitDice.total > 0 ? Math.min(hitDice.spent, Math.max(1, Math.floor(hitDice.total / 2))) : 0;
  const nextSpent = Math.max(0, hitDice.spent - hitDiceRegained);
  const update = {
    "system.combat.hitPoints.value": maxHp,
    "system.combat.hitDice.spent": nextSpent
  };

  if (energyEnabled) update["system.combat.energy.value"] = maxEnergy;

  await actor.update(update);

  return {
    energyCurrent: currentEnergy,
    energyDisabled: !energyEnabled,
    energyMax: maxEnergy,
    energyNext: energyEnabled ? maxEnergy : currentEnergy,
    hitDiceAfter: nextSpent,
    hitDiceBefore: hitDice.spent,
    hitDiceRegained,
    hitDiceTotal: hitDice.total,
    hpCurrent: currentHp,
    hpMax: maxHp,
    hpNext: maxHp
  };
}
