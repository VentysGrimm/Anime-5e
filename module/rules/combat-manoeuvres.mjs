const SOURCE_BOOK = "Anime 5E Fifth Edition Core Rules";

const MODE_LABELS = {
  normal: "Normal",
  advantage: "Advantage",
  disadvantage: "Disadvantage"
};

const COMBAT_MANOEUVRE_GROUPS = [
  { id: "tactical", label: "Tactical Actions" },
  { id: "grappling", label: "Grappling" },
  { id: "calledShots", label: "Called Shots" },
  { id: "attack", label: "Attack Manoeuvres" }
];

const COMBAT_MANOEUVRES = [
  {
    id: "aim",
    category: "tactical",
    label: "Aim",
    actionType: "Tactical Action",
    sourcePage: 162,
    rollKind: "attack",
    rollMode: "advantage",
    summary: "Spend a round aiming a ranged weapon at one target. The next ranged attack against that target gains advantage; a second consecutive aim can add proficiency bonus to damage."
  },
  {
    id: "wait-opening",
    category: "tactical",
    label: "Wait For Opening",
    actionType: "Tactical Action",
    sourcePage: 162,
    rollKind: "attack",
    rollMode: "advantage",
    summary: "Study a melee foe for one round. The next melee attack against that foe gains advantage; a second consecutive round can add proficiency bonus to damage."
  },
  {
    id: "total-defence",
    category: "tactical",
    label: "Total Defence",
    actionType: "Tactical Action",
    sourcePage: 162,
    rollKind: "reminder",
    rollMode: "disadvantage",
    summary: "Focus completely on defence. Opponents suffer disadvantage on attacks against the character until the next action window."
  },
  {
    id: "grapple",
    category: "grappling",
    label: "Grapple",
    actionType: "Attack Action",
    sourcePage: 161,
    rollKind: "attack",
    rollMode: "normal",
    summary: "Make an unarmed attack while a hand or equivalent appendage is free. A hit grabs the target, deals no damage, and can impose attack/task disadvantages while held."
  },
  {
    id: "grapple-lock",
    category: "grappling",
    label: "Lock",
    actionType: "Grapple Manoeuvre",
    sourcePage: 161,
    rollKind: "reminder",
    rollMode: "normal",
    summary: "After a successful grab on a previous attack, choke, crush, or strangle the foe. The lock automatically hits and deals normal unarmed damage."
  },
  {
    id: "grapple-throw",
    category: "grappling",
    label: "Throw",
    actionType: "Grapple Manoeuvre",
    sourcePage: 161,
    rollKind: "attack",
    rollMode: "normal",
    summary: "After grabbing a foe, make a normal unarmed attack. On a hit, release and throw the target, adding extra damage and any situational falling or collision result."
  },
  {
    id: "grapple-pin",
    category: "grappling",
    label: "Pin",
    actionType: "Grapple Manoeuvre",
    sourcePage: 161,
    rollKind: "attack",
    rollMode: "normal",
    summary: "After grabbing a foe, make another grab-like attack to immobilise them. A pinned target suffers disadvantage to escape and cannot attack or defend."
  },
  {
    id: "grapple-disarm",
    category: "grappling",
    label: "Disarm By Grapple",
    actionType: "Grapple Manoeuvre",
    sourcePage: 161,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Grab a held weapon instead of the body. The attack has disadvantage; on a hit, the weapon is usually dislodged unless the defender keeps grip with a difficult Strength (Athletics) check."
  },
  {
    id: "called-disarm",
    category: "calledShots",
    label: "Called Shot: Disarm",
    actionType: "Attack Action",
    sourcePage: 166,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Attack a held weapon or object instead of dealing damage. On a hit, the target makes a Dexterity check against DC 15 to keep control."
  },
  {
    id: "called-vital",
    category: "calledShots",
    label: "Called Shot: Vital Spot",
    actionType: "Attack Action",
    sourcePage: 166,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Attack a living target's vital anatomy. On a hit, the attack deals double normal Hit Point loss."
  },
  {
    id: "called-weak-point",
    category: "calledShots",
    label: "Called Shot: Weak Point",
    actionType: "Attack Action",
    sourcePage: 166,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Target a known Weak Point. The attack has disadvantage, but the target AC is reduced by the Weak Point size before applying double damage on a hit."
  },
  {
    id: "called-location",
    category: "calledShots",
    label: "Called Shot: Location",
    actionType: "Attack Action",
    sourcePage: 166,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Target a specific non-vital location. Resolve it like a Weak Point size call, but successful hits do not add extra damage."
  },
  {
    id: "called-knockout",
    category: "calledShots",
    label: "Called Shot: Knock Out",
    actionType: "Attack Action",
    sourcePage: 166,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Attempt to knock the target unconscious. On a hit, the target makes a Constitution Saving Throw against DC 10; the attack deals quarter damage, minimum 1."
  },
  {
    id: "two-weapon",
    category: "attack",
    label: "Two-Weapon Fighting",
    actionType: "Attack Action",
    sourcePage: 167,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Attack with one one-handed weapon in each hand against the same target. Both attack rolls have disadvantage unless an appropriate Combat Technique removes it."
  },
  {
    id: "multiple-targets",
    category: "attack",
    label: "Multiple Targets",
    actionType: "Attack Action",
    sourcePage: 167,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Use one attack roll against two to four targets. Extra targets impose disadvantage and can reduce damage or remove the ability modifier from damage."
  },
  {
    id: "strike-to-wound",
    category: "attack",
    label: "Strike To Wound",
    actionType: "Attack Action",
    sourcePage: 167,
    rollKind: "attack",
    rollMode: "normal",
    summary: "Deliberately reduce delivered damage below normal, to a minimum of 1, when the DM agrees the attack form can be pulled."
  },
  {
    id: "total-attack",
    category: "attack",
    label: "Total Attack",
    actionType: "Attack Action",
    sourcePage: 167,
    rollKind: "attack",
    rollMode: "advantage",
    summary: "Focus completely on a single attack. The chosen attack gains advantage, and enemies gain advantage against the attacker for the rest of the round."
  },
  {
    id: "surprise-attack",
    category: "attack",
    label: "Surprise Attack",
    actionType: "Attack Action",
    sourcePage: 168,
    rollKind: "attack",
    rollMode: "advantage",
    summary: "Attack a target unaware of the incoming strike. The attack gains advantage; full surprise can also remove the target's positive Dexterity bonus from AC."
  },
  {
    id: "touch-target",
    category: "attack",
    label: "Touch Target",
    actionType: "Attack Action",
    sourcePage: 168,
    rollKind: "attack",
    rollMode: "advantage",
    summary: "Only try to touch the target rather than harm them. The attack gains advantage and can support touch-based Attributes or similar effects."
  },
  {
    id: "mounted-fast",
    category: "attack",
    label: "Mounted Fast Attack",
    actionType: "Attack Action",
    sourcePage: 168,
    rollKind: "attack",
    rollMode: "disadvantage",
    summary: "Attack while a mount is moving faster than its normal movement speed. The attack has disadvantage unless an appropriate Combat Technique removes it."
  }
];

const MANOEUVRES_BY_ID = new Map(COMBAT_MANOEUVRES.map((entry) => [entry.id, entry]));

const STATE_LABELS = {
  aim: "Aiming",
  "wait-opening": "Waiting For Opening",
  "total-defence": "Total Defence",
  grapple: "Grappling",
  "grapple-lock": "Locked",
  "grapple-throw": "Thrown / Released",
  "grapple-pin": "Pinned",
  "grapple-disarm": "Grappling Weapon"
};

const TACTICAL_ATTACK_BONUS_IDS = new Set(["aim", "wait-opening"]);

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeD20Mode(mode) {
  return MODE_LABELS[mode] ? mode : "normal";
}

export function getCombatManoeuvre(id) {
  return MANOEUVRES_BY_ID.get(id) ?? null;
}

export function getCombatManoeuvreGroups() {
  return COMBAT_MANOEUVRE_GROUPS.map((group) => ({
    ...group,
    entries: COMBAT_MANOEUVRES
      .filter((entry) => entry.category === group.id)
      .map((entry) => ({
        ...entry,
        canRoll: entry.rollKind === "attack",
        rollModeLabel: MODE_LABELS[normalizeD20Mode(entry.rollMode)]
      }))
  }));
}

export function combineD20Modes(...modes) {
  const normalized = modes.map(normalizeD20Mode).filter((mode) => mode !== "normal");
  if (!normalized.length) return "normal";
  if (normalized.includes("advantage") && normalized.includes("disadvantage")) return "normal";
  return normalized[0];
}

export function manoeuvreGrantsTacticalAttackBonus(id) {
  return TACTICAL_ATTACK_BONUS_IDS.has(id);
}

export function buildCombatManoeuvreState(manoeuvre, { target = "", attackName = "" } = {}) {
  if (!manoeuvre) return null;

  const targetName = String(target ?? "").trim();
  const targetLine = targetName ? ` Target: ${targetName}.` : "";
  const attackLine = attackName ? ` Attack row: ${attackName}.` : "";
  const state = {
    sourceId: manoeuvre.id,
    sourcePage: manoeuvre.sourcePage,
    target: targetName,
    tacticalAction: "",
    grappleState: "",
    notes: `${manoeuvre.summary}${targetLine}${attackLine}`.trim()
  };

  if (manoeuvre.category === "tactical") {
    state.tacticalAction = STATE_LABELS[manoeuvre.id] ?? manoeuvre.label;
  } else if (manoeuvre.category === "grappling") {
    state.grappleState = STATE_LABELS[manoeuvre.id] ?? manoeuvre.label;
  } else {
    state.notes = `${manoeuvre.label}: ${state.notes}`;
  }

  return state;
}

export function buildCombatManoeuvreChatContent(manoeuvre, { actor = null, rollMode = null, attackName = "" } = {}) {
  if (!manoeuvre) return "";

  const details = [
    { label: "Actor", value: actor?.name ?? "" },
    { label: "Action", value: manoeuvre.actionType },
    { label: "Roll Mode", value: rollMode ? MODE_LABELS[normalizeD20Mode(rollMode)] : MODE_LABELS[normalizeD20Mode(manoeuvre.rollMode)] },
    { label: "Attack Row", value: attackName },
    { label: "Source", value: `${SOURCE_BOOK}, PDF p. ${manoeuvre.sourcePage}` }
  ].filter((detail) => detail.value);

  const rows = details
    .map((detail) => `<dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>`)
    .join("");

  return `
    <article class="anime5e chat-card roll-card combat-manoeuvre-card">
      <h3>${escapeHtml(manoeuvre.label)}</h3>
      <p>${escapeHtml(manoeuvre.summary)}</p>
      <dl class="roll-summary">${rows}</dl>
    </article>
  `;
}

export function buildCombatManoeuvreStateChatContent(manoeuvre, state, { actor = null } = {}) {
  if (!manoeuvre || !state) return "";

  const details = [
    { label: "Actor", value: actor?.name ?? "" },
    { label: "Tactical", value: state.tacticalAction },
    { label: "Grapple", value: state.grappleState },
    { label: "Target", value: state.target },
    { label: "Source", value: `${SOURCE_BOOK}, PDF p. ${manoeuvre.sourcePage}` }
  ].filter((detail) => detail.value);
  const rows = details
    .map((detail) => `<dt>${escapeHtml(detail.label)}</dt><dd>${escapeHtml(detail.value)}</dd>`)
    .join("");

  return `
    <article class="anime5e chat-card roll-card combat-manoeuvre-card">
      <h3>${escapeHtml(manoeuvre.label)} State</h3>
      <p>${escapeHtml(state.notes)}</p>
      <dl class="roll-summary">${rows}</dl>
    </article>
  `;
}
