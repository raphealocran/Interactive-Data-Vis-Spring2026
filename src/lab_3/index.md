---
title: "Lab 3: Mayoral Mystery"
toc: false
---

# Lab 3: Mayoral Mystery

The candidate lost citywide, but the results were not evenly distributed across the city. This dashboard looks at the campaign through income class: where the candidate overperformed, where support dropped off, and how campaign effort and issue alignment varied by district.

```js
const nyc = await FileAttachment("data/nyc.json").json();
const results = await FileAttachment("data/election_results.csv").csv({ typed: true });
const survey = await FileAttachment("data/survey_responses.csv").csv({ typed: true });
const events = await FileAttachment("data/campaign_events.csv").csv({ typed: true });
```

```js
const districts = topojson.feature(nyc, nyc.objects.districts);

const currency = d3.format("$,");
const comma = d3.format(",");
const pct = d => `${d.toFixed(1)}%`;

const incomeOrder = ["Low", "Middle", "High"];
const incomeColors = new Map([
  ["Low", "#4e79a7"],
  ["Middle", "#f28e2b"],
  ["High", "#59a14f"]
]);

const resultsByDistrict = d3.rollup(
  results,
  v => ({
    candidate_votes: d3.sum(v, d => d.votes_candidate || 0),
    opponent_votes: d3.sum(v, d => d.votes_opponent || 0),
    registered_voters: d3.sum(v, d => d.total_registered_voters || 0),
    turnout_rate: d3.mean(v, d => d.turnout_rate || 0),
    gotv_doors_knocked: d3.sum(v, d => d.gotv_doors_knocked || 0),
    candidate_hours_spent: d3.sum(v, d => d.candidate_hours_spent || 0),
    median_household_income: d3.mean(v, d => d.median_household_income || 0),
    income_category: v[0]?.income_category
  }),
  d => d.boro_cd
);

const districtData = Array.from(resultsByDistrict, ([district, values]) => {
  const total_votes = values.candidate_votes + values.opponent_votes;
  const winner = values.candidate_votes > values.opponent_votes ? "Candidate" : "Opponent";
  const winner_votes = Math.max(values.candidate_votes, values.opponent_votes);

  return {
    district,
    winner,
    winner_share: total_votes ? (winner_votes / total_votes) * 100 : 0,
    candidate_share: total_votes ? (values.candidate_votes / total_votes) * 100 : 0,
    candidate_votes: values.candidate_votes,
    opponent_votes: values.opponent_votes,
    total_votes,
    registered_voters: values.registered_voters,
    turnout_rate: values.turnout_rate,
    gotv_doors_knocked: values.gotv_doors_knocked,
    candidate_hours_spent: values.candidate_hours_spent,
    median_household_income: values.median_household_income,
    income_category: values.income_category
  };
});

const districtMap = new Map(districtData.map(d => [d.district, d]));

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
        winner: match?.winner ?? "Unknown",
        winner_share: match?.winner_share ?? 0,
        candidate_share: match?.candidate_share ?? 0,
        total_votes: match?.total_votes ?? 0,
        candidate_votes: match?.candidate_votes ?? 0,
        opponent_votes: match?.opponent_votes ?? 0,
        turnout_rate: match?.turnout_rate ?? 0,
        income_category: match?.income_category ?? "Unknown",
        median_household_income: match?.median_household_income ?? 0
      }
    };
  })
};

const citywideCandidateVotes = d3.sum(results, d => d.votes_candidate || 0);
const citywideOpponentVotes = d3.sum(results, d => d.votes_opponent || 0);
const citywideTotalVotes = citywideCandidateVotes + citywideOpponentVotes;
const citywideCandidateShare = (citywideCandidateVotes / citywideTotalVotes) * 100;
const districtsWon = districtData.filter(d => d.winner === "Candidate").length;

const incomeSummary = d3.rollups(
  districtData,
  v => {
    const candidate_votes = d3.sum(v, d => d.candidate_votes);
    const opponent_votes = d3.sum(v, d => d.opponent_votes);
    const total_votes = candidate_votes + opponent_votes;

    return {
      income_category: v[0].income_category,
      districts: v.length,
      candidate_share: (candidate_votes / total_votes) * 100,
      turnout_rate: d3.mean(v, d => d.turnout_rate),
      doors: d3.sum(v, d => d.gotv_doors_knocked),
      doors_per_district: d3.mean(v, d => d.gotv_doors_knocked),
      candidate_hours: d3.sum(v, d => d.candidate_hours_spent),
      median_income: d3.mean(v, d => d.median_household_income),
      districts_won: v.filter(d => d.winner === "Candidate").length
    };
  },
  d => d.income_category
)
  .map(([, values]) => values)
  .sort((a, b) => incomeOrder.indexOf(a.income_category) - incomeOrder.indexOf(b.income_category));

const strongestIncome = incomeSummary.reduce((a, b) => a.candidate_share > b.candidate_share ? a : b);
const weakestIncome = incomeSummary.reduce((a, b) => a.candidate_share < b.candidate_share ? a : b);

const surveyWithIncome = survey
  .map(d => ({
    ...d,
    income_category: districtMap.get(d.boro_cd)?.income_category
  }))
  .filter(d => d.income_category);

const issueData = surveyWithIncome.flatMap(d => [
  { income_category: d.income_category, issue: "Housing", rating: d.affordable_housing_alignment },
  { income_category: d.income_category, issue: "Transit", rating: d.public_transit_alignment },
  { income_category: d.income_category, issue: "Childcare", rating: d.childcare_support_alignment },
  { income_category: d.income_category, issue: "Small business", rating: d.small_business_tax_alignment },
  { income_category: d.income_category, issue: "Police reform", rating: d.police_reform_alignment }
]).filter(d => d.rating > 0);

const issueByIncome = d3.rollups(
  issueData,
  v => d3.mean(v, d => d.rating),
  d => d.income_category,
  d => d.issue
).flatMap(([income_category, issues]) =>
  issues.map(([issue, rating]) => ({ income_category, issue, rating }))
);

const issueSummary = d3.rollups(
  issueData,
  v => d3.mean(v, d => d.rating),
  d => d.issue
).map(([issue, rating]) => ({ issue, rating }));

const topIssue = issueSummary.reduce((a, b) => a.rating > b.rating ? a : b);
const lowestIssue = issueSummary.reduce((a, b) => a.rating < b.rating ? a : b);

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
  income_category: d.income_category,
  events: eventsByDistrict.get(d.district)?.events || 0,
  attendance: eventsByDistrict.get(d.district)?.attendance || 0,
  doors: d.gotv_doors_knocked,
  turnout: d.turnout_rate,
  winner: d.winner,
  candidate_share: d.candidate_share
}));
```

## Summary Dashboard

<div class="grid grid-cols-4">
  <div class="card">
    <h2>${pct(citywideCandidateShare)}</h2>
    <p>citywide candidate vote share</p>
  </div>
  <div class="card">
    <h2>${districtsWon} of ${districtData.length}</h2>
    <p>districts won by the candidate</p>
  </div>
  <div class="card">
    <h2>${strongestIncome.income_category}</h2>
    <p>strongest income class at ${pct(strongestIncome.candidate_share)}</p>
  </div>
  <div class="card">
    <h2>${topIssue.issue}</h2>
    <p>highest average survey alignment (${topIssue.rating.toFixed(1)} of 5)</p>
  </div>
</div>

The headline result is close but still a loss: the candidate received ${comma(citywideCandidateVotes)} votes compared with ${comma(citywideOpponentVotes)} for the opponent. The more useful campaign lesson is that support was segmented by income class, with ${strongestIncome.income_category.toLowerCase()}-income districts producing the best vote share and ${weakestIncome.income_category.toLowerCase()}-income districts producing the weakest.

## 1. District Results

The map shows where the candidate's vote share was strongest by district. The darker districts are closer to or above a winning coalition; the lighter districts need either persuasion, turnout, or both.

```js
display(Plot.plot({
  title: "Candidate Vote Share by District",
  projection: {
    domain: districts,
    type: "mercator"
  },
  color: {
    type: "linear",
    scheme: "blues",
    domain: [25, 70],
    label: "Candidate vote share (%)",
    legend: true
  },
  marks: [
    Plot.geo(geoWithData, {
      fill: d => d.properties.candidate_share,
      stroke: d => d.properties.winner === "Candidate" ? "#1b7837" : "white",
      strokeWidth: d => d.properties.winner === "Candidate" ? 1.4 : 0.7,
      tip: true,
      title: d =>
        `District ${d.properties.district}
Income class: ${d.properties.income_category}
Median income: ${currency(d.properties.median_household_income)}
Winner: ${d.properties.winner}
Candidate share: ${pct(d.properties.candidate_share)}
Turnout: ${pct(d.properties.turnout_rate)}`
    })
  ]
}));
```

## 2. Income Class Analysis

Income is the clearest dividing line in the results. The candidate won a majority of votes in ${strongestIncome.income_category.toLowerCase()}-income districts, but fell far below that level in ${weakestIncome.income_category.toLowerCase()}-income districts. This suggests the next campaign should protect its strongest income-class base while building a specific persuasion strategy for higher-income areas.

```js
display(Plot.plot({
  title: "Candidate Vote Share by Income Class",
  height: 340,
  marginLeft: 55,
  x: { label: "Income class", domain: incomeOrder },
  y: { label: "Candidate vote share (%)", grid: true, domain: [0, 70] },
  color: {
    domain: incomeOrder,
    range: incomeOrder.map(d => incomeColors.get(d)),
    legend: true
  },
  marks: [
    Plot.ruleY([50], { stroke: "#777", strokeDasharray: "4,3" }),
    Plot.barY(incomeSummary, {
      x: "income_category",
      y: "candidate_share",
      fill: "income_category",
      tip: true
    }),
    Plot.text(incomeSummary, {
      x: "income_category",
      y: "candidate_share",
      text: d => pct(d.candidate_share),
      dy: -10,
      fontWeight: "bold"
    })
  ]
}));
```

The campaign's low-income advantage did not translate into a citywide win because the opponent's margins in high-income districts were very large. Middle-income districts were nearly competitive, making them a practical target for the next run.

## 3. Issue Alignment by Income

Survey alignment helps explain what kind of message could move each segment. Housing, transit, and childcare perform relatively well, while police reform is the lowest-rated issue overall at ${lowestIssue.rating.toFixed(1)} out of 5.

```js
display(Plot.plot({
  title: "Average Issue Alignment by Income Class",
  height: 420,
  marginLeft: 110,
  marginBottom: 60,
  x: { label: "Average rating (1-5)", grid: true, domain: [0, 5] },
  y: { label: null },
  color: {
    domain: incomeOrder,
    range: incomeOrder.map(d => incomeColors.get(d)),
    legend: true
  },
  marks: [
    Plot.ruleX([0]),
    Plot.barX(issueByIncome, {
      y: "issue",
      x: "rating",
      fill: "income_category",
      fx: "income_category",
      sort: { y: "x", reverse: true },
      tip: true
    }),
    Plot.text(issueByIncome, {
      y: "issue",
      x: "rating",
      fx: "income_category",
      text: d => d.rating.toFixed(1),
      dx: 12,
      fontSize: 11
    })
  ]
}));
```

The policy message should not be one-size-fits-all. The candidate can keep emphasizing the high-alignment kitchen-table issues, but the lower police reform alignment is a warning sign: that position may need clearer framing, better local examples, or more direct response to voter concerns.

## 4. Campaign Effort and Performance

The final view compares GOTV doors knocked with candidate vote share. Door-knocking was concentrated in lower-income districts, where the candidate already performed best, while many higher-income districts received much lighter GOTV contact.

```js
display(Plot.plot({
  title: "GOTV Doors Knocked vs. Candidate Vote Share",
  height: 420,
  marginLeft: 60,
  x: { label: "Doors knocked", grid: true, tickFormat: "," },
  y: { label: "Candidate vote share (%)", grid: true },
  color: {
    domain: incomeOrder,
    range: incomeOrder.map(d => incomeColors.get(d)),
    legend: true
  },
  marks: [
    Plot.ruleY([50], { stroke: "#777", strokeDasharray: "4,3" }),
    Plot.dot(gotvData, {
      x: "doors",
      y: "candidate_share",
      fill: "income_category",
      stroke: "white",
      r: d => Math.max(4, Math.sqrt(d.attendance || 1) / 2.5),
      opacity: 0.8,
      tip: true,
      title: d =>
        `District ${d.district}
Income class: ${d.income_category}
Winner: ${d.winner}
Candidate share: ${pct(d.candidate_share)}
Turnout: ${pct(d.turnout)}
Doors knocked: ${comma(d.doors)}
Event attendance: ${comma(d.attendance)}`
    }),
    Plot.linearRegressionY(gotvData, {
      x: "doors",
      y: "candidate_share",
      stroke: "gray",
      strokeDasharray: "4,2"
    })
  ]
}));
```

## Recommendation

For the next run, the campaign should treat income class as a core planning variable. Low-income districts are the base and should stay well organized, middle-income districts are the most promising growth zone, and high-income districts need a different message before field work alone will be enough. The strongest recommendation is to pair turnout operations with income-specific persuasion: keep housing, transit, and childcare central, but test clearer language around police reform before scaling that message citywide.
