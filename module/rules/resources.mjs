function safeAmount(amount) {
  return Math.max(0, Math.trunc(Number(amount) || 0));
}

export async function applyHitPointChange(actor, amount, mode = "damage") {
  const hitPoints = actor.system.combat.hitPoints;
  const current = Number(hitPoints.value) || 0;
  const max = Math.max(0, Number(hitPoints.max) || 0);
  const minimum = -max;
  const change = safeAmount(amount);
  const next = mode === "healing"
    ? Math.min(max, current + change)
    : Math.max(minimum, current - change);

  await actor.update({ "system.combat.hitPoints.value": next });
  return { amount: change, current, max, next };
}

export async function applyEnergyChange(actor, amount, mode = "spend") {
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
