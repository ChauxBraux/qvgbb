// Single source of truth for the active raffle campaign.
// To run this raffle again next year, just bump the dates and the prize list.
// To end the campaign early, set `active` to false or move `endsAt` to a past date.

export const raffle: {
  active: boolean;
  winner?: string;
  title: string;
  tagline: string;
  ticketPrice: string;
  drawDate: string;
  endsAt: Date;
  zeffyUrl: string;
  heroImage: string;
  prizes: string[];
} = {
  active: false,
  winner: 'Samuel Thomas',
  title: "Father's Day Golf Raffle",
  tagline: 'Win a premium golf package — drawing Father\'s Day, June 21',
  ticketPrice: '$20 per chance',
  drawDate: 'Father\'s Day, June 21, 2026 at 5 p.m.',
  // Auto-hide after this moment (Eastern time, 5pm draw).
  endsAt: new Date('2026-06-21T22:00:00Z'),
  zeffyUrl: 'https://www.zeffy.com/en-US/ticketing/fathers-day-golf-raffle--2026',
  heroImage: '/images/raffle-hero.jpg',
  prizes: [
    'One foursome of golf at Shannopin Country Club with cart',
    'One foursome of golf at Beaver Valley Golf Club with cart',
    'PING G440 LST driver, 10.5° ($619 retail value)',
    'Odyssey Ai-ONE Jailbird CRUISER putter, 38" ($300 retail value)',
    'Beaver Valley Golf Club rain jacket ($80 retail value)',
  ],
};

export function isRaffleLive(now: Date = new Date()): boolean {
  return raffle.active && now < raffle.endsAt;
}
