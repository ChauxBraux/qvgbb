// The sponsorship year currently shown on the site. A sponsor's `year` is the
// fall the season starts, so 2026 means the 2026-2027 season.
export const CURRENT_SPONSOR_YEAR = 2026;

export function seasonLabel(year: number): string {
  return `${year}-${year + 1}`;
}
