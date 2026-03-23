---
title: "Lab 1: Passing Pollinators"
toc: true
---

This page is where you can iterate. Follow the lab instructions in the [readme.md](./README).

## MARKDWON 

```js
const data = await FileAttachment("data/pollinator_activity_data.csv").csv({ typed: true });

display("ALL DATA:");
display(data);

display("Body Mass and Wing Span by Species");

const species = [];
for (let i = 0; i < data.length; i++) {
    if (!species.includes(data[i].pollinator_species)) {
        species.push(data[i].pollinator_species);
    }
}
display("Species found:", species);

display("Body mass values by species:");
for (let s = 0; s < species.length; s++) {
    const speciesName = species[s];
    const bodyMasses = [];
    
    for (let i = 0; i < data.length; i++) {
        if (data[i].pollinator_species === speciesName) {
            bodyMasses.push(data[i].avg_body_mass_g);
        }
    }
    
    display(speciesName + " body masses: " + bodyMasses.join(", "));
}

display("Wing span values by species:");
for (let s = 0; s < species.length; s++) {
    const speciesName = species[s];
    const wingSpans = [];
    
    for (let i = 0; i < data.length; i++) {
        if (data[i].pollinator_species === speciesName) {
            wingSpans.push(data[i].avg_wing_span_mm);
        }
    }
    
    display(speciesName + " wing spans: " + wingSpans.join(", "));
}

display("Weather Conditions");

const weatherTypes = [];
for (let i = 0; i < data.length; i++) {
    if (!weatherTypes.includes(data[i].weather_condition)) {
        weatherTypes.push(data[i].weather_condition);
    }
}
display("Weather types found:", weatherTypes);

for (let w = 0; w < weatherTypes.length; w++) {
    const weather = weatherTypes[w];
    let totalVisits = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i++) {
        if (data[i].weather_condition === weather) {
            totalVisits = totalVisits + data[i].visit_count;
            count = count + 1;
        }
    }
    
    const avgVisits = totalVisits / count;
    display(weather + " - Average visits: " + avgVisits.toFixed(2));
}

display("Flower with Most Nectar");

const flowers = [];
for (let i = 0; i < data.length; i++) {
    if (!flowers.includes(data[i].flower_species)) {
        flowers.push(data[i].flower_species);
    }
}
display("Flowers found:", flowers);

let bestFlower = "";
let bestNectar = 0;

for (let f = 0; f < flowers.length; f++) {
    const flower = flowers[f];
    let totalNectar = 0;
    let count = 0;
    
    for (let i = 0; i < data.length; i++) {
        if (data[i].flower_species === flower) {
            totalNectar = totalNectar + data[i].nectar_production;
            count = count + 1;
        }
    }
    
    const avgNectar = totalNectar / count;
    display(flower + " - Average nectar: " + avgNectar.toFixed(2));
    
    if (avgNectar > bestNectar) {
        bestNectar = avgNectar;
        bestFlower = flower;
    }
}

display("WINNER: " + bestFlower + " has the most nectar with " + bestNectar.toFixed(2));