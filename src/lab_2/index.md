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

let dates = [];
let riders = [];

for (let i = 0; i < ridership.length; i++) {
  dates.push(new Date(ridership[i].date));
  let value = ridership[i].ridership_count;
  if (value === undefined) {
    value = ridership[i].count;
  }
  if (value === undefined) {
    value = ridership[i].ridership;
  }
  if (value === undefined) {
    value = 0;
  }
  riders.push(value);
}

let beforeSum = 0;
let beforeCount = 0;
let afterSum = 0;
let afterCount = 0;

for (let i = 0; i < dates.length; i++) {
  if (dates[i] < new Date("2025-07-15")) {
    beforeSum = beforeSum + riders[i];
    beforeCount = beforeCount + 1;
  } else {
    afterSum = afterSum + riders[i];
    afterCount = afterCount + 1;
  }
}

let avgBefore = beforeSum / beforeCount;
let avgAfter = afterSum / afterCount;
let percentChange = ((avgAfter - avgBefore) / avgBefore) * 100;
percentChange = percentChange.toFixed(1);

let plot1 = Plot.plot({
  title: "Ridership Before and After Fare Increase",
  width: 700,
  height: 400,
  x: { label: "Date" },
  y: { label: "Daily Ridership", grid: true },
  marks: [
    Plot.line(ridership, {
      x: "date",
      y: "ridership_count",
      stroke: "blue"
    }),
    Plot.ruleX([new Date("2025-07-15")], {
      stroke: "red",
      strokeWidth: 2
    })
  ]
});

display(plot1);
display("Fare increase happened on July 15, 2025 (red line)");
display("Average ridership changed by " + percentChange + "%");

let eventNames = [];
let eventImpacts = [];

for (let i = 0; i < local_events.length; i++) {
  let name = local_events[i].event_name;
  if (name === undefined) {
    name = local_events[i].name;
  }
  if (name === undefined) {
    name = "Event " + i;
  }
  eventNames.push(name);
  
  let impact = local_events[i].ridership_impact;
  if (impact === undefined) {
    impact = local_events[i].impact;
  }
  if (impact === undefined) {
    impact = 0;
  }
  eventImpacts.push(impact);
}

let eventData = [];
for (let i = 0; i < eventNames.length; i++) {
  eventData.push({ name: eventNames[i], impact: eventImpacts[i] });
}

let plot2 = Plot.plot({
  title: "Event Impact on Ridership",
  width: 700,
  height: 300,
  marginLeft: 120,
  x: { label: "Impact (%)", grid: true },
  y: { label: "" },
  marks: [
    Plot.barX(eventData, {
      y: "name",
      x: "impact",
      fill: "steelblue"
    }),
    // ANNOTATION: Zero line
    Plot.ruleX([0], { stroke: "black" })
  ]
});

display(plot2);
display("Events increase ridership by 15-40% at nearby stations");
```

```js
let stationNames = [];
let avgTimes = [];

for (let station in currentStaffing) {
  let total = 0;
  let count = 0;
  
  for (let i = 0; i < incidents.length; i++) {
    if (incidents[i].station === station) {
      let time = incidents[i].response_time;
      if (time === undefined) {
        time = incidents[i].responseTime;
      }
      if (time === undefined) {
        time = 0;
      }
      total = total + time;
      count = count + 1;
    }
  }
  
  let average = 20;
  if (count > 0) {
    average = total / count;
  }
  
  stationNames.push(station);
  avgTimes.push(average);
}

let bestNames = [];
let bestTimes = [];

for (let i = 0; i < 3; i++) {
  let minIndex = 0;
  for (let j = 0; j < avgTimes.length; j++) {
    if (avgTimes[j] < avgTimes[minIndex]) {
      minIndex = j;
    }
  }
  bestNames.push(stationNames[minIndex]);
  bestTimes.push(avgTimes[minIndex]);
  stationNames.splice(minIndex, 1);
  avgTimes.splice(minIndex, 1);
}

let worstNames = [];
let worstTimes = [];

for (let i = 0; i < 3; i++) {
  let maxIndex = 0;
  for (let j = 0; j < avgTimes.length; j++) {
    if (avgTimes[j] > avgTimes[maxIndex]) {
      maxIndex = j;
    }
  }
  worstNames.push(stationNames[maxIndex]);
  worstTimes.push(avgTimes[maxIndex]);
  stationNames.splice(maxIndex, 1);
  avgTimes.splice(maxIndex, 1);
}

let bestData = [];
for (let i = 0; i < bestNames.length; i++) {
  bestData.push({ name: bestNames[i], time: bestTimes[i] });
}

let worstData = [];
for (let i = 0; i < worstNames.length; i++) {
  worstData.push({ name: worstNames[i], time: worstTimes[i] });
}

let plot3 = Plot.plot({
  title: "Emergency Response Times - Best vs Worst Stations",
  width: 700,
  height: 350,
  marginLeft: 120,
  x: { label: "Response Time (minutes)", grid: true },
  y: { label: "" },
  marks: [
    Plot.barX(bestData, {
      y: "name",
      x: "time",
      fill: "green"
    }),
    Plot.barX(worstData, {
      y: "name",
      x: "time",
      fill: "red"
    }),
    Plot.ruleX([15], {
      stroke: "orange",
      strokeWidth: 2,
      strokeDash: [5, 5]
    })
  ]
});

display(plot3);

display("Best Response Times (Fastest):");
for (let i = 0; i < bestData.length; i++) {
  display((i + 1) + ". " + bestData[i].name + ": " + bestData[i].time.toFixed(1) + " minutes");
}

display(" ");
display("Worst Response Times (Slowest):");
for (let i = 0; i < worstData.length; i++) {
  display((i + 1) + ". " + worstData[i].name + ": " + worstData[i].time.toFixed(1) + " minutes");
}
```

```js
let allStations = Object.keys(currentStaffing);

let needNames = [];
let needScores = [];

for (let s = 0; s < allStations.length; s++) {
  let station = allStations[s];
  let staff = currentStaffing[station];
  
  let riderTotal = 0;
  let riderCount = 0;
  
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
      riderTotal = riderTotal + riders;
      riderCount = riderCount + 1;
    }
  }
  
  let avgRidership = 5000;
  if (riderCount > 0) {
    avgRidership = riderTotal / riderCount;
  }
  
  let ridersPerStaff = avgRidership / staff;
  
  let responseTime = 20;
  for (let i = 0; i < incidents.length; i++) {
    if (incidents[i].station === station) {
      let time = incidents[i].response_time;
      if (time === undefined) {
        time = incidents[i].responseTime;
      }
      if (time !== undefined && time > 0) {
        responseTime = time;
      }
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
  
  needNames.push(station);
  needScores.push(needScore);
}

let top3Names = [];
let top3Scores = [];
let top3Staff = [];
let top3RidersPerStaff = [];
let top3ResponseTimes = [];
let top3EventCounts = [];

for (let i = 0; i < 3; i++) {
  let maxIndex = 0;
  for (let j = 0; j < needScores.length; j++) {
    if (needScores[j] > needScores[maxIndex]) {
      maxIndex = j;
    }
  }
  
  let stationName = needNames[maxIndex];
  top3Names.push(stationName);
  top3Scores.push(needScores[maxIndex]);
  top3Staff.push(currentStaffing[stationName]);
  
  let riderTotal = 0;
  let riderCount = 0;
  for (let j = 0; j < ridership.length; j++) {
    if (ridership[j].station === stationName) {
      let riders = ridership[j].ridership_count;
      if (riders === undefined) {
        riders = ridership[j].count;
      }
      if (riders === undefined) {
        riders = ridership[j].ridership;
      }
      if (riders === undefined) {
        riders = 0;
      }
      riderTotal = riderTotal + riders;
      riderCount = riderCount + 1;
    }
  }
  let avgRidership = riderTotal / riderCount;
  top3RidersPerStaff.push(Math.round(avgRidership / currentStaffing[stationName]));
  
  let respTime = 20;
  for (let j = 0; j < incidents.length; j++) {
    if (incidents[j].station === stationName) {
      let time = incidents[j].response_time;
      if (time === undefined) {
        time = incidents[j].responseTime;
      }
      if (time !== undefined && time > 0) {
        respTime = time;
      }
    }
  }
  top3ResponseTimes.push(respTime);
  
  let evCount = 0;
  for (let j = 0; j < upcoming_events.length; j++) {
    let eventStation = upcoming_events[j].nearby_station;
    if (eventStation === undefined) {
      eventStation = upcoming_events[j].station;
    }
    if (eventStation === stationName) {
      evCount = evCount + 1;
    }
  }
  top3EventCounts.push(evCount);
  
  needNames.splice(maxIndex, 1);
  needScores.splice(maxIndex, 1);
}

// Create data for plotting
let needData = [];
for (let i = 0; i < top3Names.length; i++) {
  needData.push({ name: top3Names[i], score: top3Scores[i] });
}

let plot4 = Plot.plot({
  title: "Top 3 Stations Needing Staffing Help",
  width: 700,
  height: 300,
  marginLeft: 120,
  x: { label: "Need Score (higher = more urgent)", grid: true },
  y: { label: "" },
  marks: [
    Plot.barX(needData, {
      y: "name",
      x: "score",
      fill: "orange"
    }),
    Plot.ruleX([0.5], {
      stroke: "red",
      strokeWidth: 2,
      strokeDash: [4, 4]
    })
  ]
});

display(plot4);
display("Top 3 Stations Needing Staffing:");

for (let i = 0; i < top3Names.length; i++) {
  let extraStaff = Math.ceil(top3Staff[i] * 0.5);
  
  display(" ");
  display((i + 1) + ". " + top3Names[i]);
  display("   Current staff: " + top3Staff[i]);
  display("   Riders per staff: " + top3RidersPerStaff[i]);
  display("   Response time: " + top3ResponseTimes[i].toFixed(1) + " minutes");
  display("   Upcoming events in 2026: " + top3EventCounts[i]);
  display("   Recommendation: Add " + extraStaff + " more staff");
  }
```