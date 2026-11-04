#!/usr/bin/env node
// Pulls the youth league schedule and standings from GameChanger's public
// (no login) league pages and writes src/data/youth/gamechanger.json.
//
// Run by .github/workflows/youth-data.yml every night and on game nights.
// Safe by design: if anything looks wrong, it exits with an error WITHOUT
// touching the data file, so the site keeps the last good data and the
// GitHub Action run shows as failed (GitHub emails the repo owner).
//
// Local test without network:  FIXTURE_DIR=path/to/fixtures node scripts/fetch-gamechanger.mjs
// (each fixture file is <orgId>.json with { org, teams, events, standings, teamGames })

import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = path.join(ROOT, 'src/data/youth/gamechanger.json');
const API = 'https://api.team-manager.gc.com/public';

// The two in-house leagues on GameChanger. Order here is display order.
const LEAGUES = [
  { key: 'jv', name: 'JV', orgId: 's0rXscDEqehF', gameNight: 'Wednesday', expectedTeams: 4, minGames: 20 },
  { key: 'varsity', name: 'Varsity', orgId: 'O95uji7lrSjE', gameNight: 'Monday', expectedTeams: 4, minGames: 20 },
];

const FIXTURE_DIR = process.env.FIXTURE_DIR;

async function getJson(url, attempts = 3) {
  let lastErr;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'qvgirlsbasketball.org schedule updater' },
        signal: AbortSignal.timeout(20000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise(r => setTimeout(r, 2000 * i));
    }
  }
  throw lastErr;
}

async function loadLeagueRaw(league) {
  if (FIXTURE_DIR) {
    return JSON.parse(await readFile(path.join(FIXTURE_DIR, `${league.orgId}.json`), 'utf8'));
  }
  const base = `${API}/organizations/${league.orgId}`;
  const [org, teams, events, standings] = await Promise.all([
    getJson(base),
    getJson(`${base}/teams`),
    getJson(`${base}/events`),
    getJson(`${base}/standings`),
  ]);
  // Per-team game lists are only used to pick up final scores. If one fails we
  // carry on and keep whatever scores we had before for those games.
  const teamGames = {};
  for (const t of Array.isArray(teams) ? teams : []) {
    try {
      teamGames[t.id] = await getJson(`${API}/teams/${t.id}/games`);
    } catch (err) {
      console.warn(`warning: could not read games for team ${t.name}: ${err.message}`);
    }
  }
  return { org, teams, events, standings, teamGames };
}

const num = v => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && v.trim() !== '' && Number.isFinite(Number(v)) ? Number(v) : null);

// GameChanger's public game list doesn't document a score field, and no game
// has been played yet this season, so look for the shapes it commonly uses.
// Returns { us, them } from that team's point of view, or null.
function extractScore(g) {
  const pairs = [
    [g?.score?.team, g?.score?.opponent_team],
    [g?.score?.team, g?.score?.opponent],
    [g?.team_score, g?.opponent_score],
    [g?.score?.us, g?.score?.them],
    [g?.final_score?.team, g?.final_score?.opponent_team],
  ];
  for (const [a, b] of pairs) {
    if (num(a) !== null && num(b) !== null) return { us: num(a), them: num(b) };
  }
  return null;
}

function isFinal(g) {
  const s = String(g?.game_status ?? g?.status ?? '').toLowerCase();
  return s === 'completed' || s === 'final' || s === 'complete';
}

function buildLeague(league, raw, previous) {
  const problems = [];
  const { teams, events, standings, teamGames = {} } = raw;

  if (!Array.isArray(teams) || teams.length !== league.expectedTeams) {
    problems.push(`${league.name}: expected ${league.expectedTeams} teams, got ${Array.isArray(teams) ? teams.length : 'none'}`);
  }
  if (!Array.isArray(events) || events.length < league.minGames) {
    problems.push(`${league.name}: expected at least ${league.minGames} games, got ${Array.isArray(events) ? events.length : 'none'}`);
  }
  if (!Array.isArray(standings) || standings.length !== (teams?.length ?? -1)) {
    problems.push(`${league.name}: standings has ${Array.isArray(standings) ? standings.length : 'no'} rows for ${teams?.length ?? 0} teams`);
  }
  if (problems.length) return { problems };

  const teamName = new Map(teams.map(t => [t.id, t.name]));

  // Scores keyed by event id, from each team's own game list.
  const scores = new Map();
  for (const [teamId, list] of Object.entries(teamGames)) {
    if (!Array.isArray(list)) continue;
    for (const g of list) {
      const s = extractScore(g);
      if (!s || !g?.id) continue;
      const home = g.home_away === 'home';
      const entry = scores.get(g.id) ?? {};
      if (home) Object.assign(entry, { homeScore: s.us, awayScore: s.them });
      else Object.assign(entry, { homeScore: s.them, awayScore: s.us });
      if (isFinal(g)) entry.final = true;
      entry.teamId = teamId;
      scores.set(g.id, entry);
    }
  }
  const prevGames = new Map((previous?.games ?? []).map(g => [g.id, g]));

  const games = [];
  for (const e of events) {
    const home = e?.home_team?.name ?? teamName.get(e?.home_team?.id);
    const away = e?.away_team?.name ?? teamName.get(e?.away_team?.id);
    const start = e?.start_ts;
    if (!e?.id || !home || !away || !start || Number.isNaN(Date.parse(start))) {
      problems.push(`${league.name}: game ${e?.id ?? '(no id)'} is missing a team or start time`);
      continue;
    }
    const s = scores.get(e.id);
    const prev = prevGames.get(e.id);
    const homeScore = s?.homeScore ?? prev?.homeScore ?? null;
    const awayScore = s?.awayScore ?? prev?.awayScore ?? null;
    games.push({
      id: e.id,
      start: new Date(start).toISOString(),
      home,
      away,
      location: e?.location?.name ?? '',
      homeScore,
      awayScore,
      final: Boolean(s?.final ?? prev?.final ?? false),
    });
  }
  games.sort((a, b) => a.start.localeCompare(b.start) || a.location.localeCompare(b.location));

  const table = standings.map(r => {
    const o = r.overall ?? {};
    const st = r.streak ?? {};
    const rec = x => `${x?.wins ?? 0}-${x?.losses ?? 0}${x?.ties ? `-${x.ties}` : ''}`;
    return {
      team: teamName.get(r.team_id) ?? r.team_id,
      w: o.wins ?? 0,
      l: o.losses ?? 0,
      t: o.ties ?? 0,
      pct: typeof r.winning_pct === 'number' ? r.winning_pct : 0,
      home: rec(r.home),
      away: rec(r.away),
      // GameChanger calls points "runs" in its shared standings format.
      pf: r.runs?.scored ?? 0,
      pa: r.runs?.allowed ?? 0,
      streak: st.count ? `${st.type === 'loss' ? 'L' : st.type === 'tie' ? 'T' : 'W'}${st.count}` : '',
    };
  });
  if (standings.some(r => !teamName.has(r.team_id))) {
    problems.push(`${league.name}: standings list a team that isn't in the league`);
  }
  table.sort((a, b) => b.pct - a.pct || b.w - a.w || a.l - b.l || a.team.localeCompare(b.team));
  const leader = table[0];
  for (const r of table) {
    const gb = ((leader.w - r.w) + (r.l - leader.l)) / 2;
    r.gb = gb <= 0 ? '' : String(gb);
  }

  return {
    problems,
    league: {
      key: league.key,
      name: league.name,
      orgId: league.orgId,
      gameNight: league.gameNight,
      teams: teams.map(t => t.name),
      games,
      standings: table,
    },
  };
}

async function main() {
  const previous = existsSync(OUT_FILE) ? JSON.parse(await readFile(OUT_FILE, 'utf8')) : null;
  const leagues = [];
  const problems = [];

  for (const league of LEAGUES) {
    let raw;
    try {
      raw = await loadLeagueRaw(league);
    } catch (err) {
      problems.push(`${league.name}: could not reach GameChanger (${err.message})`);
      continue;
    }
    const prev = previous?.leagues?.find(l => l.key === league.key);
    const result = buildLeague(league, raw, prev);
    problems.push(...result.problems);
    if (result.league) leagues.push(result.league);
  }

  if (problems.length) {
    console.error('Not updating the youth schedule. The site keeps its last good data.');
    for (const p of problems) console.error(` - ${p}`);
    process.exit(1);
  }

  const unchanged = previous && JSON.stringify(previous.leagues) === JSON.stringify(leagues);
  if (unchanged) {
    console.log('GameChanger data unchanged. Nothing to write.');
    return;
  }

  const out = { source: 'GameChanger public league pages', fetchedAt: new Date().toISOString(), leagues };
  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + '\n');
  const gameCount = leagues.reduce((n, l) => n + l.games.length, 0);
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}: ${leagues.length} leagues, ${gameCount} games.`);
}

main().catch(err => {
  console.error('Not updating the youth schedule. The site keeps its last good data.');
  console.error(err);
  process.exit(1);
});
