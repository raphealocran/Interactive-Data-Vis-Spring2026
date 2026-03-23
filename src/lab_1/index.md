---
title: "Lab 1: Passing Pollinators"
toc: true
---

This page is where you can iterate. Follow the lab instructions in the [readme.md](./README).

## MARKDWON 

```js
import * as Plot from "npm:@observablehq/plot";

const data = await FileAttachment("data/pollinator_activity_data.csv").csv({ typed: true });

display("ALL DATA:");
display(data);

display("Question 1: Body Mass and Wing Span Distribution by Species");

const bodyMassPlot = Plot.plot({
  title: "Body Mass by Pollinator Species",
  marginLeft: 80,
  y: {
    label: "Body Mass (grams)"
  },
  x: {
    label: "Pollinator Species"
  },
  marks: [
    Plot.dot(data, {
      x: "pollinator_species",
      y: "avg_body_mass_g",
      fill: "pollinator_species"
    })
  ]
});
display(bodyMassPlot);

const wingSpanPlot = Plot.plot({
  title: "Wing Span by Pollinator Species",
  marginLeft: 80,
  y: {
    label: "Wing Span (millimeters)"
  },
  x: {
    label: "Pollinator Species"
  },
  marks: [
    Plot.dot(data, {
      x: "pollinator_species",
      y: "avg_wing_span_mm",
      fill: "pollinator_species"
    })
  ]
});
display(wingSpanPlot);

display("Question 2: Ideal Weather Conditions for Pollinating");

const weatherGroups = {};

for (let i = 0; i < data.length; i++) {
  const weather = data[i].weather_condition;
  const visits = data[i].visit_count;
  
  if (!weatherGroups[weather]) {
    weatherGroups[weather] = {
      totalVisits: 0,
      numberOfObservations: 0
    };
  }
  
  weatherGroups[weather].totalVisits = weatherGroups[weather].totalVisits + visits;
  weatherGroups[weather].numberOfObservations = weatherGroups[weather].numberOfObservations + 1;
}

const weatherData = [];
const weatherNames = Object.keys(weatherGroups);

for (let i = 0; i < weatherNames.length; i++) {
  const weather = weatherNames[i];
  const avgVisits = weatherGroups[weather].totalVisits / weatherGroups[weather].numberOfObservations;
  
  weatherData.push({
    weather: weather,
    avgVisits: avgVisits
  });
}

const weatherPlot = Plot.plot({
  title: "Average Pollinator Visits by Weather Condition",
  y: {
    label: "Average Number of Visits"
  },
  x: {
    label: "Weather Condition"
  },
  marks: [
    Plot.barY(weatherData, {
      x: "weather",
      y: "avgVisits",
      fill: "weather"
    })
  ]
});
display(weatherPlot);

let bestWeather = weatherData[0];
for (let i = 1; i < weatherData.length; i++) {
  if (weatherData[i].avgVisits > bestWeather.avgVisits) {
    bestWeather = weatherData[i];
  }
}

display("Best weather condition: " + bestWeather.weather + " with " + bestWeather.avgVisits.toFixed(1) + " average visits");

if (data[0] && data[0].temperature !== undefined) {
  display("Temperature Analysis:");
  
  const tempPlot = Plot.plot({
    title: "Temperature vs Pollinator Visits",
    x: {
      label: "Temperature (Celsius)"
    },
    y: {
      label: "Visit Count"
    },
    marks: [
      Plot.dot(data, {
        x: "temperature",
        y: "visit_count",
        fill: "weather_condition"
      })
    ]
  });
  display(tempPlot);
  
  const tempGroups = {};
  
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].temperature;
    const visits = data[i].visit_count;
    
    const tempGroup = Math.round(temp / 5) * 5;
    
    if (!tempGroups[tempGroup]) {
      tempGroups[tempGroup] = {
        totalVisits: 0,
        numberOfObservations: 0
      };
    }
    
    tempGroups[tempGroup].totalVisits = tempGroups[tempGroup].totalVisits + visits;
    tempGroups[tempGroup].numberOfObservations = tempGroups[tempGroup].numberOfObservations + 1;
  }
  
  let bestTemp = null;
  let bestTempAvg = 0;
  
  const tempRanges = Object.keys(tempGroups);
  for (let i = 0; i < tempRanges.length; i++) {
    const temp = tempRanges[i];
    const avgVisits = tempGroups[temp].totalVisits / tempGroups[temp].numberOfObservations;
    
    if (avgVisits > bestTempAvg) {
      bestTempAvg = avgVisits;
      bestTemp = temp;
    }
  }
  
  display("Optimal temperature range: Around " + bestTemp + " degrees Celsius with " + bestTempAvg.toFixed(1) + " average visits");
}

display("Question 3: Flower Nectar Production Analysis");

const flowerGroups = {};

for (let i = 0; i < data.length; i++) {
  const flower = data[i].flower_species;
  const nectar = data[i].nectar_production;
  
  if (!flowerGroups[flower]) {
    flowerGroups[flower] = {
      totalNectar: 0,
      numberOfObservations: 0
    };
  }
  
  flowerGroups[flower].totalNectar = flowerGroups[flower].totalNectar + nectar;
  flowerGroups[flower].numberOfObservations = flowerGroups[flower].numberOfObservations + 1;
}

const flowerData = [];
const flowerNames = Object.keys(flowerGroups);

for (let i = 0; i < flowerNames.length; i++) {
  const flower = flowerNames[i];
  const avgNectar = flowerGroups[flower].totalNectar / flowerGroups[flower].numberOfObservations;
  
  flowerData.push({
    flower: flower,
    avgNectar: avgNectar
  });
}

flowerData.sort(function(a, b) {
  return b.avgNectar - a.avgNectar;
});

const nectarPlot = Plot.plot({
  title: "Average Nectar Production by Flower Species",
  y: {
    label: "Average Nectar Production"
  },
  x: {
    label: "Flower Species"
  },
  marks: [
    Plot.barY(flowerData, {
      x: "flower",
      y: "avgNectar",
      fill: "flower"
    })
  ]
});
display(nectarPlot);

display("Winner: " + flowerData[0].flower + " has the most nectar with " + flowerData[0].avgNectar.toFixed(2) + " average production");

if (flowerData.length > 1) {
  display("Runner up: " + flowerData[1].flower + " with " + flowerData[1].avgNectar.toFixed(2) + " average production");
}