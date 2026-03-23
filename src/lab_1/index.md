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

const bodyMassGroups = {};

for (let i = 0; i < data.length; i++) {
  const species = data[i].pollinator_species;
  const bodyMass = data[i].avg_body_mass_g;
  
  if (!bodyMassGroups[species]) {
    bodyMassGroups[species] = {
      totalMass: 0,
      count: 0
    };
  }
  
  bodyMassGroups[species].totalMass = bodyMassGroups[species].totalMass + bodyMass;
  bodyMassGroups[species].count = bodyMassGroups[species].count + 1;
}

const bodyMassData = [];
const speciesNames = Object.keys(bodyMassGroups);

for (let i = 0; i < speciesNames.length; i++) {
  const species = speciesNames[i];
  const avgMass = bodyMassGroups[species].totalMass / bodyMassGroups[species].count;
  
  bodyMassData.push({
    species: species,
    avgBodyMass: avgMass
  });
}

const bodyMassPlot = Plot.plot({
  title: "Average Body Mass by Pollinator Species",
  marginLeft: 80,
  y: {
    label: "Average Body Mass (grams)"
  },
  x: {
    label: "Pollinator Species"
  },
  marks: [
    Plot.barY(bodyMassData, {
      x: "species",
      y: "avgBodyMass",
      fill: "species"
    })
  ]
});
display(bodyMassPlot);

const wingSpanGroups = {};

for (let i = 0; i < data.length; i++) {
  const species = data[i].pollinator_species;
  const wingSpan = data[i].avg_wing_span_mm;
  
  if (!wingSpanGroups[species]) {
    wingSpanGroups[species] = {
      totalSpan: 0,
      count: 0
    };
  }
  
  wingSpanGroups[species].totalSpan = wingSpanGroups[species].totalSpan + wingSpan;
  wingSpanGroups[species].count = wingSpanGroups[species].count + 1;
}

const wingSpanData = [];

for (let i = 0; i < speciesNames.length; i++) {
  const species = speciesNames[i];
  const avgSpan = wingSpanGroups[species].totalSpan / wingSpanGroups[species].count;
  
  wingSpanData.push({
    species: species,
    avgWingSpan: avgSpan
  });
}

const wingSpanPlot = Plot.plot({
  title: "Average Wing Span by Pollinator Species",
  marginLeft: 80,
  y: {
    label: "Average Wing Span (millimeters)"
  },
  x: {
    label: "Pollinator Species"
  },
  marks: [
    Plot.barY(wingSpanData, {
      x: "species",
      y: "avgWingSpan",
      fill: "species"
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
  
  const tempGroups = {};
  
  for (let i = 0; i < data.length; i++) {
    const temp = data[i].temperature;
    const visits = data[i].visit_count;
    
    const tempGroup = Math.round(temp / 5) * 5;
    const rangeLabel = tempGroup + "°C";
    
    if (!tempGroups[rangeLabel]) {
      tempGroups[rangeLabel] = {
        totalVisits: 0,
        numberOfObservations: 0,
        tempValue: tempGroup
      };
    }
    
    tempGroups[rangeLabel].totalVisits = tempGroups[rangeLabel].totalVisits + visits;
    tempGroups[rangeLabel].numberOfObservations = tempGroups[rangeLabel].numberOfObservations + 1;
  }
  
  const tempData = [];
  const tempLabels = Object.keys(tempGroups);
  
  for (let i = 0; i < tempLabels.length; i++) {
    const label = tempLabels[i];
    const avgVisits = tempGroups[label].totalVisits / tempGroups[label].numberOfObservations;
    
    tempData.push({
      temperatureRange: label,
      avgVisits: avgVisits,
      sortValue: tempGroups[label].tempValue
    });
  }
  
  tempData.sort(function(a, b) {
    return a.sortValue - b.sortValue;
  });
  
  const tempPlot = Plot.plot({
    title: "Average Pollinator Visits by Temperature Range",
    y: {
      label: "Average Number of Visits"
    },
    x: {
      label: "Temperature Range"
    },
    marks: [
      Plot.barY(tempData, {
        x: "temperatureRange",
        y: "avgVisits",
        fill: "temperatureRange"
      })
    ]
  });
  display(tempPlot);
  
  let bestTemp = tempData[0];
  for (let i = 1; i < tempData.length; i++) {
    if (tempData[i].avgVisits > bestTemp.avgVisits) {
      bestTemp = tempData[i];
    }
  }
  
  display("Optimal temperature range: " + bestTemp.temperatureRange + " with " + bestTemp.avgVisits.toFixed(1) + " average visits");
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