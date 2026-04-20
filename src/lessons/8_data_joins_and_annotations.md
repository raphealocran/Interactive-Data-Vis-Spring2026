---
title: Data Joins and Annotations
toc: true
---

# Data Joins and Annotations

---

So far, many plots draw from one table at a time. In real projects, the story often depends on two (or more) sources. It could be stock prices and earnings calls, ridership and nearby events, incidents and staffing, ratings and budgets. This lesson will cover two things that can support your Lab 2 work: **annotations** (layering marks so you can point at moments or categories) and **data joins** (lining tables up by a shared key so values from one table can drive channels for another). It builds on filtering (arrays of objects, `.filter`, comparisons), data manipulation ([transforms and data manipulation](./6_transforms_and_data_manipulation.md)), and on marks and scales ([data types and scales](./7_data_types_scales_marks.md)). 

---

## State management

Let's return to our AAPL stock data. We started with a line of `close` price over time. We have another file with stock prices of many companies, and events that may have affected the stock price.

```js
const stocks = await FileAttachment("../class_code/stock_data/stocks.csv").csv({ typed: true })
const events = await FileAttachment("../class_code/stock_data/stock_events.csv").csv({ typed: true })
display(stocks[0])
display(events[0])
```

If we wanted to plot this, we could show every ticker at once (separated by `z` / `stroke`), or add a dropdown so the reader picks one ticker. Dropdowns ([select](https://observablehq.com/framework/inputs/select)) require an array of options. We could just write out all the options available, or make it dynamically if the list is significant. In order to make an array of unique values, we can do the following: 
1. iterate over the entire array to get all the ticker names (returns `["AAPL", "AAPL", "GOOG", "GOOG", "META", ...]`)
2. turn it into a set, which eliminates duplicates (but returns a set, not an array, as `Set(5) { }`)
3. turn that set back into an array, leveraging `Array.from( ... )`

This combination might feel advanced, but as long as you follow this formula, you can always get a unique set of values for your input selections:

```js run=false
const uniqueValues = Array.from(new Set([ARRAY GOES HERE].map(d => d[DATA KEY GOES HERE])))
```

Here's what that looks like for these stocks:
```js echo
// const allTickers = ["AAPL", "GOOG", "NFLX", "AMZN", "META"] // option 1: hardcode the values
const allTickers = Array.from(new Set(stocks.map(d => d.Ticker))) // option 2: derive from data
const selectedStock = view(Inputs.select(allTickers))
```

```js echo
Plot.plot({
  title: `Viewing: ${selectedStock}`,
  height: 200,
  marks: [
    Plot.line(stocks, {
      x: "Date",
      y: "Close",
      z: "Ticker",
      stroke: d => d["Ticker"] === selectedStock ? "black" : "none",
      tip: true
    })
  ]
})
```

The selected ticker is state: the rest of the page can react to it. State gets more interesting as dashboards add inputs, but the pattern is the same—one value (here `selectedStock`) that filters or drives what you draw.

---

## Annotation

Depending on what you are trying to point out, useful marks include lines, dots, rules, or even images. The pattern is always: add another mark that shares the plot’s scales with the main series so the reader can compare “what happened in the data” with “what we are calling out.” Lab 2 asks for at least one annotation—`Plot.ruleX`, `Plot.dot`, [Plot.tip](https://observablehq.com/plot/marks/tip), a mean/median line, etc.

### Rules at event dates (`Plot.ruleX`)

An easy first example of annotations could be vertical rules at each event date that sit on top of the price lines. The line mark uses `stocks`; the rules use `events`. Both bind `Date` to `x`, so Plot uses one time scale. In this instance, **no merge of tables required**. That's because each mark is reacting to its own data, but they share the same x axis with `Date`.

```js echo
Plot.plot({
  height: 200,
  width,
  marks: [
    Plot.line(stocks, {
      x: "Date",
      y: "Close",
      z: "Ticker",
      stroke: "Ticker"
    }),
    Plot.ruleX(events, {
      x: "Date",
      tip: true,
      channels: {
        Event: "Event Name",
        Notes: "Notes"
      }
    }),
    Plot.ruleY([0])
  ]
})
```

### Dots on event days (`Plot.dot`)

Maybe instead of a vertical rule, you'd like to mark which days had an event using `Plot.dot` on the events table. In the vertical rule example, all we need to do is pass the x value. The vertical rule knows to extend the entire chart height. 

Dots, however, require both an `x` and a `y` position. Let's make it easy to start: `x` is the event date, and we will set `y` to a constant so every dot sits on a horizontal band. Using the minimum close in `stocks` keeps the dots near the bottom of the price range without pulling values from the events CSV.

```js echo
Plot.plot({
  height: 200,
  width,
  marks: [
    Plot.line(stocks, {
      x: "Date",
      y: "Close",
      z: "Ticker",
      stroke: "Ticker"
    }),
    Plot.dot(events, {
      x: "Date",                        // ← channel (data)
      y: d3.min(stocks, d => d.Close),  // ← constant
      r: 3,                             // ← constant
      stroke: "currentColor",
      fill: "white",
      tip: true,
      channels: {
        Event: "Event Name",
        Notes: "Notes"
      }
    })
  ]
})
```

This is helpful, but wouldn't it be nice if these dots corresponded to the price at the time of the event? If so, we'd need to position the circle on the line. How could we do that? 

```html
<style>
  .code {
    font-family: monospace;
    color: #A935D4;
    font-size: 0.8rem;
    font-weight: 800;
  }
</style>
```

<details>
  <summary>Answer in here ↓</summary>
  The circle's <span class="code">y</span> attribute should be positioned <b>on the close price on that date</b>, which lives in <span class="code">stocks</span>, not in <span class="code">events</span>. To get a value from the <span class="code">stocks</span> data on a particular date, we need a lookup (or join). 
</details>
<br><br>


### Tip callout (`Plot.tip`)

The [tip mark](https://observablehq.com/plot/marks/tip) draws a label or callout at a point. You typically pass one row (or a tiny array of rows) and map `x` / `y` like any other mark. Without a join, `y` might be a rough guess or a constant; with a join, `y` comes from the other table, which we discuss in the next section.

```js echo
Plot.plot({
  height: 200,
  width,
  marks: [
    Plot.line(stocks, {
      x: "Date",
      y: "Close",
      z: "Ticker",
      stroke: "Ticker"
    }),
    ...(events.length
      ? [
          Plot.tip([events[0]], {
            x: "Date",
            y: d3.quantile(stocks.map(d => d.Close), 0.5),
            channels: {
              Event: "Event Name",
              Notes: "Notes"
            }
          })
        ]
      : [])
  ]
})
```

---

## Data joins

Labs and real world projects often include multiple datasets. You may filter to the current “state” (selected ticker), combine or derive new arrays, or read a value from one dataset while iterating another. So far, we've only tackled one dataset per plot. Let's explore a few reasons and applications for joining datasets. 

### Two datasets, shared axis

We've already done this above, but it's worth calling out that it is technically joining two datasets on a certain value. When we added rules at event dates, they share an axis of time. Each mark can pass in its own `Date` values, without having to join tables either in the plot or before the plot. See the [rules at event dates plot for more](#rules-at-event-dates-plotrulex). 

### Two datasets, retrieve position

We alluded to this circumstance when we wanted to plot the event dots `y` position on the price line. In this instance, `events` doesn't know what the price was on a certain day, so it doesn't know how far up on the chart to place the dot. We can use a lookup to figure this out. Before we get to that, let's take a brief aside to discuss lookups in JavaScript.

#### JavaScript lookup

In SQL, a join combines rows from two tables by a condition. In Python, you might `merge` in pandas with `left_on` / `right_on`. In JavaScript, without extra libraries, you usually build new arrays with `.map`, `.filter`, and `.find` / `.reduce`. 

Simple example: cities with a state, and people with only a city. We have two sets of arrays, one that has objects of cities and states, and one that has people. We need to combine these, to find out what state these people live in. 

```js echo
const city_to_state = [
  { city: "New York", state: "New York" },
  { city: "Washington D.C.", state: null },
  { city: "Chicago", state: "Illinois" },
  { city: "San Francisco", state: "California" },
  { city: "Los Angeles", state: "California" }
]

const people = [
  { name: "Bill", city: "New York" },
  { name: "Brandi", city: "Washington D.C." },
  { name: "Johnny", city: "San Francisco" },
  { name: "Taylor", city: "Chicago" },
  { name: "June", city: "Los Angeles" }
]
```
We need to iterate over every _person_, then for that _person's city_, find the associated city + state value in the other dataset, then add `state`:

```js echo
const people_with_state = people.map(personObject => {
  const matchingCity = city_to_state.find(
    cityObject => personObject.city === cityObject.city
  )
  return {
    ...personObject,            // spread to keep the existing object data
    state: matchingCity?.state  // get the state from the matching city object 
  }
})
display(people_with_state)
```

That works -- but if the relationship is a simple one key → one value map, you can build a lookup object once, and it's a bit simpler:

```js echo
const city_object_entries = city_to_state.map(cityValue => Object.values(cityValue))
const state_lookup = Object.fromEntries(city_object_entries)
```

**city_object_entries**: 
```js
display(city_object_entries)
```

**state_lookup**: 
```js
display(state_lookup)
```

Then using that lookup, we can create a new array of objects:
```js echo
const people_with_state_again = people.map(personObject => ({
  ...personObject, 
  state: state_lookup[personObject.city]
}))
display(people_with_state_again)
```

There are many ways to express joins in JavaScript; the important part is to be explicit about the key you match on and what you do when there is no match (`undefined`, skip the row, etc.).

~ *_Back to our original programming_ * ~

The join in which we want to pull the `y` value from the `stocks` data can happen _in the plot channel itself_. We will have the dot mark calculate `y` position by **looking up the price on the date of the event**. Some reminders as we explore this:
1. Channels can be functions, so `y` can run a lookup for every event row.
2. Name inner variables clearly. Historically we have just used the generic `d` declaration in our functions (`(d) => d.price`), but we _cannot_ use `d` twice within two nested functions (`(d) => { d.events.filter((d) => d.attendance) }`) -- we have to use another variable (commonly, `e`, or a helpful word, like `event => event.Date`). 
3. `console.log` inside a channel is a legitimate way to see what Plot is passing in.


Let's add another dropdown for this example that we can use in the chart below. 
```js
const yetAnotherSelectedStock = view(Inputs.select(allTickers))
```

We can also make some constants that could help us do this more easily. 
```js echo
const selectedStockData = stocks.filter(d => d.Ticker === yetAnotherSelectedStock) // filter the stocks
const selectedStockEvents = events.filter(d => d["Related Tickers"].includes(yetAnotherSelectedStock)) // filter the events
// just look at the first object of this data
display(selectedStockData[0])
```

Now, we will add both marks with the lookup in the dot mark: 

```js echo
Plot.plot({
  height: 200, 
  width,
  marks: [
    // the line based on the filtered (selected) stock data
    Plot.line(selectedStockData, {
      x: "Date",
      y: "Close",
    }),
    // dots for the stock events that correspond to the selected ticker
    Plot.dot(selectedStockEvents, {
      x: "Date", // position at the event date
      y: eventDataObj => {
        // helpful console log to check out the event data at this point
        console.log("event data:", eventDataObj)
        // find the stock data for this date
        const stockData = selectedStockData.find(stockDataObj => { 
          // console.log("stock data:", stockDataObj)
          // which stock data matches this event data date?
          return eventDataObj.Date.toDateString() === stockDataObj.Date.toDateString()
        })
        // some events are on the weekend, and don't have a related stock value. 
        // We can check for a matching stockData and if it isn't there, return 0.
        return stockData ? stockData.Close : 0
      },
      stroke: "black", 
      fill: "white",
      tip: true,
      channels: {
        "Event": "Event Name", 
        "Notes": "Notes"
      }
    }),
    // an exposed tooltip for the first of the selected stock data events
    Plot.tip([selectedStockEvents[0]["Event Name"]], {
      x: selectedStockEvents[0].Date, // position at the event date
      y: selectedStockData.find(e => { // y position at the ticker line value on this date
        return e.Date.toDateString() === selectedStockEvents[0].Date.toDateString()
      })?.Close // the ? here just means that only return it if it exists, and don't "fail" if it's undefined.
    }),
  ]
})
```

Now we have dots on the exact position of the stock price to help emphasize the relationship between this event and the resulting price. There are a few that may sit on dates that aren't included in the stock data -- either a holiday or a weekend -- and those sit at the bottom of the `y` axis. 

### Two datasets, new metrics

What if we want to create _new_ metrics when joining? Like a ratio? Let's take two new files on tv viewership and production cost.
1. `viewership.csv`: viewership data since launch date
2. `production_cost.csv`: production cost per episode and total

```js
const viewership = FileAttachment('../class_code/viewership_data/viewership.csv').csv({ typed: true })
const cost = FileAttachment('../class_code/viewership_data/production_cost.csv').csv({ typed: true })
```

Just exploring the data in its existing form, we could make two bar charts -- one for viewership and one for cost. 

```js
Plot.plot({
  title: "Average weekly viewers",
  width,
  marginLeft: 80,
  height: 150, 
  marks: [
    Plot.barY(viewership, {
      x: "show_name",
      y: "total_estimated_viewership",
      sort: { x: "-y" }
    })
  ]
})
```

```js
Plot.plot({
  title: "Cost per episode",
  width,
  marginLeft: 80,
  height: 150, 
  marks: [
    Plot.barY(cost, {
      x: "show_name",
      y: "total_production_cost_usd",
      sort: { x: "-y" }
    })
  ]
})
```

Let's say we want to visualize the total **value** of each show. We could consider total viewers as value, but we should consider the cost of the show as well. Let's make a new metric of _views per dollar spent_ for each show. 

<div class="note">
We are doing all these joins in Plot because it's a bit simpler and is leveraging Plot to its real potential, but don't forget -- you always have the option to create a new dataset to calculate new values. You can use Excel, R, Python, etc., upload the data to the `/data` folder for the lab, and import it like the other data. 
</div>

Let's join in the channel function, like we did between stocks and events data. 

```js echo
Plot.plot({
  marginLeft: 150,
   color: {
    scheme: "YlOrRd",
    legend: true,
    label: "Viewership",
  },
  x: {
    label: "Views per Dollar"
  },
  marks: [
    Plot.barX(viewership, {
      y: "show_name", 
      x: show => {
        // find the cost row 
        const thisCost = cost.find(costRow => costRow.show_name === show.show_name)
        // calculate the metric
        return show["total_estimated_viewership"] / thisCost["total_production_cost_usd"] 
      },
      fill: "total_estimated_viewership",
      sort: { y: "-x" }
    })
  ]
})
```

By creating a new metric, we can see that the views per dollar (based on total production) for Squid Game is significantly higher than some of the other shows. Even though two other shows popped up with more viewership, the cost per viewership metric paints a picture that Squid Game is a great investment.
