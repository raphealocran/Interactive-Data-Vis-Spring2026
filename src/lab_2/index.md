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

let beforeRides = []
let afterRides = []

for (let i = 0; i < ridership.length; i++) {
  let row = ridership[i]
  let date = new Date(row.date)
  let rides = row.rides

  if (date < new Date("2025-07-15")) {
    beforeRides.push(rides)
  } else {
    afterRides.push(rides)
  }
}

function getAverage(arr) {
  if (arr.length === 0) return 0
  let sum = 0
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i]
  }
  return sum / arr.length
}

let avgBefore = getAverage(beforeRides)
let avgAfter = getAverage(afterRides)
let percentChange = ((avgAfter - avgBefore) / avgBefore * 100).toFixed(1)

let eventDates = local_events.map(e => ({ 
  date: new Date(e.date), 
  name: e.event_name,
  station: e.station_near
}))

Plot.plot({
  title: `Ridership Over Summer 2025 (Fare increase on July 15: ${percentChange}% change)`,
  width: 900,
  height: 400,
  x: { label: "Date", type: "utc", tickFormat: "%b %d" },
  y: { label: "Daily Ridership", grid: true },
  marks: [
    Plot.line(ridership, Plot.binX({ y: "mean" }, { x: "date", y: "rides", stroke: "#2c7fb8", strokeWidth: 2 })),
    
    Plot.ruleX([new Date("2025-07-15")], { stroke: "red", strokeWidth: 2, strokeDasharray: "4,4" }),
    
    Plot.text([{ x: new Date("2025-07-16"), y: 20000, text: "↑ Fare increase" }], 
      { x: "x", y: "y", text: "text", fill: "red", fontSize: 11 }),
    
    Plot.dot(eventDates, { x: "date", y: () => 18000, fill: "orange", r: 6, tip: true }),
    
    Plot.text(eventDates.filter(d => d.name.includes("Parade")), 
      { x: "date", y: () => 23000, text: () => "July 4th Parade", fill: "#e67e22", fontSize: 10, dy: -10 })
  ]
})

let stationTimes = {}

for (let i = 0; i < incidents.length; i++) {
  let row = incidents[i]
  let station = row.station
  let time = row.response_time_min

  if (!stationTimes[station]) {
    stationTimes[station] = []
  }
  stationTimes[station].push(time)
}

let stationAvg = []

for (let station in stationTimes) {
  let times = stationTimes[station]
  let sum = 0
  for (let i = 0; i < times.length; i++) {
    sum += times[i]
  }
  let avg = sum / times.length
  stationAvg.push({ station: station, avg_time: avg })
}

stationAvg.sort((a, b) => a.avg_time - b.avg_time)

let worstStations = [...stationAvg].reverse().slice(0, 5)
let bestStations = stationAvg.slice(0, 5)

let systemAvg = 0
for (let i = 0; i < stationAvg.length; i++) {
  systemAvg += stationAvg[i].avg_time
}
systemAvg = systemAvg / stationAvg.length

Plot.plot({
  title: "Average Incident Response Time by Station",
  width: 900,
  height: 500,
  x: { label: "Response Time (minutes)", grid: true },
  y: { label: "Station" },
  marks: [
    Plot.barX(incidents, Plot.groupX({ y: "mean" }, { x: "response_time_min", y: "station", fill: "#4299c1", sort: { y: "x", reverse: true } })),
    
    Plot.ruleX([systemAvg], { stroke: "crimson", strokeWidth: 2, strokeDasharray: "3,3" }),
    
    Plot.text([{ x: systemAvg, y: 5, text: `System avg: ${systemAvg.toFixed(1)} min` }],
      { x: "x", y: "y", text: "text", fill: "crimson", fontSize: 11, dx: 5 })
  ]
})

display("WORST RESPONSE TIMES (need improvement):")
for (let i = 0; i < worstStations.length; i++) {
  display(`${i+1}. ${worstStations[i].station}: ${worstStations[i].avg_time.toFixed(1)} minutes`)
}

display("BEST RESPONSE TIMES:")
for (let i = 0; i < bestStations.length; i++) {
  display(`${i+1}. ${bestStations[i].station}: ${bestStations[i].avg_time.toFixed(1)} minutes`)
}

let eventCount = {}

for (let i = 0; i < upcoming_events.length; i++) {
  let row = upcoming_events[i]
  let station = row.station_near
  
  if (!eventCount[station]) {
    eventCount[station] = 0
  }
  eventCount[station] += 1
}

let incidentCount = {}
for (let i = 0; i < incidents.length; i++) {
  let station = incidents[i].station
  incidentCount[station] = (incidentCount[station] || 0) + 1
}

let maxIncidents = 0
for (let station in incidentCount) {
  if (incidentCount[station] > maxIncidents) {
    maxIncidents = incidentCount[station]
  }
}

let staffingNeed = []

for (let station in eventCount) {
  let events = eventCount[station]
  let staff = currentStaffing[station] || 5
  let incidentsAtStation = incidentCount[station] || 0
  let incidentRate = incidentsAtStation / (maxIncidents || 1)
  
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

let staffingForHexbin = staffingNeed.map((s, idx) => ({
  x: s.needScore * 8,
  y: s.events * 12,
  station: s.station,
  events: s.events,
  staff: s.staff,
  incidents: s.incidents,
  needScore: s.needScore
}))

Plot.plot({
  title: "Staffing Need Analysis - Hexbin Transform",
  width: 900,
  height: 450,
  x: { label: "Need Score (scaled)", grid: true },
  y: { label: "Number of Events (scaled)", grid: true },
  marks: [
    Plot.hexbin(staffingForHexbin, {
      x: "x",
      y: "y",
      fill: "count",
      tip: true,
      stroke: "white",
      strokeWidth: 0.5
    }),
    
    Plot.dot(staffingForHexbin, {
      x: "x",
      y: "y",
      stroke: "black",
      fill: "white",
      r: 4,
      tip: true,
      title: d => `${d.station}: Need score ${d.needScore.toFixed(1)}`
    }),
    
    Plot.text(topThree.map(s => {
      let found = staffingForHexbin.find(d => d.station === s.station)
      return { ...found, station: s.station }
    }), {
      x: "x",
      y: d => d.y + 3,
      text: "station",
      fill: "darkred",
      fontSize: 10,
      fontWeight: "bold"
    }),
    
    Plot.rect([{ x1: 35, y1: 25, x2: 70, y2: 45 }], {
      x1: "x1",
      x2: "x2",
      y1: "y1",
      y2: "y2",
      fill: null,
      stroke: "red",
      strokeWidth: 2,
      strokeDasharray: "5,3"
    }),
    
    Plot.text([{ x: 40, y: 48, text: "▲ High priority cluster" }], {
      x: "x",
      y: "y",
      text: "text",
      fill: "red",
      fontSize: 11,
      fontWeight: "bold"
    })
  ]
})

display("TOP 3 STATIONS NEEDING STAFFING HELP:")
for (let i = 0; i < topThree.length; i++) {
  let s = topThree[i]
  display(`${i+1}. ${s.station}: ${s.events} upcoming events, ${s.incidents} past incidents, only ${s.staff} current staff`)
})
```