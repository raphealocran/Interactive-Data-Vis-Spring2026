---
title: "Lab 2: Subway Staffing"
toc: true
---

This page is where you can iterate. Follow the lab instructions in the [readme.md](./README.md).


<!-- Import Data -->
```js
const incidents = FileAttachment("./data/incidents.csv").csv({ typed: true })
const local_events = FileAttachment("./data/local_events.csv").csv({ typed: true })
const upcoming_events = FileAttachment("./data/upcoming_events.csv").csv({ typed: true })
const ridership = FileAttachment("./data/ridership.csv").csv({ typed: true })
```

<!-- Data preparation -->
```js
const currentStaffing = {
  "Times Sq-42 St": 19,
  "Grand Central-42 St": 18,
  "34 St-Penn Station": 15,
  "14 St-Union Sq": 4,
  "Fulton St": 17,
  "42 St-Port Authority": 14,
  "Herald Sq-34 St": 15,
  "Canal St": 4,
  "59 St-Columbus Circle": 6,
  "125 St": 7,
  "96 St": 19,
  "86 St": 19,
  "72 St": 10,
  "66 St-Lincoln Center": 15,
  "50 St": 20,
  "28 St": 13,
  "23 St": 8,
  "Christopher St": 15,
  "Houston St": 18,
  "Spring St": 12,
  "Chambers St": 18,
  "Wall St": 9,
  "Bowling Green": 6,
  "West 4 St-Wash Sq": 4,
  "Astor Pl": 7
}

const parsedRidership = ridership.map(d => ({
  ...d,
  date: new Date(d.date),
  rides: Number(d.rides) || 0
}))

const cutoff = new Date("2025-07-15")

const beforeRides = []
const afterRides = []

for (let i = 0; i < parsedRidership.length; i++) {
  const row = parsedRidership[i]
  if (row.date < cutoff) beforeRides.push(row.rides)
  else afterRides.push(row.rides)
}

function getAverage(arr) {
  if (arr.length === 0) return 0
  return arr.reduce((sum, value) => sum + value, 0) / arr.length
}

const avgBefore = getAverage(beforeRides)
const avgAfter = getAverage(afterRides)
const percentChange = avgBefore === 0 ? 0 : ((avgAfter - avgBefore) / avgBefore * 100).toFixed(1)

const eventDates = local_events.map(e => ({
  date: new Date(e.date),
  name: e.event_name,
  station: e.nearby_station
}))

const maxRides = Math.max(...parsedRidership.map(d => d.rides))

const stationTimes = {}
for (let i = 0; i < incidents.length; i++) {
  const row = incidents[i]
  const station = row.station
  const time = Number(row.response_time_minutes) || 0
  if (!stationTimes[station]) stationTimes[station] = []
  stationTimes[station].push(time)
}

const stationAvg = Object.entries(stationTimes).map(([station, times]) => ({
  station,
  avg_time: times.reduce((sum, t) => sum + t, 0) / times.length
}))
.sort((a, b) => a.avg_time - b.avg_time)

const systemAvg = stationAvg.reduce((sum, d) => sum + d.avg_time, 0) / stationAvg.length
const worstStations = [...stationAvg].reverse().slice(0, 5)
const bestStations = stationAvg.slice(0, 5)

const eventCount = {}
for (let i = 0; i < upcoming_events.length; i++) {
  const station = upcoming_events[i].nearby_station
  eventCount[station] = (eventCount[station] || 0) + 1
}

const incidentCount = {}
for (let i = 0; i < incidents.length; i++) {
  const station = incidents[i].station
  incidentCount[station] = (incidentCount[station] || 0) + 1
}

const maxIncidents = Math.max(...Object.values(incidentCount), 1)

const staffingNeed = Object.entries(eventCount).map(([station, events]) => {
  const staff = currentStaffing[station] || 5
  const incidentsAtStation = incidentCount[station] || 0
  const incidentRate = incidentsAtStation / maxIncidents
  const needScore = (events * 2) + (incidentRate * 5) - (staff / 4)
  return { station, events, staff, incidents: incidentsAtStation, needScore }
}).sort((a, b) => b.needScore - a.needScore)

const topThree = staffingNeed.slice(0, 3)
```

<!-- Ridership and events timeline -->
```js
Plot.plot({
  width: 900,
  height: 350,
  x: { label: "Date", type: "utc", tickFormat: "%b %d" },
  y: { label: "Ridership", grid: true },
  marks: [
    Plot.line(parsedRidership, {
      x: "date",
      y: "rides",
      stroke: "#2c7fb8",
      strokeWidth: 2
    }),
    Plot.ruleX([cutoff], {
      stroke: "red",
      strokeDasharray: "4,4"
    }),
    Plot.text(
      [{ x: new Date("2025-07-16"), y: maxRides * 0.9, text: "Fare increase (July 15)" }],
      { x: "x", y: "y", text: "text", fill: "red", fontSize: 11 }
    ),
    Plot.dot(eventDates, {
      x: "date",
      y: () => maxRides * 0.8,
      fill: "orange",
      r: 5,
      tip: true
    })
  ]
})
```

<!-- Response-time by station -->
```js
Plot.plot({
  width: 900,
  height: 400,
  x: { label: "Response Time (minutes)", grid: true },
  y: { label: "Station" },
  marks: [
    Plot.barX(stationAvg, {
      x: "avg_time",
      y: "station",
      fill: "#4299c1",
      sort: { y: "x", reverse: true }
    }),
    Plot.ruleX([systemAvg], { stroke: "red", strokeDasharray: "3,3" }),
    Plot.text(
      [{ x: systemAvg, y: 0, text: `System average: ${systemAvg.toFixed(1)} minutes` }],
      { x: "x", y: "y", text: "text", fill: "red", fontSize: 11, dx: 5 }
    )
  ]
})
```

<!-- Best/worst station text -->
```js
md`### Station response-time ranking (best to worst)`
for (let i = 0; i < bestStations.length; i++) {
  display(`${i + 1}. ${bestStations[i].station}: ${bestStations[i].avg_time.toFixed(1)} minutes`)
}

md`### Worst stations (highest response times)`
for (let i = 0; i < worstStations.length; i++) {
  const percentAbove = (worstStations[i].avg_time / systemAvg * 100).toFixed(0)
  display(`${i + 1}. ${worstStations[i].station}: ${worstStations[i].avg_time.toFixed(1)} minutes (${percentAbove}% above average)`)
}
```

<!-- Top 3 staffing need -->
```js
md`### Top 3 stations needing staffing upgrades (2026 events)`
for (let i = 0; i < topThree.length; i++) {
  const s = topThree[i]
  display(`${i + 1}. ${s.station} — events: ${s.events}, incidents: ${s.incidents}, staffing: ${s.staff}, need score: ${s.needScore.toFixed(1)}`)
}
```
let ruleMarks = []
if (topThree.length >= 3) {
  ruleMarks = [Plot.ruleY([topThree[2].needScore], {
    stroke: "red",
    strokeWidth: 1.5,
    strokeDasharray: "4,2"
  })]
}

Plot.plot({
  width: 900,
  height: 400,
  x: { label: "Station", tickRotate: 45 },
  y: { label: "Need Score (higher = more urgent)", grid: true },
  marks: [
    Plot.barY(staffingNeed, {
      x: "station",
      y: "needScore",
      fill: "#e67e22",
      sort: { x: "y", reverse: true }
    })
  ].concat(ruleMarks)
})

for (let i = 0; i < topThree.length; i++) {
  let s = topThree[i]
  display((i+1) + ". " + s.station + ": " + s.events + " upcoming events, " + s.incidents + " past incidents, only " + s.staff + " staff members")
}

let stationAvgMap = new Map()

for (let i = 0; i < stationAvg.length; i++) {
  stationAvgMap.set(stationAvg[i].station, stationAvg[i].avg_time)
}

let bonusScores = []

for (let i = 0; i < staffingNeed.length; i++) {
  let s = staffingNeed[i]
  let responseTime = stationAvgMap.get(s.station) || 5
  let bonusScore = s.needScore * (responseTime / 3)
  bonusScores.push({
    station: s.station,
    events: s.events,
    staff: s.staff,
    incidents: s.incidents,
    needScore: s.needScore,
    responseTime: responseTime,
    bonusScore: bonusScore
  })
}

bonusScores.sort((a, b) => b.bonusScore - a.bonusScore)

let topPriority = bonusScores[0]

display("PRIORITY STATION: " + topPriority.station)
display("")
display("Why: " + topPriority.events + " major events in Summer 2026, response time of " + topPriority.responseTime.toFixed(1) + " minutes, only " + topPriority.staff + " current staff members")
display("")
display("Recommendation: Add 5-7 temporary staff members during event days")
```