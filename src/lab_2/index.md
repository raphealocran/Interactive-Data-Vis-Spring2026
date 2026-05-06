---
title: "Lab 2: Subway Staffing Analysis"
toc: true
---

# NYC Subway Staffing Dashboard

This dashboard uses summer 2025 ridership and event data, ten years of incident records, and the 2026 event calendar to answer the staffing questions in the lab. The main takeaway is that the July 15 fare increase coincides with lower systemwide ridership, but event-heavy stations still need extra attention because large events create localized demand and incident pressure.

```js
const incidents = FileAttachment("./data/incidents.csv").csv({typed: true})
const local_events = FileAttachment("./data/local_events.csv").csv({typed: true})
const upcoming_events = FileAttachment("./data/upcoming_events.csv").csv({typed: true})
const ridership = FileAttachment("./data/ridership.csv").csv({typed: true})
```

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

const fareIncreaseDate = new Date("2025-07-15")
const formatNumber = d3.format(",.0f")
const formatPercent = d3.format("+.1f")
const formatDate = d3.timeFormat("%b %-d")

const ridershipRows = ridership.map(d => ({
  ...d,
  date: new Date(d.date),
  rides: Number(d.entrances) + Number(d.exits)
}))

const dailyRidership = d3.rollups(
  ridershipRows,
  rows => d3.sum(rows, d => d.rides),
  d => +d.date
).map(([date, rides]) => ({
  date: new Date(date),
  rides
})).sort((a, b) => a.date - b.date)

const parsedLocalEvents = local_events.map(d => ({
  ...d,
  date: new Date(d.date),
  attendance: Number(d.estimated_attendance)
}))

const localEventDays = d3.rollups(
  parsedLocalEvents,
  rows => ({
    event_count: rows.length,
    attendance: d3.sum(rows, d => d.attendance),
    label: rows.map(d => d.event_name).join(", ")
  }),
  d => +d.date
).map(([date, values]) => {
  const day = new Date(date)
  const ridershipDay = dailyRidership.find(d => +d.date === +day)
  return {
    date: day,
    rides: ridershipDay?.rides,
    event_count: values.event_count,
    attendance: values.attendance,
    label: values.label
  }
}).sort((a, b) => a.date - b.date)

const eventDayKeys = new Set(localEventDays.map(d => +d.date))
const eventDayAverage = d3.mean(dailyRidership.filter(d => eventDayKeys.has(+d.date)), d => d.rides)
const nonEventDayAverage = d3.mean(dailyRidership.filter(d => !eventDayKeys.has(+d.date)), d => d.rides)
const eventLift = (eventDayAverage - nonEventDayAverage) / nonEventDayAverage * 100

const beforeFareAverage = d3.mean(dailyRidership.filter(d => d.date < fareIncreaseDate), d => d.rides)
const afterFareAverage = d3.mean(dailyRidership.filter(d => d.date >= fareIncreaseDate), d => d.rides)
const fareChange = (afterFareAverage - beforeFareAverage) / beforeFareAverage * 100

const highestEventDay = d3.greatest(localEventDays, d => d.attendance)

const stationResponse = d3.rollups(
  incidents,
  rows => ({
    avg_response: d3.mean(rows, d => Number(d.response_time_minutes)),
    median_response: d3.median(rows, d => Number(d.response_time_minutes)),
    incident_count: rows.length,
    high_severity: rows.filter(d => d.severity === "high").length
  }),
  d => d.station
).map(([station, values]) => ({
  station,
  staff: currentStaffing[station],
  ...values
})).sort((a, b) => a.avg_response - b.avg_response)

const systemResponseAverage = d3.mean(stationResponse, d => d.avg_response)
const bestStations = stationResponse.slice(0, 5)
const worstStations = stationResponse.slice(-5).reverse()

const upcomingRows = upcoming_events.map(d => ({
  ...d,
  date: new Date(d.date),
  expected_attendance: Number(d.expected_attendance)
}))

const upcomingByStation = d3.rollups(
  upcomingRows,
  rows => ({
    events: rows.length,
    expected_attendance: d3.sum(rows, d => d.expected_attendance),
    largest_event: d3.max(rows, d => d.expected_attendance)
  }),
  d => d.nearby_station
).map(([station, values]) => ({
  station,
  ...values
}))

const maxExpectedAttendance = d3.max(upcomingByStation, d => d.expected_attendance)
const maxHistoricalIncidents = d3.max(stationResponse, d => d.incident_count)
const maxResponseAverage = d3.max(stationResponse, d => d.avg_response)

const stationResponseByName = new Map(stationResponse.map(d => [d.station, d]))

const staffingNeed = upcomingByStation.map(d => {
  const response = stationResponseByName.get(d.station)
  const staff = currentStaffing[d.station] ?? 0
  const score =
    d.events * 2 +
    d.expected_attendance / maxExpectedAttendance * 8 +
    (response?.incident_count ?? 0) / maxHistoricalIncidents * 5 +
    (response?.avg_response ?? 0) / maxResponseAverage * 5 -
    staff / 4

  return {
    ...d,
    staff,
    avg_response: response?.avg_response ?? 0,
    historical_incidents: response?.incident_count ?? 0,
    need_score: score
  }
}).sort((a, b) => b.need_score - a.need_score)

const topThreeStaffing = staffingNeed.slice(0, 3)
const priorityStation = topThreeStaffing[0]
```

Event days averaged **${formatNumber(eventDayAverage)} rides**, compared with **${formatNumber(nonEventDayAverage)} rides** on non-event days. That is a **${formatPercent(eventLift)}% difference**, so the local event calendar appears to lift ridership on affected summer days.

The July 15 fare increase tells a different story at the system level. Average daily ridership fell from **${formatNumber(beforeFareAverage)} rides before July 15** to **${formatNumber(afterFareAverage)} rides after July 15**, a **${formatPercent(fareChange)}% change**. In other words, events still produced visible spikes, but the fare increase coincided with a lower post-July-15 baseline.

```js
Plot.plot({
  width,
  height: 320,
  marginLeft: 70,
  y: {label: "Daily entrances + exits", grid: true, tickFormat: "~s"},
  x: {label: null},
  marks: [
    Plot.lineY(dailyRidership, {
      x: "date",
      y: "rides",
      stroke: "steelblue"
    }),
    Plot.lineY(dailyRidership, Plot.windowY({k: 7, reduce: "mean"}, {
      x: "date",
      y: "rides",
      stroke: "black"
    })),
    Plot.dot(localEventDays, {
      x: "date",
      y: "rides",
      fill: "orange",
      r: 4,
      tip: true
    }),
    Plot.ruleX([fareIncreaseDate], {
      stroke: "red",
      strokeDasharray: "4 4"
    }),
    Plot.text([{date: fareIncreaseDate, rides: d3.max(dailyRidership, d => d.rides), label: "Fare increase"}], {
      x: "date",
      y: "rides",
      text: "label",
      dx: 8,
      dy: 12,
      fill: "red"
    })
  ]
})
```

The orange dots mark event days. The black line uses Plot's `windowY` transform to show a seven-day rolling average, making the post-fare decline easier to compare with daily noise.

The best-response stations are clustered around five minutes: **${bestStations.map(d => `${d.station} (${d.avg_response.toFixed(1)} min)`).join(", ")}**. The slowest stations are much higher: **${worstStations.map(d => `${d.station} (${d.avg_response.toFixed(1)} min)`).join(", ")}**.

```js
Plot.plot({
  width,
  height: 520,
  marginLeft: 160,
  x: {label: "Average response time in minutes", grid: true},
  y: {label: null},
  marks: [
    Plot.barX(stationResponse, {
      x: "avg_response",
      y: "station",
      sort: {y: "x"},
      fill: "steelblue",
      tip: true
    }),
    Plot.ruleX([systemResponseAverage], {
      stroke: "red",
      strokeDasharray: "4 4"
    }),
    Plot.text([{x: systemResponseAverage, y: worstStations[0].station, label: `System avg ${systemResponseAverage.toFixed(1)} min`}], {
      x: "x",
      y: "y",
      text: "label",
      dx: 6,
      dy: -8,
      fill: "red"
    })
  ]
})
```

For 2026, the three stations that need the most staffing help are **${topThreeStaffing.map(d => d.station).join(", ")}**. The score combines the event calendar with operational risk: number of planned events, total expected attendance, historical incident volume, average response time, and current staffing.

```js
Plot.plot({
  width,
  height: 380,
  marginLeft: 70,
  marginBottom: 120,
  y: {label: "Staffing need score", grid: true},
  x: {label: null, tickRotate: -35},
  marks: [
    Plot.barY(staffingNeed, {
      x: "station",
      y: "need_score",
      sort: {x: "-y"},
      fill: "steelblue",
      tip: true
    }),
    Plot.text(topThreeStaffing, {
      x: "station",
      y: "need_score",
      text: d => d.need_score.toFixed(1),
      dy: -8,
      fontSize: 11
    })
  ]
})
```

The chart below uses a Plot `groupX` transform to count the 2026 events by nearby station directly inside the plot. Canal St and 34 St-Penn Station stand out because they pair heavy event calendars with operational strain.

```js
Plot.plot({
  width,
  height: 300,
  marginLeft: 70,
  marginBottom: 115,
  y: {label: "Number of 2026 events", grid: true},
  x: {label: null, tickRotate: -35},
  marks: [
    Plot.barY(upcomingRows, Plot.groupX({y: "count"}, {
      x: "nearby_station",
      sort: {x: "-y"},
      fill: "steelblue",
      tip: true
    }))
  ]
})
```

If only one station gets extra staffing, I would prioritize **${priorityStation.station}**. It has **${priorityStation.events} planned summer 2026 events**, **${formatNumber(priorityStation.expected_attendance)} expected event attendees**, **${priorityStation.historical_incidents} historical incidents**, and only **${priorityStation.staff} current staff** in the staffing baseline. That combination gives it the highest need score in this analysis.
