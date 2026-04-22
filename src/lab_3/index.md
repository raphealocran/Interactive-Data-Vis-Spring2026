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
```


```js
const districts = topojson.feature(nyc, nyc.objects.districts)
```

```js
// Aggregate election results
const resultsByDistrict = d3.rollup(
  results,
  v => ({
    candidate_votes: d3.sum(v, d => d.votes_candidate || 0),
    opponent_votes: d3.sum(v, d => d.votes_opponent || 0),
    registered_voters: d3.sum(v, d => d.total_registered_voters || 0),
    turnout_rate: d3.mean(v, d => d.turnout_rate || 0),
    gotv_doors_knocked: d3.sum(v, d => d.gotv_doors_knocked || 0),
    candidate_hours_spent: d3.sum(v, d => d.candidate_hours_spent || 0),
    median_household_income: d3.mean(v, d => d.median_household_income || 0)
  }),
  d => d.boro_cd
);

// Convert to array + determine winner
const districtData = Array.from(resultsByDistrict, ([district, values]) => {
  const votes = {
    Candidate: values.candidate_votes,
    Opponent: values.opponent_votes
  };

  const winner = Object.keys(votes).reduce((a, b) =>
    votes[a] > votes[b] ? a : b
  );

  const winner_votes = votes[winner];

  return {
    district,
    winner,
    winner_share: values.total_votes ? (winner_votes / values.total_votes) * 100 : 0,
    candidate_share: values.total_votes ? (values.candidate_votes / values.total_votes) * 100 : 0,
    candidate_votes: values.candidate_votes,
    opponent_votes: values.opponent_votes,
    total_votes: values.candidate_votes + values.opponent_votes,
    registered_voters: values.registered_voters,
    turnout_rate: values.turnout_rate,
    gotv_doors_knocked: values.gotv_doors_knocked,
    candidate_hours_spent: values.candidate_hours_spent,
    median_household_income: values.median_household_income
  };
});

// Create fast lookup map (better than .find)
const districtMap = new Map(
  districtData.map(d => [d.district, d])
);

// Merge with geoJSON
const geoWithData = {
  ...districts,
  features: districts.features.map(f => {
    const key = f.properties.BoroCD;
    const match = districtMap.get(key);

    return {
      ...f,
      properties: {
        ...f.properties,
        district: key,
        winner: match ? match.winner : "Unknown",
        winner_share: match ? match.winner_share : 0,
        candidate_share: match ? match.candidate_share : 0,
        total_votes: match ? match.total_votes : 0,
        candidate_votes: match ? match.candidate_votes : 0,
        opponent_votes: match ? match.opponent_votes : 0,
        turnout_rate: match ? match.turnout_rate : 0
      }
    };
  })
};

display(Plot.plot({
  title: "District Winners by Candidate",
  projection: {
    domain: districts,
    type: "mercator",
  },
  color: {
    scheme: "set2",
    domain: ["Candidate", "Opponent"],
    label: "Winner",
    legend: true
  },
  marks: [
    Plot.geo(geoWithData, {
      fill: d => d.properties.winner,
      stroke: "white",
      tip: true,
      title: d =>
        `District ${d.properties.district}
Winner: ${d.properties.winner}
Candidate share: ${d.properties.candidate_share.toFixed(1)}%
Turnout: ${d.properties.turnout_rate.toFixed(1)}%`
    })
  ]
}))

const citywideTotals = [
  { candidate: "Candidate", votes: d3.sum(results, d => d.votes_candidate || 0) },
  { candidate: "Opponent", votes: d3.sum(results, d => d.votes_opponent || 0) }
];

display(Plot.plot({
  title: "Citywide Vote Total",
  x: { label: "Candidate" },
  color: {
    domain: ["Candidate", "Opponent"],
    range: ["#4e79a7", "#e15759"]
  },
  y: { label: "Votes", grid: true, tickFormat: "," },
  marks: [
    Plot.ruleY([0]),
    Plot.barY(citywideTotals, {
      x: "candidate",
      y: "votes",
      fill: "candidate",
      tip: true
    }),
    Plot.text(citywideTotals, {
      x: "candidate",
      y: "votes",
      text: d => d3.format(",")(d.votes),
      dy: -10,
      fontWeight: "bold"
    })
  ]
}))

const surveyByDistrict = d3.rollup(
  survey,
  v => ({
    housing: d3.mean(v, d => d.affordable_housing_alignment),
    transit: d3.mean(v, d => d.public_transit_alignment),
    childcare: d3.mean(v, d => d.childcare_support_alignment),
    small_business: d3.mean(v, d => d.small_business_tax_alignment),
    police_reform: d3.mean(v, d => d.police_reform_alignment)
  }),
  d => d.boro_cd
);

const combined = districtData.map(d => ({
  district: d.district,
  winner: d.winner,
  housing: surveyByDistrict.get(d.district)?.housing || 0,
  transit: surveyByDistrict.get(d.district)?.transit || 0,
  childcare: surveyByDistrict.get(d.district)?.childcare || 0,
  small_business: surveyByDistrict.get(d.district)?.small_business || 0,
  police_reform: surveyByDistrict.get(d.district)?.police_reform || 0
}));

const issueData = combined.flatMap(d => [
  { winner: d.winner, issue: "Housing", rating: d.housing },
  { winner: d.winner, issue: "Transit", rating: d.transit },
  { winner: d.winner, issue: "Childcare", rating: d.childcare },
  { winner: d.winner, issue: "Small Business", rating: d.small_business },
  { winner: d.winner, issue: "Police Reform", rating: d.police_reform }
]).filter(d => d.rating > 0);

const issueSummary = d3.rollups(
  issueData,
  v => d3.mean(v, d => d.rating),
  d => d.issue
).map(([issue, rating]) => ({ issue, rating }));

display(Plot.plot({
  title: "Average Survey Alignment by Issue",
  y: { label: "Average rating (1-5)", grid: true, domain: [0, 5] },
  x: { label: "Issue" },
  marks: [
    Plot.ruleY([0]),
    Plot.barY(issueSummary, {
      x: "issue",
      y: "rating",
      fill: "#76b7b2",
      tip: true
    }),
    Plot.text(issueSummary, {
      x: "issue",
      y: "rating",
      text: d => d.rating.toFixed(1),
      dy: -10,
      fontWeight: "bold"
    })
  ]
}))

const eventsByDistrict = d3.rollup(
  events,
  v => ({
    events: v.length,
    attendance: d3.sum(v, d => d.estimated_attendance || 0)
  }),
  d => d.boro_cd
);

const gotvData = districtData.map(d => ({
  district: d.district,
  events: eventsByDistrict.get(d.district)?.events || 0,
  attendance: eventsByDistrict.get(d.district)?.attendance || 0,
  turnout: d.turnout_rate,
  winner: d.winner,
  candidate_share: d.candidate_share
}));

display(Plot.plot({
  title: "Campaign Events and Turnout",
  x: { label: "Events", grid: true },
  y: { label: "Turnout rate (%)", grid: true },
  color: {
    domain: ["Candidate", "Opponent"],
    range: ["#4e79a7", "#e15759"],
    legend: true
  },
  marks: [
    Plot.dot(gotvData, {
      x: "events",
      y: "turnout",
      fill: "winner",
      r: 5,
      opacity: 0.7,
      tip: true
    }),
    Plot.linearRegressionY(gotvData, {
      x: "events",
      y: "turnout",
      stroke: "gray",
      strokeDash: "4,2"
    })
  ]
}))
```
