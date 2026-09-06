// World Tour Finals (AtCoder official onsite finals), Algorithm division only.
//
// Seeded contest_id values carry a trailing "-open" (e.g. wtf19-open), except
// wtf22-day2 which AtCoder Problems records without it; strip it before matching
// so both forms work and it never leaks into the display label.
//
// From 2025 the id gains an "algo" infix (awtf2025algo-open) to disambiguate
// from the new Heuristic division (awtf2025heuristic), which stays out of scope.
const regexForWorldTourFinals = /^(wtf19|wtf22-day[12]|awtf2024|awtf20\d{2}algo)$/;

export const stripOpenSuffix = (contestId: string): string =>
  contestId.endsWith('-open') ? contestId.slice(0, -'-open'.length) : contestId;

export const isWorldTourFinals = (contestId: string): boolean =>
  regexForWorldTourFinals.test(stripOpenSuffix(contestId));

export const getWorldTourFinalsLabel = (contestId: string): string => {
  const base = 'World Tour Finals';
  const id = stripOpenSuffix(contestId);

  if (id === 'wtf19') {
    return `${base} 2019`;
  }

  const dayMatch = /^wtf22-day([12])$/.exec(id);

  if (dayMatch) {
    return `${base} 2022 Day${dayMatch[1]}`;
  }

  if (id === 'awtf2024') {
    return `${base} 2024`;
  }

  const algoMatch = /^awtf(20\d{2})algo$/.exec(id);

  if (algoMatch) {
    // "Algorithm" distinguishes from the Heuristic division, introduced in 2025.
    return `${base} ${algoMatch[1]} Algorithm`;
  }

  return contestId.toUpperCase();
};
