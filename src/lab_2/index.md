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

let processedRidership = [];
for (let i = 0; i < ridership.length; i++) {
  let record = ridership[i];
  let newRecord = {};
  newRecord.date = new Date(record.date);
  newRecord.riders = record.ridership_count;
  if (newRecord.riders === undefined) {
    newRecord.riders = record.count;
  }
  if (newRecord.riders === undefined) {
    newRecord.riders = record.ridership;
  }
  if (newRecord.riders === undefined) {
    newRecord.riders = 0;
  }
  processedRidership.push(newRecord);
}

processedRidership.sort(function(a, b) {
  if (a.date < b.date) return -1;
  if (a.date > b.date) return 1;
  return 0;
});

let beforeData = [];
let afterData = [];
let fareDate = new Date("2025-07-15");

for (let i = 0; i < processedRidership.length; i++) {
  if (processedRidership[i].date < fareDate) {
    beforeData.push(processedRidership[i]);
  } else {
    afterData.push(processedRidership[i]);
  }
}

let beforeSum = 0;
for (let i = 0; i < beforeData.length; i++) {
  beforeSum = beforeSum + beforeData[i].riders;
}
let avgBefore = beforeSum / beforeData.length;

let afterSum = 0;
for (let i = 0; i < afterData.length; i++) {
  afterSum = afterSum + afterData[i].riders;
}
let avgAfter = afterSum / afterData.length;

let changeAmount = avgAfter - avgBefore;
let percentChange = (changeAmount / avgBefore) * 100;
percentChange = percentChange.toFixed(1);

let ridershipPlot = Plot.plot({
  title: "Ridership Before and After Fare Increase ($2.75 to $3.00)",
  subtitle: "Ridership changed by " + percentChange + "% after July 15, 2025",
  width: 800,
  height: 400,
  x: { label: "Date", type: "utc", tickFormat: "%b %Y" },
  y: { label: "Daily Ridership", grid: true },
  marks: [
    Plot.binY(
      { y: "mean" },
      processedRidership,
      {
        x: "date",
        y: "riders",
        thresholds: "months",
        tip: true,
        stroke: "steelblue",
        strokeWidth: 2
      }
    ),
    Plot.line(processedRidership, {
      x: "date",
      y: "riders",
      stroke: "gray",
      strokeOpacity: 0.3,
      tip: true
    }),
    Plot.text([{ date: new Date("2025-07-15"), riders: avgAfter }], {
      x: "date",
      y: "riders",
      text: ["Fare Increase Date"],
      dx: 10,
      dy: -20,
      fill: "red",
      fontSize: 11
    })
  ]
});

display(ridershipPlot);
display("The fare increase from $2.75 to $3.00 happened on July 15, 2025.");
display("Average ridership changed by " + percentChange + "% after this date.");

display(" ");
display("Event Impacts on Ridership:");

for (let i = 0; i < local_events.length; i++) {
  let event = local_events[i];
  let eventName = event.event_name;
  if (eventName === undefined) {
    eventName = event.name;
  }
  if (eventName === undefined) {
    eventName = "Unknown Event";
  }
  
  let eventStation = event.nearby_station;
  if (eventStation === undefined) {
    eventStation = event.station;
  }
  if (eventStation === undefined) {
    eventStation = "Unknown Station";
  }
  
  let impactAmount = event.ridership_impact;
  if (impactAmount === undefined) {
    impactAmount = event.impact;
  }
  if (impactAmount === undefined) {
    impactAmount = 0;
  }
  
  display("- " + eventName + " at " + eventStation + ": +" + impactAmount + "% ridership");
}
```
```js
let stationResponse = [];

for (let station in currentStaffing) {
  let totalTime = 0;
  let incidentCount = 0;
  
  // Find incidents at this station
  for (let i = 0; i < incidents.length; i++) {
    let incident = incidents[i];
    if (incident.station === station) {
      let time = incident.response_time;
      if (time === undefined) {
        time = incident.responseTime;
      }
      if (time === undefined) {
        time = 0;
      }
      totalTime = totalTime + time;
      incidentCount = incidentCount + 1;
    }
  }
  
  let avgTime = 20; // default value
  if (incidentCount > 0) {
    avgTime = totalTime / incidentCount;
  }
  
  stationResponse.push({
    name: station,
    time: avgTime,
    staff: currentStaffing[station]
  });
}

stationResponse.sort(function(a, b) {
  if (a.time < b.time) return -1;
  if (a.time > b.time) return 1;
  return 0;
});

let bestStations = [];
for (let i = 0; i < 5; i++) {
  bestStations.push(stationResponse[i]);
}

let worstStations = [];
for (let i = stationResponse.length - 5; i < stationResponse.length; i++) {
  worstStations.push(stationResponse[i]);
}
worstStations.reverse();

let responsePlot = Plot.plot({
  title: "Emergency Response Times by Station",
  subtitle: "Best vs Worst Performing Stations",
  width: 700,
  height: 400,
  marginLeft: 120,
  x: { label: "Response Time (minutes)", grid: true },
  y: { label: "" },
  marks: [
    Plot.barX(bestStations, {
      y: "name",
      x: "time",
      fill: "steelblue",
      tip: true
    }),
    Plot.barX(worstStations, {
      y: "name",
      x: "time",
      fill: "crimson",
      tip: true
    }),
    Plot.ruleX([15], { 
      stroke: "orange", 
      strokeWidth: 2, 
      strokeDash: [5, 5]
    }),
    Plot.text([{ time: 15, name: "Target" }], {
      x: "time",
      y: "name",
      text: ["Target: 15 minutes"],
      dx: -80,
      dy: -5,
      fontSize: 10,
      fill: "orange"
    })
  ]
});

display(responsePlot);

display(" ");
display("Best Response Times (Fastest):");
for (let i = 0; i < 3; i++) {
  let station = bestStations[i];
  let timeDisplay = station.time.toFixed(1);
  display((i + 1) + ". " + station.name + ": " + timeDisplay + " minutes");
}

display(" ");
display("Worst Response Times (Slowest):");
for (let i = 0; i < 3; i++) {
  let station = worstStations[i];
  let timeDisplay = station.time.toFixed(1);
  display((i + 1) + ". " + station.name + ": " + timeDisplay + " minutes");
}
```

```js
let stationNeeds = [];

for (let station in currentStaffing) {
  let staff = currentStaffing[station];
  
  // Calculate average ridership for this station
  let ridershipTotal = 0;
  let ridershipCount = 0;
  
  for (let i = 0; i < ridership.length; i++) {
    if (ridership[i].station === station) {
      let riders = ridership[i].ridership_count;
      if (riders === undefined) {
        riders = ridership[i].count;
      }
      if (riders === undefined) {
        riders = ridership[i].ridership;
      }
      if (riders === undefined) {
        riders = 0;
      }
      ridershipTotal = ridershipTotal + riders;
      ridershipCount = ridershipCount + 1;
    }
  }
  
  let avgRidership = 5000; // default
  if (ridershipCount > 0) {
    avgRidership = ridershipTotal / ridershipCount;
  }
  
  let ridersPerStaff = avgRidership / staff;
  
  let responseTime = 20; // default
  for (let i = 0; i < stationResponse.length; i++) {
    if (stationResponse[i].name === station) {
      responseTime = stationResponse[i].time;
      break;
    }
  }
  
  let eventCount = 0;
  for (let i = 0; i < upcoming_events.length; i++) {
    let eventStation = upcoming_events[i].nearby_station;
    if (eventStation === undefined) {
      eventStation = upcoming_events[i].station;
    }
    if (eventStation === station) {
      eventCount = eventCount + 1;
    }
  }
  
  let burdenScore = ridersPerStaff / 5000;
  let responseScore = responseTime / 30;
  let eventScore = eventCount / 5;
  let needScore = (burdenScore * 0.5) + (responseScore * 0.3) + (eventScore * 0.2);
  
  stationNeeds.push({
    name: station,
    staff: staff,
    ridersPerStaff: Math.round(ridersPerStaff),
    responseTime: responseTime,
    events: eventCount,
    score: needScore
  });
}

stationNeeds.sort(function(a, b) {
  if (a.score > b.score) return -1;
  if (a.score < b.score) return 1;
  return 0;
});

let topNeeds = [];
for (let i = 0; i < 5; i++) {
  topNeeds.push(stationNeeds[i]);
}

let needsPlot = Plot.plot({
  title: "Stations with Highest Staffing Needs",
  subtitle: "Based on ridership, response times, and upcoming events",
  width: 700,
  height: 350,
  marginLeft: 100,
  x: { label: "Need Score (higher = more urgent)", grid: true },
  y: { label: "" },
  marks: [
    Plot.barX(topNeeds, {
      y: "name",
      x: "score",
      fill: "steelblue",
      tip: true
    }),
    Plot.ruleX([0.6], { 
      stroke: "orange", 
      strokeWidth: 1.5, 
      strokeDash: [4, 4] 
    }),
    Plot.text([{ score: 0.6, name: "High Need" }], {
      x: "score",
      y: "name",
      text: ["High Need Threshold"],
      dx: -80,
      dy: -5,
      fontSize: 9,
      fill: "orange"
    })
  ]
});

display(needsPlot);

display(" ");
display("Top 3 Stations Needing Staffing:");

for (let i = 0; i < 3; i++) {
  let station = topNeeds[i];
  let extraStaff = Math.ceil(station.staff * 0.5);
  
  display(" ");
  display((i + 1) + ". " + station.name);
  display("   Current staff: " + station.staff);
  display("   Riders per staff: " + station.ridersPerStaff);
  display("   Response time: " + station.responseTime.toFixed(1) + " minutes");
  display("   Upcoming events: " + station.events);
  display("   Recommendation: Add " + extraStaff + " more staff");
}
```