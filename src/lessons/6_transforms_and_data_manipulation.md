---
title: "Transforms and Data Manipulation"
toc: true
---

# Transforms and Data Manipulation

---

## Transforms

Transforms were initially discussed in the [previous lesson](./5_intro_to_observable_plot.md), but in this lesson, we will deep dive with three examples of changing or not changing data cardinality. 

At its core, transforms reshape the data from one form into another that can then be plotted. Since transforms are reshapers that are ultimately plotted, the two options include (1) the details about how to do the transform, and (2) the resulting mark options that will be passed along to the plot after the transform is completed. 

As said in the [transforms documentation](https://observablehq.com/plot/features/transforms): 
> _Plot’s transforms typically take two options objects as arguments: the first object contains the transform options (above, {y: "count"}), while the second object contains mark options to be “passed through” to the mark ({x: "weight", fill: "sex"}). The transform returns a new options object representing the transformed mark options to be passed to a mark._

This takes on a few forms that are worth highlighting. There are many ways to use transforms, but here are a few examples of the cardinality shifts or configuration changes that translate to different visuals. 

### Many-To-Fewer (`groupX`, `groupY`, `groupR`)

The simplest example of how transforms can support your data is with the `group` example and a `count` reducer. Last lesson discusses this with penguins, but we will simplify to something even smaller:

```js echo
const groupData = [
  { type: "A", value: 2.0 },
  { type: "B", value: 1.3 },
  { type: "B", value: 3.2 },
  { type: "B", value: 3.7 },
  { type: "C", value: 6.4 },
  { type: "C", value: 9.1 }
]
```

The `group` transform can help us answer something like "How many type A measurements exist in the dataset?" Translating this to a quantity lends itself to being plotted in a bar -- so we will do that. This time, let's flip the x and y to explore how the transform can group in the Y direction to plot in an x direction. 

In the second argument we pass the **channel to group by**: `{ y: "type" }`. The first argument says we want **count** on x. So the transform counts rows per type.

```js echo
Plot.plot({
  marks: [
    Plot.barX(
      groupData, 
      Plot.groupY(
        { x: "count" },
        { y: "type" }
      )
    )
  ]
})
```

What does the transform actually return? Let's take a look at it closely: 
`groupOutput`:
```js
const groupOutput = Plot.groupY(
  { x: "count" },
  { y: "type" }
)
display(groupOutput)
```


It’s an options object (with `x`, `y`, and an internal `transform` function) that the mark uses to pre-calculate values. You can pass through other channels in the second argument just like on a normal mark—e.g. `fill` so each bar gets a color:

```js echo
Plot.plot({
  marks: [
    Plot.barX(
      groupData, 
      Plot.groupY(
        { x: "count" },
        { y: "type", fill: "type" }
      )
    )
  ],
  color: { legend: true }
})
```

There are other reducers within the same `group` transform, including helpful ones like `min`, `max`, `mean`, `sum`, and [more](https://observablehq.com/plot/transforms/group#group-options). Let's try the same plot with other reducer options -- you can select which reducer you'd like to try out: 

```js
const reducer = view(Inputs.select(["min", "max", "mean", "sum"], { value: "min", label: "Reducer" }))
```

```js echo
Plot.plot({
  marks: [
    Plot.barX(
      groupData, 
      Plot.groupY(
        { x: reducer }, // ← selected reducer above
        { y: "type", x: "value" }
      )
    )
  ]
})
```

This time, we need to include both the `x` and `y` channel as options passed to the mark, with the reducer being applied to the `x` channel. 

---

### Continuous Many-To-Fewer (`binX`, `binY`, `hexbin`, etc.)

When the data is continuous, but we want to demonstrate with a bar or histogram, we have to do some binning, effectively answering "Where are the concentrations of continuous values?"

Use data with a **continuous** field (e.g. numbers) so the transform can split the range into intervals:

```js echo
const binData = [
  { value: 2.1 }, { value: 2.4 },
  { value: 3.0 }, { value: 3.2 }, { value: 3.5 }, 
  { value: 4.0 }, { value: 4.2 }, { value: 4.5 }, { value: 4.7 }, { value: 4.9 },
  { value: 5.0 }, { value: 5.1 }, { value: 5.2 }, { value: 5.3 }, { value: 5.4 }, { value: 5.6 }, { value: 5.8 }, { value: 5.9 },
  { value: 6.0 }, { value: 6.2 }, { value: 6.4 }, { value: 6.5 }, { value: 6.7 },
  { value: 7.0 }, { value: 7.2 }, { value: 7.5 }, { value: 7.8 },
  { value: 8.0 }, { value: 8.3 }
]
```

```js echo
Plot.plot({
  height: 150,
  marks: [
    Plot.rectX(
      binData,
      Plot.binY(
        { x: "count" },
        { y: "value" }
      )
    )
  ]
})
```

This bins continuous `value` along x and counts how many points fall in each bin (a histogram).

---

### One-To-One (`windowX`, `windowY`)

Window transforms keep **the same number of rows**: each row gets a new value computed from a sliding window of its neighbors (e.g. rolling mean). So one row in, one row out.

The window transform is a specialized map transform that computes a moving window and then derives summary statistics from the current window, say to compute rolling averages, rolling minimums, or rolling maximums. This is a bit more rare, but can be helpful if you want to reshape your data by computing a rolling average to smooth out the visual. 

Use `windowX` when the window slides along the x-axis (e.g. time); use `windowY` when it slides along y. Options include `k` (window size) and `reduce` (`"mean"`, `"min"`, `"max"`, etc.).

```js echo
const windowData = [
  { x: 1, y: 3 }, { x: 2, y: 5 }, { x: 3, y: 4 }, { x: 4, y: 7 }, { x: 5, y: 6 },
  { x: 6, y: 8 }, { x: 7, y: 5 }, { x: 8, y: 6 }, { x: 9, y: 9 }, { x: 10, y: 7 }
]
```

```js echo
Plot.plot({
  height: 180,
  marks: [
    Plot.lineY(windowData, { x: "x", y: "y", stroke: "#999", strokeDasharray: "2 2" }),
    Plot.lineY(windowData, Plot.windowY({ k: 3 }, { x: "x", y: "y", stroke: "#1a5fb4" }))
  ]
})
```

Here the gray dashed line is the raw data; the blue solid line is the same points with a 3-point rolling mean—one value per row, so cardinality stays one-to-one.

---

## Data Manipulation

Transforms are incredibly valuable, but they aren't the only way to reshape the data into the structure you need. 


## Javascript Data Manipulation Methods

Just a quick note / exposure to some helpful JS data manipulation. JavaScript arrays give you direct ways to reshape data before it reaches Plot. A few you'll use often:

- **`filter`** — Keep only rows that pass a test (e.g. `data.filter(d => d.year >= 2020)`). Same number of columns, fewer rows.
- **`map`** — Turn each row into a new value or object (e.g. `data.map(d => ({ ...d, total: d.a + d.b }))`). Same number of rows, new or changed columns.
- **`reduce`** — Collapse the array into a single value or structure (e.g. sum, or an object of counts per category). You pass a callback `(accumulator, currentItem) => ...` and an initial value; the callback runs once per item, updating the accumulator each time, and you return the final accumulator. Often used to build aggregated datasets. See [MDN: Array.prototype.reduce](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reduce) for the full API.

You can chain these: filter, then map, then pass the result to Plot. Or use `reduce` to build a summarized array and plot that. 

## Group with Javascript

You don't have to use Plot's group transform to get the same chart. You can compute the grouped dataset in JavaScript (e.g. with a `for` loop or `reduce`), then pass that **pre-aggregated** data into a mark and bind channels directly—no transform.

Here we reproduce the "count by type" bar chart using the same `groupData`. First, with a **for loop**:

```js echo
const countsByType = {}
for (const d of groupData) {
  countsByType[d.type] = (countsByType[d.type] ?? 0) + 1
}
const groupedArrayLoop = Object.entries(countsByType).map(([type, count]) => ({ type, count }))
```

```js echo
Plot.plot({
  marks: [
    Plot.barX(groupedArrayLoop, { x: "count", y: "type" })
  ]
})
```

Same result using **reduce**:

```js echo
const groupedByType = groupData.reduce((acc, d) => {
  acc[d.type] = (acc[d.type] ?? 0) + 1
  return acc
}, {})
const groupedArray = Object.entries(groupedByType).map(([type, count]) => ({ type, count }))
```

```js echo
Plot.plot({
  marks: [
    Plot.barX(groupedArray, { x: "count", y: "type" })
  ]
})
```

Same result as `Plot.barX(groupData, Plot.groupY({ x: "count" }, { y: "type" }))`—just two ways to get there. Transforms are convenient when you want to keep raw data in one place and let Plot do the reshaping; JS manipulation is useful when you need the aggregated data elsewhere (e.g. for tables or multiple charts) or prefer explicit control.