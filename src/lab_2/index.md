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

console.log("NYC SUBWAY STAFFING ANALYSIS");
console.log("================================");

console.log("\nQUESTION 1: How did events and fare increase impact ridership?");

let ridershipBefore = 0;
let ridershipAfter = 0;
let countBefore = 0;
let countAfter = 0;

for (let i = 0; i < ridership.length; i++) {
    let record = ridership[i];
    let date = record.date;
    let riders = record.ridership_count || record.count || record.ridership;
    
    if (date < "2025-07-15") {
        ridershipBefore = ridershipBefore + riders;
        countBefore = countBefore + 1;
    } else {
        ridershipAfter = ridershipAfter + riders;
        countAfter = countAfter + 1;
    }
}

let avgBefore = ridershipBefore / countBefore;
let avgAfter = ridershipAfter / countAfter;
let change = ((avgAfter - avgBefore) / avgBefore) * 100;

console.log("Fare change: $2.75 to $3.00 on July 15, 2025");
console.log("Ridership change: " + change.toFixed(1) + "%");

console.log("\nEvent impacts:");
for (let i = 0; i < local_events.length; i++) {
    let event = local_events[i];
    let name = event.event_name || event.name;
    let station = event.nearby_station || event.station;
    let impact = event.ridership_impact || event.impact || 0;
    
    console.log("- " + name + " at " + station + ": +" + impact + "% ridership");
}

console.log("\n\nQUESTION 2: Which stations have best/worst response times?");

let stationResponse = [];

for (let station in currentStaffing) {
    let totalTime = 0;
    let incidentCount = 0;
    
    for (let i = 0; i < incidents.length; i++) {
        let incident = incidents[i];
        if (incident.station === station) {
            totalTime = totalTime + (incident.response_time || incident.responseTime);
            incidentCount = incidentCount + 1;
        }
    }
    
    let avgTime = incidentCount > 0 ? totalTime / incidentCount : 20;
    
    stationResponse.push({
        name: station,
        time: avgTime,
        staff: currentStaffing[station]
    });
}

stationResponse.sort(function(a, b) {
    return a.time - b.time;
});

console.log("\nBEST response times (fastest):");
console.log("1. " + stationResponse[0].name + ": " + stationResponse[0].time.toFixed(1) + " minutes");
console.log("2. " + stationResponse[1].name + ": " + stationResponse[1].time.toFixed(1) + " minutes");
console.log("3. " + stationResponse[2].name + ": " + stationResponse[2].time.toFixed(1) + " minutes");

console.log("\nWORST response times (slowest):");
let last = stationResponse.length - 1;
console.log("1. " + stationResponse[last].name + ": " + stationResponse[last].time.toFixed(1) + " minutes");
console.log("2. " + stationResponse[last-1].name + ": " + stationResponse[last-1].time.toFixed(1) + " minutes");
console.log("3. " + stationResponse[last-2].name + ": " + stationResponse[last-2].time.toFixed(1) + " minutes");

console.log("\n\nQUESTION 3: Which three stations need the most staffing help?");

let stationNeeds = [];

for (let station in currentStaffing) {
    let staff = currentStaffing[station];
    
    let ridershipTotal = 0;
    let ridershipCount = 0;
    for (let i = 0; i < ridership.length; i++) {
        if (ridership[i].station === station) {
            ridershipTotal = ridershipTotal + (ridership[i].ridership_count || ridership[i].count || ridership[i].ridership);
            ridershipCount = ridershipCount + 1;
        }
    }
    let avgRidership = ridershipCount > 0 ? ridershipTotal / ridershipCount : 5000;
    let burden = avgRidership / staff;
    
    let responseInfo = stationResponse.find(function(s) {
        return s.name === station;
    });
    let responseTime = responseInfo ? responseInfo.time : 20;
    
    let eventCount = 0;
    for (let i = 0; i < upcoming_events.length; i++) {
        let eventStation = upcoming_events[i].nearby_station || upcoming_events[i].station;
        if (eventStation === station) {
            eventCount = eventCount + 1;
        }
    }
    
    let burdenScore = burden / 5000;
    let responseScore = responseTime / 30;
    let eventScore = eventCount / 5;
    
    let needScore = (burdenScore * 0.4) + (responseScore * 0.35) + (eventScore * 0.25);
    
    stationNeeds.push({
        name: station,
        staff: staff,
        burden: Math.round(burden),
        responseTime: responseTime,
        events: eventCount,
        score: needScore
    });
}

stationNeeds.sort(function(a, b) {
    return b.score - a.score;
});

console.log("\nTOP 3 STATIONS NEEDING STAFFING:");
for (let i = 0; i < 3; i++) {
    let station = stationNeeds[i];
    let extraStaff = Math.ceil(station.staff * 0.5);
    
    console.log("\n" + (i+1) + ". " + station.name);
    console.log("   Current staff: " + station.staff);
    console.log("   Riders per staff: " + station.burden.toLocaleString());
    console.log("   Response time: " + station.responseTime.toFixed(1) + " minutes");
    console.log("   Events in 2026: " + station.events);
    console.log("   RECOMMEND: Add " + extraStaff + " more staff");
}

console.log("\n\nBONUS: Which station should be the #1 priority?");

let priority = stationNeeds[0];

console.log("\nPRIORITY STATION: " + priority.name);
console.log("\nWhy this station?");
console.log("1. Has " + priority.burden.toLocaleString() + " riders per staff member");
console.log("2. Response time is " + priority.responseTime.toFixed(1) + " minutes");
console.log("3. Will host " + priority.events + " major events in summer 2026");
console.log("4. Currently only has " + priority.staff + " staff members");

let recommendedStaff = Math.ceil(priority.staff * 1.75);
console.log("\nRecommendation: Increase staff from " + priority.staff + " to " + recommendedStaff);
```