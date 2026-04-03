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

parsedRidership.forEach(row => {
  if (row.date < cutoff) beforeRides.push(row.rides)
  else afterRides.push(row.rides)
})

const getAverage = arr =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0

const avgBefore = getAverage(beforeRides)
const avgAfter = getAverage(afterRides)

const percentChange =
  avgBefore === 0
    ? 0
    : ((avgAfter - avgBefore) / avgBefore * 100).toFixed(1)

const eventDates = local_events.map(e => ({
  date: new Date(e.date)
}))

const maxRides = Math.max(...parsedRidership.map(d => d.rides))

const stationTimes = {}

incidents.forEach(row => {
  const station = row.station
  const time = Number(row.response_time_minutes) || 0
  if (!stationTimes[station]) stationTimes[station] = []
  stationTimes[station].push(time)
})

const stationAvg = Object.entries(stationTimes).map(([station, times]) => ({
  station,
  avg_time: getAverage(times)
})).sort((a, b) => a.avg_time - b.avg_time)

const systemAvg = getAverage(stationAvg.map(d => d.avg_time))

const worstStations = [...stationAvg].reverse().slice(0, 5)
const bestStations = stationAvg.slice(0, 5)

const eventCount = {}
upcoming_events.forEach(e => {
  const s = e.nearby_station
  eventCount[s] = (eventCount[s] || 0) + 1
})

const incidentCount = {}
incidents.forEach(i => {
  const s = i.station
  incidentCount[s] = (incidentCount[s] || 0) + 1
})

const maxIncidents = Math.max(...Object.values(incidentCount), 1)

const staffingNeed = Object.entries(eventCount)
  .map(([station, events]) => {
    const staff = currentStaffing[station] || 5
    const incidentsAtStation = incidentCount[station] || 0
    const incidentRate = incidentsAtStation / maxIncidents

    const needScore = (events * 2) + (incidentRate * 5) - (staff / 4)

    return { station, events, staff, incidents: incidentsAtStation, needScore }
  })
  .sort((a, b) => b.needScore - a.needScore)

const topThree = staffingNeed.slice(0, 3)
```

```js
Plot.plot({
  width: 900,
  height: 300,
  marginLeft: 80,
  marginBottom: 60,
  x: { type: "utc", label: "Date", tickFormat: "%b %d" },
  y: { label: "Ridership", grid: true },
  marks: [
    Plot.line(parsedRidership, {
      x: "date",
      y: "rides"
    }),
    Plot.ruleX([cutoff], { stroke: "red", strokeDasharray: "4,4" }),
    Plot.dot(
      eventDates.map(d => ({
        date: d.date,
        rides: maxRides * 0.8
      })),
      {
        x: "date",
        y: "rides",
        fill: "orange",
        r: 4,
        tip: d => `${d.date.toISOString().slice(0, 10)} event`
      }
    )
  ]
})
```

```js
Plot.plot({
  width: 900,
  height: 350,
  marginLeft: 150,
  marginBottom: 40,
  x: { label: "Response Time (minutes)", grid: true },
  y: { label: "Station" },
  marks: [
    Plot.barX(stationAvg, {
      x: "avg_time",
      y: "station"
    }),
    Plot.ruleX([systemAvg], { stroke: "red", strokeDasharray: "3,3" })
  ]
})
```

```js
Plot.plot({
  width: 900,
  height: 350,
  marginBottom: 50,
  x: { label: "Station" },
  y: { label: "Need Score", grid: true },
  marks: [
    Plot.barY(staffingNeed, {
      x: "station",
      y: "needScore"
    })
  ]
})
```

```js
display("Top 5 Best Stations (Fastest Response Times)")
bestStations.forEach((d, i) => {
  display(`${i + 1}. ${d.station}: ${d.avg_time.toFixed(1)} min`)
})

display("Top 5 Worst Stations (Slowest Response Times)")
worstStations.forEach((d, i) => {
  display(`${i + 1}. ${d.station}: ${d.avg_time.toFixed(1)} min`)
})

display("Top 3 Stations Needing Staff")
topThree.forEach((s, i) => {
  display(
    `${i + 1}. ${s.station} — events: ${s.events}, incidents: ${s.incidents}, staff: ${s.staff}, score: ${s.needScore.toFixed(1)}`
  )
})

const topPriority = staffingNeed[0]

display("PRIORITY STATION: " + topPriority.station)
display(
  `Why: ${topPriority.events} events, ${topPriority.incidents} incidents, ${topPriority.staff} staff`
)
display("Recommendation: Add 5–7 temporary staff during peak periods")
```
```