function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function detailRow(label, value) {
  if (value === null || value === undefined || value === "") return "";
  return `<dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd>`;
}

export function buildAdventuringRiskChatContent(item) {
  const system = item.system ?? {};
  const source = [system.source, system.sourcePage ? `p. ${system.sourcePage}` : null].filter(Boolean).join(", ");
  const description = hasText(system.description) ? `<p>${escapeHtml(system.description)}</p>` : "";
  const sourceLine = source ? `<p><small>${escapeHtml(source)}</small></p>` : "";
  const rows = [
    detailRow("Category", system.category),
    detailRow("Status", system.status),
    detailRow("DC", system.dc),
    detailRow("Save", system.save),
    detailRow("Interval", system.interval),
    detailRow("Onset", system.onset),
    detailRow("Duration", system.duration),
    detailRow("Damage", system.damage),
    detailRow("Damage Roll", system.damageRoll),
    detailRow("Damage Type", system.damageType),
    detailRow("Effect", system.effect),
    detailRow("Notes", system.riskNotes)
  ].join("");
  const details = rows ? `<dl class="risk-reminder-summary">${rows}</dl>` : "";

  return `${description}${details}${sourceLine}`;
}
