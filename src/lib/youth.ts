// Helpers for the youth league page (/youth).
// Games and standings come from src/data/youth/gamechanger.json (written by
// scripts/fetch-gamechanger.mjs). Practices come from src/data/youth/practices.json.

export const TZ = 'America/New_York';

export type Game = {
  id: string;
  start: string; // ISO, UTC
  home: string;
  away: string;
  location: string;
  homeScore: number | null;
  awayScore: number | null;
  final: boolean;
};

export type StandingRow = {
  team: string;
  w: number;
  l: number;
  t: number;
  pct: number;
  home: string;
  away: string;
  pf: number;
  pa: number;
  streak: string;
  gb: string;
};

export type League = {
  key: string;
  name: string;
  orgId: string;
  gameNight: string;
  teams: string[];
  games: Game[];
  standings: StandingRow[];
};

export type GameChangerData = { source: string; fetchedAt: string; leagues: League[] };

export type PracticeSlot = {
  team: string;
  league: string;
  day: string;
  start: string; // HH:MM, Eastern
  end: string;
  location: string;
  from: string; // YYYY-MM-DD
  until?: string;
  confirmed: boolean;
};

export type PracticeData = {
  seasonEnd: string;
  skipDates: { from: string; to: string; reason: string }[];
  slots: PracticeSlot[];
};

export type DayItem = {
  kind: 'game' | 'practice';
  league: string;
  teams: string[];
  sortKey: string; // ISO start, for ordering within a day
  time: string; // "6:15 PM"
  endTime?: string;
  title: string;
  location: string;
  score?: string;
};

export type Day = { date: string; label: string; items: DayItem[]; note?: string };

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** YYYY-MM-DD for an instant, in Eastern time. */
export function easternDate(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

/** "6:15 PM" for an instant, in Eastern time. */
export function easternTime(d: Date): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' }).format(d);
}

/** Add days to a YYYY-MM-DD string (calendar math, no time zone involved). */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return t.toISOString().slice(0, 10);
}

function weekdayOf(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { timeZone: 'UTC', weekday: 'long', month: 'short', day: 'numeric' }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** "18:15" -> "6:15 PM" */
function clock(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${suffix}`;
}

function skipReason(date: string, practices: PracticeData): string | undefined {
  return practices.skipDates.find(s => date >= s.from && date <= s.to)?.reason;
}

/**
 * Every day from `from` to `to` (inclusive, YYYY-MM-DD) with that day's games
 * and confirmed practices, in time order.
 */
export function buildDays(data: GameChangerData, practices: PracticeData, from: string, to: string): Day[] {
  const byDate = new Map<string, DayItem[]>();
  const push = (date: string, item: DayItem) => {
    if (date < from || date > to) return;
    (byDate.get(date) ?? byDate.set(date, []).get(date)!).push(item);
  };

  for (const league of data.leagues) {
    for (const g of league.games) {
      const start = new Date(g.start);
      const hasScore = g.homeScore !== null && g.awayScore !== null;
      push(easternDate(start), {
        kind: 'game',
        league: league.name,
        teams: [g.home, g.away],
        sortKey: g.start,
        time: easternTime(start),
        title: `${g.away} at ${g.home}`,
        location: g.location,
        score: hasScore ? `${g.away} ${g.awayScore}, ${g.home} ${g.homeScore}${g.final ? ' (final)' : ''}` : undefined,
      });
    }
  }

  const last = practices.seasonEnd < to ? practices.seasonEnd : to;
  for (let date = from; date <= last; date = addDays(date, 1)) {
    if (skipReason(date, practices)) continue;
    const weekday = weekdayOf(date);
    for (const s of practices.slots) {
      if (!s.confirmed || s.day !== weekday) continue;
      if (date < s.from || (s.until && date > s.until)) continue;
      push(date, {
        kind: 'practice',
        league: s.league,
        teams: [s.team],
        sortKey: `${date}T${s.start}`,
        time: clock(s.start),
        endTime: clock(s.end),
        title: `${s.team} practice`,
        location: s.location,
      });
    }
  }

  const days: Day[] = [];
  for (let date = from; date <= to; date = addDays(date, 1)) {
    const items = (byDate.get(date) ?? []).sort((a, b) => {
      // Games carry UTC ISO times and practices carry local times, so compare by
      // the displayed clock time within a day.
      const mins = (t: string) => {
        const [hm, ap] = t.split(' ');
        const [h, m] = hm.split(':').map(Number);
        return ((h % 12) + (ap === 'PM' ? 12 : 0)) * 60 + m;
      };
      return mins(a.time) - mins(b.time) || a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title);
    });
    days.push({ date, label: dayLabel(date), items, note: items.length ? undefined : skipReason(date, practices) });
  }
  return days;
}

/** First game date (Eastern) for a league, e.g. "Monday, Nov 16". */
export function firstGameLabel(league: League): string | undefined {
  const first = league.games[0];
  return first ? dayLabel(easternDate(new Date(first.start))) : undefined;
}

export function formatPct(p: number): string {
  return p.toFixed(3).replace(/^0/, '');
}
