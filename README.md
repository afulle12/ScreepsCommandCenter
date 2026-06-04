# Screeps Command Center

A single-file, browser-based toolkit for Screeps players. No build step, no dependencies, no server — open `ScreepsCommandCenter.html` and everything runs client-side. It bundles five utilities for planning offensives, sizing creeps, timing events, and visualizing market activity across the world map.

## Screenshots

![Nuke Simulator](Images/nuke-simulator.png)

![Market Map](Images/market-map.png)

---

## Features at a Glance

| Tab | Purpose |
|---|---|
| **Tick ETA** | Ticks → real-world duration, with timezone comparison and live countdown |
| **Time → Ticks** | Real-world date/time → tick count |
| **Nuke Simulator** | Paste a cost analysis report, visualize blast zones and rampart survivability |
| **Body Calculator** | Build and optimize creep bodies against an energy budget |
| **Market Map** | Pan/zoom world map of net exporters and importers from a trading summary |

---

## Tick ETA

Converts a number of ticks into a real-world duration from **right now**, and optionally tells you the local clock time of arrival in two timezones.

### Inputs

- **Seconds per Tick** — The current server tick rate. Check [status.screeps.com](https://status.screeps.com) using the link on the tab; the rate varies by server and time of day. Typical values range from about 1.0 to 3.0 seconds per tick.
- **Number of Ticks** — How many ticks until the event. For a nuke this is 50,000; for spawn time multiply parts × 3; for anything else read the game's countdown directly.

### Optional: Timezone Comparison

Expand the timezone section by selecting values in both dropdowns. Your local timezone is auto-detected and pre-filled. This is useful for planning attacks timed around an enemy player's sleep schedule — you see the arrival clock time in both timezones side by side.

### Output

- **Duration breakdown** — Days / hours / minutes / seconds remaining.
- **Arrival times** — Local clock time in each selected timezone, plus the calendar date if the arrival crosses midnight.
- **Live countdown** — A `HH:MM:SS` ticker that starts automatically and **persists across page reloads** via `localStorage`, so you can close and reopen the tab without losing your countdown. Click **Clear** to cancel it.

---

## Time → Ticks

The inverse of Tick ETA: given a future date and time of day, how many ticks away is it?

### Inputs

- **Seconds per Tick** — Same as above.
- **Target Date** — Use the date picker to choose the calendar day.
- **Time of Day** — Click the clock button to open the custom time picker. Use the ▲ / ▼ spinners (minutes step in increments of 5) or type directly into the fields. Toggle **AM / PM**, then click **Set Time** to confirm. Click **Clear** inside the popup to remove a previously set time (midnight is assumed when no time is set).

### Output

- **Tick count** — The number of ticks from now until the chosen moment, ceiling-rounded.
- **Human-readable summary** — Days, hours, and minutes remaining so you can sanity-check the result.

---

## Nuke Simulator

Visualizes the damage dealt by one or more nukes against a room's defenses. Works by parsing a pre-formatted cost analysis report (see format below), drawing a color-coded grid of every affected structure tile, and producing a sortable per-structure damage summary.

### Step 1 — Paste a report and click **Parse Report**

The parser reads the text and extracts:

- **Nuke positions** — Tokens in the form `@ (x,y)` or `+ (x,y)` mark impact centers. More than one token means stacked nukes.
- **Structure coordinates** — Any line with a `(x,y)` pattern is associated with the nearest recognized building name (`spawn`, `tower`, `extension`, `lab`, `terminal`, `nuker`, `observer`, `storage`, `link`, `powerSpawn`).
- **Rampart HP** — Lines containing `rampart WEAK` or `rampart ok` followed by an HP value (e.g. `401k HP`) are parsed and attached to the tile.
- **Stacked damage** — If the report states a total like `= 15M stacked`, that value is used. Otherwise the tool calculates it: 10M at the direct center tile, 5M for every surrounding tile within radius 2, accumulating across multiple nukes.

Parse status (e.g. "Parsed 1 nuke and 7 structures") appears briefly below the buttons.

### Step 2 — Click **Calculate Damage**

This runs the damage math and populates:

- **Summary cards** — Counts of Destroyed / Defended / Exposed / Safe structures, plus total raw damage in megapoints.
- **Detailed report** — One entry per structure tile, showing damage dealt, HP remaining, and a colored badge (DESTROYED / DEFENDED / DAMAGED / SAFE).

### The Grid Map

Each cell represents one room tile within the blast bounding box. Tile colors:

| Color | Meaning |
|---|---|
| Dark red | No rampart — building will take full damage |
| Dark orange-red | Rampart present but below the damage threshold (single nuke) |
| Dark amber | Rampart present but below the stacked threshold (multiple nukes overlap here) |
| Dark green | Rampart HP exceeds incoming damage — building survives |

Dashed border outlines mark each nuke's 5×5 blast zone; a thicker border marks the center tile of each nuke. Zone outline colors cycle through blue → amber → red → green → purple for multiple nukes.

**Row/column coordinates** are shown along the top and left edges of the canvas.

### Interacting with the Map

- **Hover** a structure tile to see a tooltip: rampart HP, building HP, stacked damage, and survival status.
- **Click** a structure tile to jump to and highlight its entry in the damage report below. If the report hasn't been generated yet, it's generated automatically first.
- Toggle **HP labels** (checkbox, top-right of the controls) to show or hide the rampart HP value printed inside each tile. Labels appear when tiles are large enough (≥ 20 px per side).
- Click **Clear** to reset everything and start over.

### Expected Report Format

```
════════════════════════════════════════════════════════════════════════
NUKE COST ANALYSIS: E0N0 @ (41,30)  |  Owner: User  |  RCL: 7
════════════════════════════════════════════════════════════════════════
Energy price: 18.3470 cr/e  |  Structures in room: 87  |  Building tiles in blast: 7
PER-TILE BREAKDOWN:  (roads, walls, containers ignored; empty tiles omitted)
────────────────────────────────────────────────────────────────────────
  [AREA]   (42,29)   5M area    |  ⚠️  rampart WEAK  401k HP  (need >5.0M)
      🏗  extension  rebuild: 3ke  (55.0k cr)  💥 at risk

  [CENTER] (41,30)  10M direct  |  ⚠️  rampart WEAK  396k HP  (need >10.0M)
      🏗  spawn  rebuild: 15ke  (275.2k cr)  +  stored: 807 cr  💥 at risk

  ...
════════════════════════════════════════════════════════════════════════
```

The `@` (or `+`) before the coordinates in the header marks the nuke center. Multiple `@ (x,y)` tokens produce multiple overlapping blast zones.

---

## Body Calculator

Builds a creep body part by part, reports cost and spawn time, and can auto-optimize CARRY/MOVE pairs to fill a given energy budget.

### Inputs

- **Energy Budget** — Used by **Auto-Optimize** to fill CARRY+MOVE pairs to the maximum affordable count (capped at 25 pairs / 50 parts).
- **Max Body Parts** — A reference cap displayed alongside the body size output; the game hard-caps at 50.
- **Role Template** — Selecting a preset fills all part fields with a balanced starting configuration:

| Template | Parts |
|---|---|
| Harvester | 6 WORK · 1 CARRY · 3 MOVE |
| Hauler | 8 CARRY · 8 MOVE |
| Upgrader | 8 WORK · 2 CARRY · 2 MOVE |
| Attacker | 8 ATTACK · 8 MOVE · 4 TOUGH |
| Ranger | 8 RANGED · 8 MOVE · 2 TOUGH |
| Healer | 8 HEAL · 8 MOVE |

You can tweak any field after applying a template.

- **Individual part counts** — WORK, CARRY, MOVE, ATTACK, RANGED (RANGED_ATTACK), HEAL, TOUGH, CLAIM.

### Buttons

- **Calculate Body** — Instantly shows total energy cost, body size vs. the 50-part cap, and spawn time (parts × 3 ticks, converted to minutes and seconds).
- **Auto-Optimize** — Ignores all current part counts and fills the body with as many CARRY+MOVE pairs as the budget allows (max 25 pairs), then recalculates.

### Part Costs Reference

| Part | Cost |
|---|---|
| WORK | 100 |
| CARRY | 50 |
| MOVE | 50 |
| ATTACK | 80 |
| RANGED_ATTACK | 150 |
| HEAL | 250 |
| TOUGH | 10 |
| CLAIM | 600 |

---

## Market Map

Renders a pan/zoom world map of net exporters (green circles) and importers (red circles) from a pasted trading summary. Circle size scales to absolute net flow volume — the bigger the circle, the more resource is moving through that room.

### Step 1 — Paste data and click **Process Data**

Expected line format:

```
Room | Sells | Buys | Net | Resources
W51N7  | 1,015,667,400 | 0 | +1,015,667,400 | alloy(^) silicon(^)
W14N3  | 0 | 740,693,610 | -740,693,610 | energy(v)
```

- The header row and separator lines (`---`) are ignored automatically.
- Numbers may include commas. The `+` or `-` sign on `Net` is optional; the parser infers direction from the value.
- **Resource markers**: `(^)` = sold at this room, `(v)` = bought at this room, `(B)` = both.
- Optional metadata lines anywhere in the paste:
  - `Hourly snapshots recorded: 24` — shown in the sidebar stat.
  - `Last snapshot: 2024-01-15 03:00 UTC` — shown as the snapshot note.

Click **Load Example** to populate a small demo dataset without pasting anything.

### Navigating the Map

| Action | Result |
|---|---|
| Scroll wheel / pinch | Zoom in or out, centered on cursor |
| Click and drag | Pan the map |
| Click a circle | Select that room — details appear in the sidebar |
| Double-click a circle | Select and center the view on that room |
| **Zoom In / Zoom Out** buttons | Fixed zoom steps centered on the canvas |
| **Fit View** | Reset pan and zoom to show all rooms |

The map automatically switches rendering detail based on zoom level:

- **Dots** (zoomed out) — Minimal circles only, no labels.
- **Compact** (mid zoom) — Room name labels added.
- **Detailed** (zoomed in) — Full room name, signed net flow, and resource string shown per circle.

### Room Type Highlighting

The grid background tints rooms by type before any circles are drawn:

| Tint | Room type |
|---|---|
| Gold / yellow | Highway room — one coordinate is divisible by 10 |
| Orange | Crossroad — both coordinates divisible by 10 (also used as the NPC terminal approximation) |
| Cyan | Source-keeper rooms — inner ring of a sector (coordinates mod 10 in 4–6, excluding center) |
| Purple | Center-sector room — both coordinates mod 10 = 5 |

### Filters (sidebar)

All filters combine — only rooms matching every active filter are drawn.

- **Trade direction** — Toggle **Exporters** to show only rooms with positive net flow, or **Importers** for negative. Click the active button again to clear the filter (show both).
- **Order source** — Toggle **NPC only** to show only crossroad rooms (where NPC terminals are documented), or **Hide NPC** to exclude them. Click again to clear.
- **Available resources** — Click a resource chip to filter for rooms that traded that resource. Click the active chip again to clear. Only one resource filter can be active at a time. The chip list is built from whatever resources appear in the pasted data.

### Sidebar Stats

- **Rooms** — Count of rooms currently visible after filters.
- **Visible snapshot** — The `Hourly snapshots recorded` value from the pasted header, if present.
- **Largest exporter / importer** — The room with the highest absolute positive / negative net flow among currently visible rooms.
- **Selected Room** — Detailed breakdown for the last clicked room: net flow, sells vs. buys, raw resource string, parsed route markers with their meanings, and snapshot metadata.

---

## Technical Notes

- Pure HTML/CSS/JS in a single file; both maps render via the Canvas 2D API.
- No external libraries or network calls. All computation is client-side.
- The live countdown is the only data persisted across sessions (browser `localStorage` under key `scc_countdown_target`).
- NPC order rooms are **approximated** from highway crossroads (both coordinates divisible by 10). The actual documented NPC terminal positions in Screeps are at sector crossroads such as W0N0 and W10N10, which correspond to this heuristic.
- Room coordinate convention: `E`/`N` map to non-negative axes, `W`/`S` to negative (`Wn` → `-(n+1)`), matching Screeps' internal world layout.

---

## License

CC BY-NC