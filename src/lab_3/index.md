---
title: "Lab 3: Mayoral Mystery"
toc: false
---

This page is where you can iterate. Follow the lab instructions in the [readme.md](./README.md).

<!-- Import Data -->
```js
const nyc = await FileAttachment("data/nyc.json").json();
const results = await FileAttachment("data/election_results.csv").csv({ typed: true });
const survey = await FileAttachment("data/survey_responses.csv").csv({ typed: true });
const events = await FileAttachment("data/campaign_events.csv").csv({ typed: true });

// Note: you don't have to keep this, but some helpful data exposure to see what we've loaded. 
// NYC geoJSON data
display(nyc)
// Campaign data (first 10 objects)
display(results.slice(0,10))
display(survey.slice(0,10))
display(events.slice(0,10))
```


```js
// The nyc file is saved in data as a topoJSON instead of a geoJSON. Thats primarily for size reasons -- it saves us 3MB of data. For Plot to render it, we have to convert it back to its geoJSON feature collection. 
const districts = topojson.feature(nyc, nyc.objects.districts)
display(districts)
```

```js
// Simple rendering of the NYC districts topoJSON
Plot.plot({
  // this projection is already zoomed into NYC
  projection: {
    domain: districts,
    type: "mercator",
  },
  marks: [
    Plot.geo(districts),
  ]
})

// Process election results correctly - each row has Adams, Wiley, Garcia, Yang columns
const resultsByDistrict = d3.rollup(
  results,
  v => ({
    adams_total: d3.sum(v, d => +d.Adams || 0),
    wiley_total: d3.sum(v, d => +d.Wiley || 0),
    garcia_total: d3.sum(v, d => +d.Garcia || 0),
    yang_total: d3.sum(v, d => +d.Yang || 0),
    total_votes: d3.sum(v, d => (+d.Adams || 0) + (+d.Wiley || 0) + (+d.Garcia || 0) + (+d.Yang || 0))
  }),
  d => String(d.district)
);

// Convert to usable array and calculate winner per district
const districtData = Array.from(resultsByDistrict, ([district, values]) => {
  const votes = {
    Adams: values.adams_total,
    Wiley: values.wiley_total,
    Garcia: values.garcia_total,
    Yang: values.yang_total
  };
  const winner = Object.keys(votes).reduce((a, b) => votes[a] > votes[b] ? a : b);
  const winner_votes = votes[winner];
  
  return {
    district,
    winner,
    winner_share: (winner_votes / values.total_votes) * 100,
    total_votes: values.total_votes,
    adams_share: (values.adams_total / values.total_votes) * 100,
    wiley_share: (values.wiley_total / values.total_votes) * 100,
    garcia_share: (values.garcia_total / values.total_votes) * 100,
    yang_share: (values.yang_total / values.total_votes) * 100
  };
});

// Merge with geoJSON for choropleth map
const geoWithData = {
  ...districts,
  features: districts.features.map(f => {
    const match = districtData.find(d => d.district == f.properties.district);
    return {
      ...f,
      properties: {
        ...f.properties,
        winner: match ? match.winner : "Unknown",
        winner_share: match ? match.winner_share : 0,
        total_votes: match ? match.total_votes : 0
      }
    };
  })
};

// Visualization 1: Choropleth map showing winners by district
Plot.plot({
  title: "District Winners by Candidate",
  projection: {
    domain: districts,
    type: "mercator",
  },
  color: {
    scheme: "category10",
    domain: ["Adams", "Wiley", "Garcia", "Yang"],
    label: "Winner"
  },
  marks: [
    Plot.geo(geoWithData, {
      fill: d => d.properties.winner,
      stroke: "white",
      tip: true,
      title: d => `District ${d.properties.district}\nWinner: ${d.properties.winner}\nShare: ${d.properties.winner_share.toFixed(1)}%`
    }),
    Plot.text(geoWithData.features, {
      geometry: d => d,
      text: d => d.properties.district,
      fill: "white",
      fontSize: 8,
      filter: d => d.properties.winner !== "Unknown"
    })
  ]
})

// Calculate citywide totals for bar chart
const citywideTotals = [
  { candidate: "Adams", votes: d3.sum(results, d => +d.Adams || 0) },
  { candidate: "Wiley", votes: d3.sum(results, d => +d.Wiley || 0) },
  { candidate: "Garcia", votes: d3.sum(results, d => +d.Garcia || 0) },
  { candidate: "Yang", votes: d3.sum(results, d => +d.Yang || 0) }
];

// Visualization 2: Bar chart of total votes by candidate
Plot.plot({
  title: "Total Votes by Candidate (Citywide)",
  width: 600,
  height: 400,
  x: {
    label: "Candidate"
  },
  y: {
    label: "Votes",
    grid: true
  },
  marks: [
    Plot.barY(citywideTotals, {
      x: "candidate",
      y: "votes",
      fill: "candidate",
      tip: true,
      title: d => `${d.candidate}: ${d.votes.toLocaleString()} votes`
    })
  ]
})

// Process survey data for issue importance (no income column, using issue ratings instead)
const surveyByDistrict = d3.rollup(
  survey,
  v => ({
    safety: d3.mean(v, d => d.public_safety === "Not sure" ? null : +d.public_safety),
    housing: d3.mean(v, d => d.housing_affordability === "Not sure" ? null : +d.housing_affordability),
    education: d3.mean(v, d => d.education === "Not sure" ? null : +d.education),
    gotv_contact_rate: d3.mean(v, d => d.gotv_contact === "Yes" ? 1 : 0) * 100
  }),
  d => String(d.district)
);

// Merge survey data with election results
const combined = districtData.map(d => ({
  district: d.district,
  winner: d.winner,
  winner_share: d.winner_share,
  safety_importance: surveyByDistrict.get(d.district)?.safety || 0,
  housing_importance: surveyByDistrict.get(d.district)?.housing || 0,
  education_importance: surveyByDistrict.get(d.district)?.education || 0,
  gotv_contact_rate: surveyByDistrict.get(d.district)?.gotv_contact_rate || 0
}));

// Visualization 3: Issue importance by district winner
const issueData = combined.flatMap(d => [
  { winner: d.winner, issue: "Public Safety", rating: d.safety_importance },
  { winner: d.winner, issue: "Housing", rating: d.housing_importance },
  { winner: d.winner, issue: "Education", rating: d.education_importance }
]).filter(d => d.rating > 0);

Plot.plot({
  title: "Issue Importance by District Winner (1-5 scale)",
  width: 650,
  height: 400,
  y: { 
    label: "Average Importance Rating", 
    grid: true, 
    domain: [3, 5] 
  },
  x: { 
    label: "Issue" 
  },
  color: { 
    legend: true, 
    label: "Winner" 
  },
  marks: [
    Plot.barY(issueData, {
      x: "issue",
      y: "rating",
      fill: "winner",
      position: "dodge",
      tip: true,
      title: d => `${d.winner} Districts\n${d.issue}: ${d.rating.toFixed(1)}/5`
    })
  ]
})

// Process campaign events by district (events data has district, date, type, attendance)
const eventsByDistrict = d3.rollup(
  events,
  v => v.length,
  d => String(d.district)
);

// Create GOTV analysis data
const gotvData = districtData.map(d => ({
  district: d.district,
  events: eventsByDistrict.get(d.district) || 0,
  turnout: d.total_votes,
  winner: d.winner,
  winner_share: d.winner_share,
  gotv_contact_rate: surveyByDistrict.get(d.district)?.gotv_contact_rate || 0
}));

// Visualization 4: GOTV events vs voter turnout
Plot.plot({
  title: "Campaign Events vs Voter Turnout by District",
  width: 650,
  height: 450,
  x: { 
    label: "Number of Campaign Events", 
    grid: true,
    ticks: [0, 1, 2, 3, 4, 5]
  },
  y: { 
    label: "Total Voter Turnout", 
    grid: true 
  },
  color: { 
    scheme: "category10", 
    legend: true, 
    label: "Winner" 
  },
  marks: [
    Plot.dot(gotvData, {
      x: "events",
      y: "turnout",
      fill: "winner",
      r: 8,
      opacity: 0.7,
      tip: true,
      title: d => `District ${d.district}\nEvents: ${d.events}\nTurnout: ${d.turnout.toLocaleString()}\nGOTV Contact: ${d.gotv_contact_rate.toFixed(1)}%\nWinner: ${d.winner} (${d.winner_share.toFixed(1)}%)`
    }),
    Plot.linearRegressionY(gotvData, { 
      x: "events", 
      y: "turnout", 
      stroke: "gray", 
      strokeDash: "2,2" 
    })
  ]
})
```