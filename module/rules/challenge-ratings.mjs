export const CHALLENGE_RATING_TABLE = Object.freeze([
  { cr: "0", minPoints: 0, maxPoints: 50, xp: 10, xpLabel: "0 or 10" },
  { cr: "1/8", minPoints: 51, maxPoints: 65, xp: 25 },
  { cr: "1/4", minPoints: 66, maxPoints: 80, xp: 50 },
  { cr: "1/2", minPoints: 81, maxPoints: 95, xp: 100 },
  { cr: "1", minPoints: 96, maxPoints: 110, xp: 200 },
  { cr: "2", minPoints: 111, maxPoints: 120, xp: 450 },
  { cr: "3", minPoints: 121, maxPoints: 130, xp: 700 },
  { cr: "4", minPoints: 131, maxPoints: 140, xp: 1100 },
  { cr: "5", minPoints: 141, maxPoints: 150, xp: 1800 },
  { cr: "6", minPoints: 151, maxPoints: 160, xp: 2300 },
  { cr: "7", minPoints: 161, maxPoints: 170, xp: 2900 },
  { cr: "8", minPoints: 171, maxPoints: 180, xp: 3900 },
  { cr: "9", minPoints: 181, maxPoints: 190, xp: 5000 },
  { cr: "10", minPoints: 191, maxPoints: 200, xp: 5900 },
  { cr: "11", minPoints: 201, maxPoints: 220, xp: 7200 },
  { cr: "12", minPoints: 221, maxPoints: 240, xp: 8400 },
  { cr: "13", minPoints: 241, maxPoints: 260, xp: 10000 },
  { cr: "14", minPoints: 261, maxPoints: 280, xp: 11500 },
  { cr: "15", minPoints: 281, maxPoints: 300, xp: 13000 },
  { cr: "16", minPoints: 301, maxPoints: 320, xp: 15000 },
  { cr: "17", minPoints: 321, maxPoints: 340, xp: 18000 },
  { cr: "18", minPoints: 341, maxPoints: 360, xp: 20000 },
  { cr: "19", minPoints: 361, maxPoints: 380, xp: 22000 },
  { cr: "20", minPoints: 381, maxPoints: 400, xp: 25000 },
  { cr: "21", minPoints: 401, maxPoints: 425, xp: 33000 },
  { cr: "22", minPoints: 426, maxPoints: 450, xp: 41000 },
  { cr: "23", minPoints: 451, maxPoints: 475, xp: 50000 },
  { cr: "24", minPoints: 476, maxPoints: 500, xp: 62000 },
  { cr: "25", minPoints: 501, maxPoints: 525, xp: 75000 },
  { cr: "26", minPoints: 526, maxPoints: 550, xp: 90000 },
  { cr: "27", minPoints: 551, maxPoints: 575, xp: 105000 },
  { cr: "28", minPoints: 576, maxPoints: 600, xp: 120000 },
  { cr: "29", minPoints: 601, maxPoints: 650, xp: 135000 },
  { cr: "30", minPoints: 651, maxPoints: 700, xp: 155000 }
]);

function safePoints(value) {
  return Math.max(0, Math.trunc(Number(value) || 0));
}

export function parseChallengeRating(value) {
  const text = String(value ?? "").trim();
  if (!text) return 0;

  const fraction = text.match(/^(\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (fraction) {
    const numerator = Number(fraction[1]);
    const denominator = Number(fraction[2]);
    return denominator ? numerator / denominator : 0;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

export function challengeRatingForPoints(points) {
  const total = safePoints(points);
  const row = CHALLENGE_RATING_TABLE.find((entry) => total >= entry.minPoints && total <= entry.maxPoints);
  if (row) return { ...row, points: total, beyondTable: false };

  const highest = CHALLENGE_RATING_TABLE.at(-1);
  return {
    ...highest,
    cr: `${highest.cr}+`,
    points: total,
    beyondTable: true,
    note: "Above Table 27; use CR 30+ until the DM assigns an epic value."
  };
}

export function xpForChallengeRating(challengeRating) {
  const numeric = parseChallengeRating(challengeRating);
  const row = CHALLENGE_RATING_TABLE.find((entry) => parseChallengeRating(entry.cr) === numeric);
  return row?.xp ?? 0;
}
