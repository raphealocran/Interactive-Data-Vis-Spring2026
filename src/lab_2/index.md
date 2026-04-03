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

<!-- Include current staffing counts from the prompt -->
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

let cutoff = new Date("2025-07-15")

let beforeRides = []
let afterRides = []

for (let i = 0; i < parsedRidership.length; i++) {
  let row = parsedRidership[i]
  if (row.date < cutoff) beforeRides.push(row.rides)
  else afterRides.push(row.rides)
}

function getAverage(arr) {
  if (arr.length === 0) return 0
  let sum = 0
  for (let i = 0; i < arr.length; i++) sum += arr[i]
  return sum / arr.length
}

let avgBefore = getAverage(beforeRides)
let avgAfter = getAverage(afterRides)

let percentChange = avgBefore === 0 ? 0 : ((avgAfter - avgBefore) / avgBefore * 100).toFixed(1)

let eventDates = local_events.map(e => ({
  date: new Date(e.date),
  name: e.event_name,
  station: e.station_near
}))

let maxRides = Math.max(...parsedRidership.map(d => d.rides))

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
      {
        x: "x",
        y: "y",
        text: "text",
        fill: "red",
        fontSize: 11
      }
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

let stationTimes = {}

for (let i = 0; i < incidents.length; i++) {
  let row = incidents[i]
  let station = row.station
  let time = Number(row.response_time_min) || 0

  if (!stationTimes[station]) stationTimes[station] = []
  stationTimes[station].push(time)
}

let stationAvg = []

for (let station in stationTimes) {
  let times = stationTimes[station]
  let sum = 0
  for (let i = 0; i < times.length; i++) sum += times[i]
  stationAvg.push({
    station: station,
    avg_time: sum / times.length
  })
}

stationAvg.sort((a, b) => a.avg_time - b.avg_time)

let systemAvg = stationAvg.reduce((sum, d) => sum + d.avg_time, 0) / stationAvg.length

let worstStations = [...stationAvg].reverse().slice(0, 5)
let bestStations = stationAvg.slice(0, 5)

Plot.plot({
  width: 900,
  height: 400,
  x: { label: "Response Time (minutes)", grid: true },
  y: { label: "Station" },
  marks: [
    Plot.barX(incidents, Plot.groupX({ y: "mean" }, {
      x: "response_time_min",
      y: "station",
      fill: "#4299c1",
      sort: { y: "x", reverse: true }
    })),
    Plot.ruleX([systemAvg], {
      stroke: "red",
      strokeDasharray: "3,3"
    }),
    Plot.text(
      [{ x: systemAvg, y: 5, text: `System average: ${systemAvg.toFixed(1)} minutes` }],
      { x: "x", y: "y", text: "text", fill: "red", fontSize: 11, dx: 5 }
    )
  ]
})

for (let i = 0; i < bestStations.length; i++) {
  display((i+1) + ". " + bestStations[i].station + ": " + bestStations[i].avg_time.toFixed(1) + " minutes")
}

for (let i = 0; i < worstStations.length; i++) {
  let percentAbove = (worstStations[i].avg_time / systemAvg * 100).toFixed(0)
  display((i+1) + ". " + worstStations[i].station + ": " + worstStations[i].avg_time.toFixed(1) + " minutes (" + percentAbove + "% above average)")
}

let eventCount = {}

for (let i = 0; i < upcoming_events.length; i++) {
  let station = upcoming_events[i].station_near
  eventCount[station] = (eventCount[station] || 0) + 1
}

let incidentCount = {}

for (let i = 0; i < incidents.length; i++) {
  let station = incidents[i].station
  incidentCount[station] = (incidentCount[station] || 0) + 1
}

let maxIncidents = Math.max(...Object.values(incidentCount), 1)

let staffingNeed = []

for (let station in eventCount) {
  let events = eventCount[station]
  let staff = currentStaffing[station] || 5
  let incidentsAtStation = incidentCount[station] || 0
  let incidentRate = incidentsAtStation / maxIncidents
  let needScore = (events * 2) + (incidentRate * 5) - (staff / 4)
  
  staffingNeed.push({
    station: station,
    events: events,
    staff: staff,
    incidents: incidentsAtStation,
    needScore: needScore
  })
}

staffingNeed.sort((a, b) => b.needScore - a.needScore)

let topThree = staffingNeed.slice(0, 3)

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
    }),
    Plot.ruleY([topThree[2].needScore], {
      stroke: "red",
      strokeWidth: 1.5,
      strokeDasharray: "4,2"
    })
  ]
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