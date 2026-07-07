function safeAmount(amount) {
  return Math.max(0, Math.trunc(Number(amount) || 0));
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
