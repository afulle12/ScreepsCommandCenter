# Screeps Command Center

A single-file, browser-based toolkit for Screeps players. No build step, no dependencies, no server — open `index.html` and everything runs client-side. It bundles five utilities for planning offensives, sizing creeps, timing events, and visualizing market activity across the world map.

## Features

**Tick ETA** — Convert a tick count into real-world duration given the current seconds-per-tick rate. Shows a day/hour/minute/second breakdown, optional your-timezone vs. enemy-timezone arrival comparison, and a live countdown that persists across page reloads (via `localStorage`).

**Time → Ticks** — The inverse: pick a target date and time of day, and get the number of ticks until then plus the human-readable time remaining. Includes a custom spinner-based time picker.

**Nuke Simulator** — Paste a nuke cost analysis report and get an interactive grid map of the blast zone. Each structure tile is color-coded by rampart status (no rampart / weak single / weak stacked / protected), with hover tooltips showing rampart HP, building HP, stacked damage, and survival status. Click a tile to jump to its entry in the damage report. Produces a summary (destroyed / defended / exposed / safe / total damage) and a sortable per-structure breakdown. Supports stacked-nuke damage math (full damage at center, half in the surrounding radius).

**Body Calculator** — Build out creep bodies part-by-part with role templates (harvester, hauler, upgrader, attacker, ranger, healer). Reports total energy cost, body size against the 50-part cap, and spawn time, plus an auto-optimizer for CARRY/MOVE pairs against an energy budget.

**Market Map** — Paste a room trading summary and render a pan/zoom world map of net exporters (green) and importers (red), with circle size scaled to absolute net flow. Highlights highway rooms, crossroads, source-keeper rings, and center-sector rooms. Filter by trade direction, NPC order source (approximated from sector crossroads), and available resource. Click rooms for detail, with snapshot metadata parsed from the report.

## Usage

Open `index.html` in any modern browser. Each tab is self-contained. For the data-driven tabs:

### Nuke Simulator

Paste a nuke cost analysis report into the textarea, click **Parse Report**, then **Calculate Damage**. The parser reads coordinate lines like `(41,30)`, rampart HP (`rampart WEAK 396k HP`), stacked-damage notation, and structure types.

Example full report:

```
════════════════════════════════════════════════════════════════════════
NUKE COST ANALYSIS: E0N0 @ (41,30)  |  Owner: User  |  RCL: 7
════════════════════════════════════════════════════════════════════════
Energy price: 18.3470 cr/e  |  Structures in room: 87  |  Building tiles in blast: 7
PER-TILE BREAKDOWN:  (roads, walls, containers ignored; empty tiles omitted)
────────────────────────────────────────────────────────────────────────
  [AREA]   (42,29)   5M area    |  ⚠️  rampart WEAK  401k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk
      📉 Rampart investment at risk: 401k HP  =  4ke  (73.6k cr)
      🔧 To protect: need 4.6M more HP  =  46ke  (843.8k cr)

  [CENTER] (41,30)  10M direct  |  ⚠️  rampart WEAK  396k HP  (need >10.0M)
      🏗  spawn  rebuild: 15ke  (275.2k cr)  +  stored: 807 cr  💥 at risk
      📉 Rampart investment at risk: 396k HP  =  4ke  (72.6k cr)
      🔧 To protect: need 9.6M more HP  =  96ke  (1.76M cr)

  [AREA]   (42,30)   5M area    |  ⚠️  rampart WEAK  402k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk
      📉 Rampart investment at risk: 402k HP  =  4ke  (73.7k cr)
      🔧 To protect: need 4.6M more HP  =  46ke  (843.7k cr)

  [AREA]   (41,31)   5M area    |  ⚠️  rampart WEAK  416k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk
      📉 Rampart investment at risk: 416k HP  =  4ke  (76.4k cr)
      🔧 To protect: need 4.6M more HP  =  46ke  (841.0k cr)

  [AREA]   (42,31)   5M area    |  ⚠️  rampart WEAK  396k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk
      📉 Rampart investment at risk: 396k HP  =  4ke  (72.6k cr)
      🔧 To protect: need 4.6M more HP  =  46ke  (844.7k cr)

  [AREA]   (41,32)   5M area    |  ⚠️  rampart WEAK  401k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk
      📉 Rampart investment at risk: 401k HP  =  4ke  (73.6k cr)
      🔧 To protect: need 4.6M more HP  =  46ke  (843.7k cr)

  [AREA]   (42,32)   5M area    |  ⚠️  rampart WEAK  293k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk
      📉 Rampart investment at risk: 293k HP  =  3ke  (53.8k cr)
      🔧 To protect: need 4.7M more HP  =  47ke  (863.6k cr)

════════════════════════════════════════════════════════════════════════
REPLACEMENT COST  (all buildings in blast, ignoring rampart protection):
  Build energy:     33ke  (605.5k cr)
  Lost resources:   807 cr
  TOTAL:            606.3k cr

DEFENSE COST  (what it takes to protect every building tile vs ALL strikes):
  Top up weak ramparts:   373ke  (6.84M cr)
  TOTAL to protect:       373ke  (6.84M cr)

SUNK COST AT RISK  (rampart HP investment lost if strike hits now):
  27ke  (496.3k cr)
════════════════════════════════════════════════════════════════════════
```

The `@ (x,y)` or `+ (x,y)` tokens mark nuke impact centers. Tiles within radius 2 of a center take damage (10M at the center tile, 5M in the surrounding area); overlapping zones stack. The parser extracts:
- Coordinates from lines with `(x,y)`
- Rampart HP from lines containing `rampart WEAK` or `rampart ok`
- Structure type from the building names (spawn, extension, tower, lab, etc.)
- Stacked damage from the summary, or calculates it from nuke positions if not explicitly stated

### Market Map

Paste a room trading summary, click **Process Data** (or use **Load Example**).

Expected line format:

```
Room | Sells | Buys | Net | Resources
W51N7  | 1,015,667,400 | 0 | +1,015,667,400 | alloy(^) silicon(^)
W14N3  | 0 | 740,693,610 | -740,693,610 | energy(v)
```

Resource markers: `(^)` sold there, `(v)` bought there, `(B)` both. The parser also reads `Hourly snapshots recorded:` and `Last snapshot:` metadata lines.

Map controls: scroll or pinch to zoom, drag to pan, click a room to select it, double-click to center and select. Use **Fit View** to reset.

## Technical Notes

- Pure HTML/CSS/JS in one file; rendering uses the Canvas 2D API for both maps.
- No external libraries or network calls. The "Screeps Server Status" links open status.screeps.com for current tick rates.
- Countdown state is the only persisted data (browser `localStorage`).
- NPC order rooms are approximated from highway crossroads (coordinates divisible by 10), since NPC terminals sit at sector crossroads like W0N0 and W10N10.
- Room coordinate convention: `E`/`N` map to non-negative axes, `W`/`S` to negative (`Wn` → `-(n+1)`), matching Screeps' world layout.

## License
CC BY-NC