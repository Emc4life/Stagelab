# 🪩 DWTS Fantasy League

A mobile-first fantasy league app for **Dancing with the Stars — Season 35 (2026)**, built as a digital replacement for the league's official Excel workbook. Five players draft the 16 couples, score every episode live, lock in private side bets, and race to the Mirrorball.

**No server, no accounts, no build step** — plain HTML/CSS/JS modules. Open it and dance.

## ✨ Features

| Tab | What it does |
| --- | --- |
| 🏆 **Standings** | Live leaderboard: weekly pts + milestone/finale bonuses + side bets − free-agent penalty, plus a per-episode points grid |
| 📋 **Tracker** | Episode-by-episode scoring for every drafted couple — toggles and counters for all 12 weekly categories, points calculated instantly |
| 🎯 **Draft** | Tap-to-pick snake draft (15 picks). The leftover couple becomes the Free Agent |
| 🔁 **Free Agent** | One-time recruitment of the undrafted couple after Week 1 (−5 pts, starts earning the next episode) |
| 🎲 **Side Bets** | First eliminated (+6), first 10 (+7), first cry (+4), first perfect score (+8) — picks + actuals, auto-graded |
| ✨ **Milestones** | Top 8 / Top 6 / finale bonuses and final placement up to +20 for the Mirrorball winner (bonuses stack) |
| ⚙️ **Setup** | League name, 5 player names, the 16 couples (pre-loaded with the real Season 35 cast), episode dates, export/import/reset |
| 📖 **Rules** | The complete scoring key and house rules from the league spreadsheet |

## 🎯 Scoring (matches the league workbook)

**Weekly:** survive +1 · judges' leaderboard #1/+3, #2/+2, #3/+1 (don't stack) · dance with a 10 +1 each · perfect score +3 each · dance-off win +2 · immunity +2 · "best dance" +2 · judge booed +2 · shirt off +2 · "sexy" +1 each · safe last +1 · opens show +1

**Milestones/finale:** Top 8 +2 · Top 6 +4 · finale +7 · 4th +4 · 3rd +7 · 2nd +12 · Mirrorball +20 (cumulative — 5th place gets the finale bonus only)

**Free Agent:** claimable after Episode 1 only if one of your couples was eliminated; −5 point penalty; earns from the next episode; once per season.

## 🚀 Run it

Any static file server works:

```bash
# option 1: python
python3 -m http.server 8000

# option 2: node
npx serve .
```

Then open `http://localhost:8000`. (ES modules require `http://` — double-clicking `index.html` from disk won't work in most browsers.)

## 💾 Data

Everything is stored in the browser's `localStorage`. Use **Setup → Export backup** to save/share the league as JSON and **Import backup** to restore it on another device.

*Unofficial fan project — scores follow the official league spreadsheet; when in doubt, the result DWTS publishes controls.*
