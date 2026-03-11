---
title: "Intro to Observable Plot"
toc: true
---

# Intro to Observable Plot

---

## What is Observable Plot?

**Observable Plot** is a declarative JavaScript library for data visualization. In this course we use it for all charts. Unlike “chart type” libraries, but similar to the many recomendations of our readings, Plot is **marks-based**. That means you build a chart by combining **marks** (dots, bars, lines, areas, etc.) and binding them to data. There is no separate “scatter template” or “bar template”—you choose the marks and the scales do the rest.

Note on using Plot in Framwork: Plot, similar to d3.js, is available globally in `.md` pages; you do not import it. 

---

## Plot.plot()

Every chart is created with `Plot.plot(options)`. Even without options, an SVG is rendered. You may not see anything here, but there is an SVG rendered from the `Plot.plot()` code below. You can inspect the window and see an svg. 

```js echo
Plot.plot()
```

The most important option is **`marks`**: an array of marks drawn in order (last on top). Marks include things like dots, bars, lines, etc. 

Let's say our data is the following:
```js echo
const sample = [
  { name: "A", value: 10, color: "blue" },
  { name: "B", value: 25, color: "green" },
  { name: "C", value: 15, color: "orange" },
  { name: "D", value: 30, color: "red" }
];
```

```js echo
Plot.plot({
  marginLeft: 50,
  title: "Sample Bar Chart",
  marks: [
    Plot.barY(sample, {
      x: "name",
      y: "value",
      fill: "steelblue",
      tip: true
    })
  ]
})
```

Common top-level options include **`title`**, **`width`**, **`height`**, **`marginLeft`** (and other margins), **`grid: true`**, and **`marks`**. In Framework, you can pass the built-in **`width`** variable so the chart resizes with the page.

---

## Marks

Common helpful marks include: 

| Mark | Typical use |
|------|-------------|
| `Plot.dot()` | Scatter (one point per row) |
| `Plot.barY()` / `Plot.barX()` | Bar charts |
| `Plot.lineY()` / `Plot.lineX()` | Line / time series |
| `Plot.areaY()` | Area under a line |
| `Plot.rectY()` | Histograms (with a bin transform) |
| `Plot.ruleY()` / `Plot.ruleX()` | Reference lines (e.g. at zero) |
| `Plot.frame()` | Border around the plot |

Marks take **data** and **options**. The structure is something like this: 

``` echo
Plot.plot({
  marks: [
    Plot.[MARK]([DATA], [OPTIONS])
  ]
})
```
Each argument serves a specific purpose: 
1. Data - the data to be used to render the marks (e.g. `Plot.dot(sample, {...})`).
2. Options - options about this specific mark, including channels and/or constants about how to tie the data to the mark. 

### Data join

Marks within Plot leverage something we can call a **data join**: in many instances, one row in your data array becomes one graphical element (one dot, one bar, etc.). The mark function takes two arguments: 

The **channels** in the options tell Plot how to read each row, i.e., `x: "name"` means “use this row’s `name` for the x position,” and `y: "value"` means “use this row’s `value` for the y position.” 

So for `sample` with 4 rows, `Plot.dot(sample, { x: "name", y: "value" })` draws **4 dots**—one per row—with positions coming from those fields. 

Constants (e.g. `r: 6`) apply the same to every mark; channel names (e.g. `fill: "color"`) directly render the data points color as the background.

```js echo
Plot.plot({
  grid: true,
  marks: [
    Plot.ruleY([0], { stroke: "gray", strokeDasharray: "2 2" }),
    Plot.dot(sample, {
      x: "name",      // ← which key to read for x positioning
      y: "value",     // ← which key to read for y positioning
      r: 6,           // ← set value for radius
      fill: "color",  // ← which key to read for fill
      tip: true
    })
  ]
})
```

You can also use functions to pass values to the marks options. When using functions, it will run the function on the associated data that it is making a mark for. This allows you to manipulate values and how they should be rendered. 

```js echo
Plot.plot({
  grid: true,
  marks: [
    Plot.ruleY([0], { stroke: "gray", strokeDasharray: "2 2" }),
    Plot.dot(sample, {
      x: (d, i) => d["name"] + " element",
      y: (d, i) => d["value"] * 100,
      r: (d, i) => 10 + i * 15,
      fill: (d, i) => ["red", "orange", "yellow", "green"][i],
      tip: true
    })
  ]
})
```

---

## Transforms

Sometimes, data is not in the exact format that we may want when considering a visual. Let's take the (preloaded) penguins dataset. Say you want to count times a penguin is listed as each of the species. The dataset looks like this: 

```js
Inputs.table(penguins)
```

There is no column for "count". Each row is a penguin, with its own species designation, along with other metrics. We need to run a transformation on the data to determine how many penguins fit into each species. This could be done with Javascript, which we will get into more in future classes, but it also can be done within the Plot arguments with a **transform**. 

When simply counting rows to then plot into a bar chart, we transform with `groupX` within the `barY` mark. That is because we are transforming based on the x axis to some reduction which will be applied to the y axis. 

```js echo
Plot.plot({
  marks: [
    Plot.barY(penguins, 
      Plot.groupX(
        { y: "count" },   // ← this is the "reducer", or, what aggregation/function/etc to apply
        { x: "species" }  // ← this is the pivot point for the reducer -- what are we counting on?
      )
    )
  ]
})
```

There are a great many transforms you can do to the data, but the transform you use depends a lot on the data, the scales, and the intended marks. For a histogram, you **bin** the data and then draw **rects**. Use the **`Plot.binX()`** transform: it groups values into bins and can reduce with `y: "count"` (or `"sum"`, `"mean"`, etc.).

```js echo
const values = [3, 5, 2, 7, 4, 5, 4, 4, 6, 4, 5, 8, 4, 6];
const raw = values.map((v, i) => ({ id: i, value: v }));
```

```js echo
Plot.plot({
  y: { grid: true },
  marks: [
    Plot.rectY(raw, Plot.binX(
      { y: "count" }, 
      { x: "value", thresholds: 6 }
    )),
    Plot.ruleY([0])
  ]
})
```

---

## Plot tips

- You can put `Plot.plot({...})` inside a **`${ ... }`** expression in your markdown or HTML so it renders inline (as in the examples above). If you use a code block, and create something else in the code block, don't forget to use `display` or `view` around your plot.
- You can place plots inside **cards** or **grids** as in the [Intro to Observable Framework](/lessons/3_intro_to_observable_framework) lesson.
- Use **`view()`** and **Inputs** to drive reactive variables (e.g. a selected category); use those variables in your data pipeline or in Plot options so the chart updates when the input changes.

For more marks, options, and transforms, see the [Observable Plot documentation](https://observablehq.com/plot).
