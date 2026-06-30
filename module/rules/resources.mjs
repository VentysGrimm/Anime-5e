function safeAmount(amount) {
  return Math.max(0, Math.trunc(Number(amount) || 0));
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
