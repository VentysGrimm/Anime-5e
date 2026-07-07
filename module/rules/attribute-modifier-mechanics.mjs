import { calculateAttributeCustomization } from "./points.mjs";

const ATTRIBUTE_TYPES = new Set(["attribute", "weapon"]);

const MECHANICS = {
  "core.enhancement.area": {
    label: "Area",
    tag: (count) => `Area ${count}`,
    automation: "Adds area scope; set targets or affected area when the Attribute is used."
  },
  "core.enhancement.duration": {
    label: "Duration",
    tag: (count) => `Duration ${count}`,
    automation: "Extends duration; use duration and remaining-time fields for active effects."
  },
  "core.enhancement.potent": {
    label: "Potent",
    tag: (count) => `Potent ${count}`,
    automation: "Adjusts effective Rank for Rank 1 Attributes after Limiters."
  },
  "core.enhancement.range": {
    label: "Range",
    tag: (count) => `Range ${count}`,
    automation: "Adds ranged use; set exact range or scope when the Attribute is used."
  },
  "core.enhancement.targets": {
    label: "Targets",
    tag: (count) => `Targets ${count}`,
    automation: "Allows multiple targets; record affected targets for active effects."
  },
  "core.limiter.activation": {
    label: "Activation",
    tag: (count) => `Activation ${count}`,
    automation: "Requires preparation before use; record prep state in tracking notes."
  },
  "core.limiter.assisted": {
    label: "Assisted",
    tag: (count) => `Assisted ${count}`,
    automation: "Requires assistants; record present assistants before applying the effect."
  },
  "core.limiter.backlash": {
    label: "Backlash",
    tag: (count) => `Backlash ${count}`,
    automation: "Adds failure or miss consequences for GM adjudication."
  },
  "core.limiter.charges": {
    label: "Charges",
    tag: (count) => `Charges ${count}`,
    automation: "Requires limited-use tracking; record charges in tracking notes."
  },
  "core.limiter.concentration": {
    label: "Concentration",
    tag: (count) => `Concentration ${count}`,
    automation: "Requires ongoing focus; track broken concentration and remaining duration."
  },
  "core.limiter.consumable": {
    label: "Consumable",
    tag: (count) => `Consumable ${count}`,
    automation: "Consumes a focus or material; record consumed resources in tracking notes."
  },
  "core.limiter.dependent": {
    label: "Dependent",
    tag: (count) => `Dependent ${count}`,
    automation: "Requires another effect to be active before this effect applies."
  },
  "core.limiter.deplete": {
    label: "Deplete",
    tag: (count) => `Deplete ${count}`,
    automation: "Requires Energy payment; set Energy Cost for exact tracked spending."
  },
  "core.limiter.detectable": {
    label: "Detectable",
    tag: (count) => `Detectable ${count}`,
    automation: "Adds detectable traces; include the detection method in notes."
  },
  "core.limiter.emotional": {
    label: "Emotional",
    tag: (count) => `Emotional ${count}`,
    automation: "Requires emotional trigger; record the active trigger in tracking notes."
  },
  "core.limiter.environmental": {
    label: "Environmental",
    tag: (count) => `Environmental ${count}`,
    automation: "Requires a specific environment or condition before the effect applies."
  },
  "core.limiter.equipment": {
    label: "Equipment",
    tag: (count) => `Equipment ${count}`,
    automation: "Requires supporting gear; record the required item or fixture."
  },
  "core.limiter.imbue": {
    label: "Imbue",
    tag: (count) => `Imbue ${count}`,
    automation: "Grants use to others; record the imbued target and duration."
  },
  "core.limiter.irreversible": {
    label: "Irreversible",
    tag: (count) => `Irreversible ${count}`,
    automation: "Restricts reversal; record the reversal condition."
  },
  "core.limiter.maximum": {
    label: "Maximum",
    tag: (count) => `Maximum ${count}`,
    automation: "Forces maximum output; use effective Rank as the active strength."
  },
  "core.limiter.object": {
    label: "Object",
    tag: (count) => `Object ${count}`,
    automation: "Limits an Item-contained Attribute; record the object beneficiary."
  },
  "core.limiter.permanent": {
    label: "Permanent",
    tag: (count) => `Permanent ${count}`,
    automation: "Keeps the effect always on; leave effect active unless suppressed by story state."
  },
  "core.limiter.recovery": {
    label: "Recovery",
    tag: (count) => `Recovery ${count}`,
    automation: "Requires downtime between uses; record next available use in tracking notes."
  },
  "core.limiter.semi-permanent": {
    label: "Semi-Permanent",
    tag: (count) => `Semi-Permanent ${count}`,
    automation: "Normally active but suppressible; record Energy suppression state."
  },
  "core.limiter.unique-limiter": {
    label: "Unique Limiter",
    tag: (count) => `Unique Limiter ${count}`,
    automation: "Custom restriction; describe the exact mechanical trigger in notes."
  },
  "core.limiter.unpredictable": {
    label: "Unpredictable",
    tag: (count) => `Unpredictable ${count}`,
    automation: "Requires a check or unreliable outcome; record the check and failure state."
  }
};

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function positiveInteger(value) {
  return Math.max(0, Math.trunc(numberOrZero(value)));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function stripHtml(value) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function referenceKey(reference, type) {
  const sourceId = String(reference?.sourceId ?? "").trim().toLowerCase();
  if (sourceId) return sourceId;

  const name = normalizeName(reference?.name);
  if (!name) return "";
  return type === "limiter" ? `core.limiter.${name}` : `core.enhancement.${name}`;
}

function fallbackMechanic(reference, type) {
  const label = String(reference?.name ?? (type === "limiter" ? "Limiter" : "Enhancement")).trim();
  return {
    label,
    tag: (count) => `${label} ${count}`,
    automation: type === "limiter"
      ? "Adjusts effective Rank and adds a table-defined restriction for GM adjudication."
      : "Adjusts effective Rank and adds a table-defined benefit for GM adjudication."
  };
}

function buildMechanicEntry(reference, type) {
  const assignmentCount = positiveInteger(reference?.assignmentCount);
  const key = referenceKey(reference, type);
  const mechanic = MECHANICS[key] ?? fallbackMechanic(reference, type);
  const rulesNotes = stripHtml(reference?.rulesNotes) || stripHtml(reference?.notes);

  return {
    type,
    key,
    name: String(reference?.name || mechanic.label).trim(),
    sourceId: String(reference?.sourceId ?? "").trim(),
    assignmentCount,
    assignmentLabel: String(assignmentCount),
    pointModifier: numberOrZero(reference?.pointModifier),
    tag: mechanic.tag(assignmentCount),
    automation: mechanic.automation,
    rulesNotes,
    unresolved: String(reference?.notes ?? "").toLowerCase().includes("unresolved")
      || (!reference?.sourceId && !reference?.uuid)
  };
}

export function calculateEffectiveAttributeRank(item) {
  return calculateAttributeCustomization(item).effectiveRank;
}

export function buildAttributeModifierMechanics(item) {
  const type = item?.type ?? "";
  const system = item?.system ?? item ?? {};
  if (!ATTRIBUTE_TYPES.has(type)) {
    return { active: false, hasEntries: false, entries: [], tags: [], warnings: [] };
  }

  const entries = [
    ...asArray(system.enhancementReferences).map((reference) => buildMechanicEntry(reference, "enhancement")),
    ...asArray(system.limiterReferences).map((reference) => buildMechanicEntry(reference, "limiter"))
  ];
  const customization = calculateAttributeCustomization(item);
  const warnings = entries
    .filter((entry) => entry.unresolved)
    .map((entry) => `${entry.name} mechanic reference is unresolved.`);
  const rankChanged = customization.actualRank !== customization.effectiveRank;

  return {
    active: entries.length > 0 || rankChanged,
    hasEntries: entries.length > 0,
    entries,
    tags: [
      rankChanged ? `Effective Rank ${customization.effectiveRank}` : null,
      ...entries.map((entry) => entry.tag)
    ].filter(Boolean),
    actualRank: customization.actualRank,
    effectiveRank: customization.effectiveRank,
    rankChanged,
    warnings
  };
}
