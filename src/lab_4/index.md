---
title: "Lab 4: Clearwater Crisis"
toc: false
---

# Clearwater Crisis: who made the lake weird?

This dashboard keeps the case simple: compare pollution, oxygen stress, fish decline, and biodiversity to see which explanation is best supported by the evidence.

```js
const fish = await FileAttachment("data/fish_surveys.csv").csv({ typed: true });
const stations = await FileAttachment("data/monitoring_stations.csv").csv({ typed: true });
const acts = await FileAttachment("data/suspect_activities.csv").csv({ typed: true });
const water = await FileAttachment("data/water_quality.csv").csv({ typed: true });
```

```js
const waterData = water.map(d => ({
  ...d,
  date: new Date(d.date),
  quarter: `${new Date(d.date).getFullYear()} Q${Math.ceil((new Date(d.date).getMonth() + 1) / 3)}`
}));

const fishData = fish.map(d => ({
  ...d,
  date: new Date(d.date),
  quarter: `${new Date(d.date).getFullYear()} Q${Math.ceil((new Date(d.date).getMonth() + 1) / 3)}`
}));

const stationSummary = d3.rollups(
  waterData,
  rows => ({
    heavy_metals: d3.mean(rows, d => d.heavy_metals_ppb),
    nitrogen: d3.mean(rows, d => d.nitrogen_mg_per_L),
    low_oxygen_days: rows.filter(d => d.dissolved_oxygen_mg_per_L < 7).length
  }),
  d => d.station_id
).map(([station_id, values]) => {
  const info = stations.find(d => d.station_id === station_id);
  return { station_id, ...values, ...info };
}).sort((a, b) => b.heavy_metals - a.heavy_metals);

const westWater = waterData.filter(d => d.station_id === "West");
const chemtechActs = acts
  .filter(d => d.suspect === "ChemTech Manufacturing")
  .map(d => ({ ...d, date: new Date(d.date) }));

const chemtechBands = chemtechActs.map(d => ({
  ...d,
  start: d.date,
  end: d3.timeDay.offset(d.date, d.duration_days)
}));

const heavyMetalsDomain = [0, 80];
const oxygenDomain = [0, 10];
const troutDomain = [0, 45];

const troutByQuarter = d3.rollups(
  fishData.filter(d => d.species === "Trout"),
  rows => d3.sum(rows, d => d.count),
  d => d.quarter,
  d => d.station_id
).flatMap(([quarter, stations]) =>
  stations.map(([station_id, trout_count]) => ({ quarter, station_id, trout_count }))
);

const westFishMix = d3.rollups(
  fishData.filter(d => d.station_id === "West"),
  rows => d3.sum(rows, d => d.count),
  d => d.quarter,
  d => d.species
).flatMap(([quarter, species]) =>
  species.map(([species, count]) => ({ quarter, species, count }))
);

const waterByQuarterStation = d3.rollups(
  waterData,
  rows => ({
    heavy_metals: d3.mean(rows, d => d.heavy_metals_ppb),
    nitrogen: d3.mean(rows, d => d.nitrogen_mg_per_L),
    oxygen: d3.mean(rows, d => d.dissolved_oxygen_mg_per_L)
  }),
  d => d.quarter,
  d => d.station_id
).flatMap(([quarter, stations]) =>
  stations.map(([station_id, values]) => ({ quarter, station_id, ...values }))
);

const fishByQuarterStation = d3.rollups(
  fishData,
  rows => {
    const total = d3.sum(rows, d => d.count);
    const trout = d3.sum(rows.filter(d => d.species === "Trout"), d => d.count);
    const shannon = -d3.sum(rows, d => {
      const p = d.count / total;
      return p > 0 ? p * Math.log(p) : 0;
    });
    return { total_fish: total, trout_count: trout, biodiversity: shannon };
  },
  d => d.quarter,
  d => d.station_id
).flatMap(([quarter, stations]) =>
  stations.map(([station_id, values]) => ({ quarter, station_id, ...values }))
);

const ecosystemData = waterByQuarterStation.map(w => {
  const fish = fishByQuarterStation.find(f => f.quarter === w.quarter && f.station_id === w.station_id);
  const heavyMetalRisk = Math.min(100, (w.heavy_metals / 30) * 100);
  const nitrogenRisk = Math.min(100, (w.nitrogen / 2) * 100);
  const oxygenRisk = Math.min(100, Math.max(0, (7 - w.oxygen) / 2) * 100);
  return {
    ...w,
    ...fish,
    ecosystem_risk: (heavyMetalRisk + nitrogenRisk + oxygenRisk) / 3
  };
}).filter(d => d.total_fish != null);

const oxygenFishSummary = d3.rollups(
  ecosystemData,
  rows => ({
    average_fish: d3.mean(rows, d => d.total_fish),
    quarters: rows.length
  }),
  d => d.oxygen < 7 ? "Low oxygen" : "Healthier oxygen"
).map(([oxygen_status, values]) => ({ oxygen_status, ...values }));

const pollutionTroutSummary = d3.rollups(
  ecosystemData,
  rows => ({
    heavy_metals: d3.mean(rows, d => d.heavy_metals),
    trout_count: d3.mean(rows, d => d.trout_count)
  }),
  d => d.station_id
).map(([station_id, values]) => ({ station_id, ...values }));

const oxygenByStation = d3.rollups(
  ecosystemData,
  rows => d3.mean(rows, d => d.oxygen),
  d => d.station_id
).map(([station_id, oxygen]) => ({ station_id, oxygen }))
  .sort((a, b) => a.oxygen - b.oxygen);

const worstStation = stationSummary[0];
const verdict = [
  {
    clue: "Highest heavy metals",
    answer: worstStation.station_id,
    why: `${worstStation.heavy_metals.toFixed(1)} ppb average heavy metals`
  },
  {
    clue: "Oxygen stress",
    answer: `${worstStation.low_oxygen_days} low oxygen readings`,
    why: "Low dissolved oxygen can stress fish directly"
  },
  {
    clue: "Strongest suspect pattern",
    answer: "ChemTech Manufacturing",
    why: `ChemTech is ${worstStation.distance_to_chemtech_m} meters from the highest-risk station`
  }
];
```

## Case overview

```js
display(Inputs.table(verdict, {
  header: {
    clue: "Clue",
    answer: "What it points to",
    why: "Why it matters"
  }
}));
```

## Pollution evidence

```js
display(Plot.plot({
  title: "1. Heavy metals over time: the West station steals the scene",
  subtitle: "One chart, clearer lines. The red dashed line marks the 20 ppb concern threshold.",
  width,
  height: 340,
  marginLeft: 60,
  marginRight: 70,
  x: { label: "Date" },
  y: { label: "Heavy metals (ppb)", grid: true, domain: heavyMetalsDomain },
  color: {
    domain: ["North", "South", "East", "West"],
    range: ["#2563eb", "#16a34a", "#f59e0b", "#dc2626"],
    legend: true
  },
  marks: [
    Plot.ruleY([20], { stroke: "#dc2626", strokeDasharray: "4 3" }),
    Plot.line(waterData, {
      x: "date",
      y: "heavy_metals_ppb",
      stroke: "station_id",
      strokeWidth: 4
    }),
    Plot.dot(waterData.filter((d, i) => i % 2 === 0), {
      x: "date",
      y: "heavy_metals_ppb",
      fill: "station_id",
      r: 3,
      opacity: 0.90,
      tip: true
    }),
    Plot.text(waterData, Plot.selectLast({
      x: "date",
      y: "heavy_metals_ppb",
      z: "station_id",
      text: "station_id",
      fill: "station_id",
      dx: 8,
      fontSize: 12,
      fontWeight: "bold",
      textAnchor: "start"
    }))
  ]
}));

display(Plot.plot({
  title: "2. Average heavy metals by station: the suspect lineup",
  subtitle: "Higher bars mean dirtier water.",
  width,
  height: 300,
  x: { label: "Station" },
  y: { label: "Average heavy metals (ppb)", grid: true, domain: heavyMetalsDomain },
  color: { legend: true },
  marks: [
    Plot.barY(stationSummary, {
      x: "station_id",
      y: "heavy_metals",
      fill: "station_id",
      sort: { x: "-y" },
      tip: true
    }),
    Plot.ruleY([20], { stroke: "red", strokeDasharray: "4 3" }),
    Plot.text(stationSummary, {
      x: "station_id",
      y: "heavy_metals",
      text: d => d.heavy_metals.toFixed(1),
      dy: -8,
      fontSize: 12
    })
  ]
}));

display(Plot.plot({
  title: "3. Distance check: ChemTech is closest to the dirtiest station",
  subtitle: "Each dot is a monitoring station. Closer to the left means closer to ChemTech.",
  width,
  height: 300,
  marginRight: 80,
  x: { label: "Distance to ChemTech (meters)", grid: true, domain: [0, 6200] },
  y: { label: "Average heavy metals (ppb)", grid: true, domain: heavyMetalsDomain },
  color: { legend: true },
  marks: [
    Plot.dot(stationSummary, {
      x: "distance_to_chemtech_m",
      y: "heavy_metals",
      fill: "station_id",
      r: 7,
      tip: true
    }),
    Plot.text(stationSummary, {
      x: "distance_to_chemtech_m",
      y: "heavy_metals",
      text: "station_id",
      dx: 12,
      dy: 4,
      textAnchor: "start",
      fontSize: 12
    })
  ]
}));
```

## Biological response

```js
display(Plot.plot({
  title: "4. Trout counts by station, colored by pollution",
  subtitle: "Lower bars mean fewer trout. Darker red means higher heavy metals.",
  width,
  height: 320,
  x: { label: "Station" },
  y: { label: "Average trout count", grid: true, domain: troutDomain },
  color: {
    type: "linear",
    scheme: "Reds",
    legend: true,
    label: "Avg heavy metals (ppb)"
  },
  marks: [
    Plot.barY(pollutionTroutSummary, {
      x: "station_id",
      y: "trout_count",
      fill: "heavy_metals",
      sort: { x: "y" },
      tip: true
    }),
    Plot.text(pollutionTroutSummary, {
      x: "station_id",
      y: "trout_count",
      text: d => d.trout_count.toFixed(0),
      dy: -8,
      fontSize: 12,
      fontWeight: "bold"
    }),
    Plot.ruleY([0])
  ]
}));

display(Plot.plot({
  title: "4b. Dose-response: more heavy metals, fewer trout",
  subtitle: "Each dot is a station-quarter. The downward trend is the biological response we would expect from contamination.",
  width,
  height: 320,
  x: { label: "Average heavy metals (ppb)", grid: true, domain: heavyMetalsDomain },
  y: { label: "Trout count", grid: true, domain: troutDomain },
  color: { legend: true },
  marks: [
    Plot.ruleX([20], { stroke: "red", strokeDasharray: "4 3" }),
    Plot.dot(ecosystemData, {
      x: "heavy_metals",
      y: "trout_count",
      fill: "station_id",
      r: 5,
      opacity: 0.75,
      tip: true
    }),
    Plot.linearRegressionY(ecosystemData, {
      x: "heavy_metals",
      y: "trout_count",
      stroke: "black",
      strokeDasharray: "4 3"
    })
  ]
}));
```

## Oxygen and ecosystem stress

```js
display(Plot.plot({
  title: "5. Average dissolved oxygen by station",
  subtitle: "The red dashed line marks 7 mg/L, where sensitive fish can begin to feel stress.",
  width,
  height: 300,
  x: { label: "Station" },
  y: { label: "Average dissolved oxygen (mg/L)", grid: true, domain: oxygenDomain },
  color: { legend: true },
  marks: [
    Plot.ruleY([7], { stroke: "red", strokeDasharray: "4 3" }),
    Plot.barY(oxygenByStation, {
      x: "station_id",
      y: "oxygen",
      fill: "station_id",
      tip: true
    }),
    Plot.text(oxygenByStation, {
      x: "station_id",
      y: "oxygen",
      text: d => d.oxygen.toFixed(1),
      dy: -8,
      fontSize: 13,
      fontWeight: "bold"
    }),
    Plot.ruleY([0])
  ]
}));

display(Plot.plot({
  title: "5b. Oxygen readings by station",
  subtitle: "The red dashed line shows where sensitive fish begin to feel stress.",
  width,
  height: 260,
  x: { label: "Quarter" },
  y: { label: "Dissolved oxygen (mg/L)", grid: true, domain: oxygenDomain },
  color: { legend: true },
  marks: [
    Plot.ruleY([7], { stroke: "red", strokeDasharray: "4 3" }),
    Plot.line(ecosystemData, {
      x: "quarter",
      y: "oxygen",
      stroke: "station_id",
      strokeWidth: 2.5,
      marker: "dot"
    })
  ]
}));

display(Plot.plot({
  title: "6. Nitrogen check: not every pollution signal tells the same story",
  subtitle: "Nitrogen matters too, especially because nutrient pollution can reduce oxygen.",
  width,
  height: 320,
  x: { label: "Average nitrogen (mg/L)", grid: true },
  y: { label: "Dissolved oxygen (mg/L)", grid: true, domain: oxygenDomain },
  color: { legend: true },
  marks: [
    Plot.ruleY([7], { stroke: "red", strokeDasharray: "4 3" }),
    Plot.dot(ecosystemData, {
      x: "nitrogen",
      y: "oxygen",
      fill: "station_id",
      r: 6,
      opacity: 0.75,
      tip: true
    })
  ]
}));

display(Plot.plot({
  title: "7. Ecosystem risk score: heavy metals + nitrogen + low oxygen",
  subtitle: "Higher score means more combined environmental stress.",
  width,
  height: 320,
  x: { label: "Quarter" },
  y: { label: "Risk score", grid: true, domain: [0, 100] },
  color: { legend: true },
  marks: [
    Plot.line(ecosystemData, {
      x: "quarter",
      y: "ecosystem_risk",
      stroke: "station_id",
      strokeWidth: 2.5,
      marker: "dot"
    })
  ]
}));

display(Plot.plot({
  title: "8. Biodiversity over time: is the whole fish community changing?",
  subtitle: "Higher biodiversity means a more balanced fish community.",
  width,
  height: 320,
  x: { label: "Quarter" },
  y: { label: "Biodiversity score", grid: true },
  color: { legend: true },
  marks: [
    Plot.line(ecosystemData, {
      x: "quarter",
      y: "biodiversity",
      stroke: "station_id",
      strokeWidth: 2.5,
      marker: "dot"
    })
  ]
}));
```

## Timeline evidence

```js
display(Plot.plot({
  title: "9. West station timeline: pollution spikes with ChemTech event windows",
  subtitle: "Gray bands show documented ChemTech maintenance windows. The red line is West station heavy metals.",
  width,
  height: 320,
  x: { label: "Date" },
  y: { label: "Heavy metals (ppb)", grid: true, domain: heavyMetalsDomain },
  marks: [
    Plot.rectX(chemtechBands, {
      x1: "start",
      x2: "end",
      fill: "#6b7280",
      fillOpacity: 0.18,
      title: d => `${d.activity_type}: ${d.duration_days} days`
    }),
    Plot.ruleY([20], { stroke: "red", strokeDasharray: "4 3" }),
    Plot.line(westWater, {
      x: "date",
      y: "heavy_metals_ppb",
      stroke: "#dc2626",
      strokeWidth: 2
    }),
    Plot.dot(westWater, {
      x: "date",
      y: "heavy_metals_ppb",
      fill: "#dc2626",
      r: 2,
      tip: true
    }),
    Plot.text(chemtechBands, {
      x: "start",
      y: 76,
      text: d => d3.timeFormat("%b")(d.start),
      fill: "#374151",
      dx: 4,
      fontSize: 10,
      textAnchor: "start"
    })
  ]
}));
```

## Final biological check

```js
display(Plot.plot({
  title: "10. Trout count: the sensitive fish are not having a good time",
  subtitle: "Trout are the warning signal because they are pollution-sensitive.",
  width,
  height: 320,
  x: { label: "Quarter" },
  y: { label: "Trout count", grid: true, domain: troutDomain },
  color: { legend: true },
  marks: [
    Plot.line(troutByQuarter, {
      x: "quarter",
      y: "trout_count",
      stroke: "station_id",
      strokeWidth: 2,
      marker: "dot"
    })
  ]
}));

display(Plot.plot({
  title: "11. West station fish mix: trout fade while hardier fish remain",
  subtitle: "A simple stacked bar makes the biological shift easy to see.",
  width,
  height: 320,
  x: { label: "Quarter" },
  y: { label: "Fish count", grid: true },
  color: {
    domain: ["Trout", "Bass", "Carp"],
    range: ["#2563eb", "#f59e0b", "#16a34a"],
    legend: true
  },
  marks: [
    Plot.barY(westFishMix, {
      x: "quarter",
      y: "count",
      fill: "species",
      tip: true
    }),
    Plot.ruleY([0])
  ]
}));
```

## Final call

The evidence suggests a strong association between **ChemTech Manufacturing** and elevated pollution near the West station. This is not absolute proof of causation, but the pattern is suspicious: the West station has the highest heavy metals, ChemTech is closest to that station, pollution spikes appear over time, and sensitive trout weaken where ecosystem risk is highest.
