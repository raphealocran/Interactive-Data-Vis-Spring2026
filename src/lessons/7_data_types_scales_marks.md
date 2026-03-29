---
title: "Data Types <> Scales <> Marks"
toc: true
---

# Data Types <> Scales <> Marks

---

This lesson ties three ideas together: the **kinds of values** in your data, the **scales** Plot uses to turn those values into positions and colors, and the **marks** you choose to draw. Marks are specified in [data space](https://observablehq.com/plot/features/marks) (times, categories, measurements)—not in raw pixels—and scales bridge data space and the chart.

---

## Data Types

We can group fields in a dataset into broad families. The type of data hints at which scale Plot should use and which mark channels make sense.

### Qualitative (non-numeric, descriptive)

- **Nominal** — Distinct categories _without_ a meaningful order (e.g. hair color, marital status, island name).
- **Ordinal** — Distinct categories _with_ a meaningful order, but the gaps between levels are not a fixed numeric distance (e.g. letter grades, satisfaction “low / medium / high”).

### Quantitative (numeric, measurable)

- **Discrete** — Countable, often _whole numbers_ from counting (e.g. number of children, number of events).
- **Continuous** — Can take _any value_ in a range, including fractions, from measuring (e.g. height, weight, temperature).

The same real-world idea can be stored in different ways. **Weight** (continuous) is not the same as **weight class** (“light / medium / heavy”), which is ordinal or nominal. If you bin continuous measurements (e.g. with `Plot.bin()`), you can move data from many numeric values to fewer ordered or categorical bins—a pattern that pairs well with bar-style marks. 

_Note: see [transforms](./6_transforms_and_data_manipulation.md) for how binning changes cardinality._

---

## Scales

From the [marks documentation](https://observablehq.com/plot/features/marks): marks are (typically) not positioned in literal pixel coordinates. You supply **abstract values** (time, temperature, category labels, counts). Marks are drawn in **data space** -- and **scales** are used to encode those values into visual results—horizontal and vertical position, color, radius, and so on. Plot also builds axes and legends that explain those encodings.

Think of a simple line chart: `x` might encode time, `y` might encode price—both abstract. The x scale maps the time domain to horizontal pixel extent; the y scale maps the price domain to vertical extent.

A faceted or small-multiple layout is the same idea with more channels: e.g. `x` = island (category), `y` = count (number), `fill` = island (category) mapped through a color scale to distinct hues. The domain is what goes in (your data values); the range is what comes out (pixel span, color ramp, etc.).

Plot’s [scales guide](https://observablehq.com/plot/features/scales) spells this out formally:

- **Domain**: The input values the scale expects. For quantitative or temporal data, this is often an extent such as min–max. For ordinal or nominal data, it is often an explicit list of categories. The domain lines up with options like linear vs ordinal scale behavior.
- **Range**: The output of the scale. For position scales, typically left–right or bottom–top in pixel space. For color scales, a continuous ramp (e.g. blue → red) or a list of discrete colors.

You rarely set every scale by hand; Plot infers sensible defaults from the types of the values bound to each channel.

### Continuous position scales

You can set **`x`** or **`y`** **`domain`** yourself. For numeric data, the domain is usually an extent `[low, high]`. Swap the ends of the extent to reverse the axis.

```js echo
display(Plot.plot({
  x: { domain: [0, 100], grid: true }
}));
```

```js echo
display(Plot.plot({
  x: { domain: [100, 0], grid: true }
}));
```

Widen the plot by setting **`width`** (use the reactive `width` your page provides, or a fixed number such as `640`).

```js echo
display(Plot.plot({
  width: 640,
  x: { domain: [0, 100], grid: true }
}));
```

When values are **dates**, the domain can be date extents. Month indices in `Date` are 0-based, so January is `0`.

```js echo
display(Plot.plot({
  x: {
    domain: [new Date(2025, 0, 1), new Date()],
    grid: true
  }
}));
```

### Discrete position scales: point and band

For categorical **x** or **y**, Plot often uses a **point** scale: categories land on evenly spaced positions (a common default for ordinal data on position).

```js echo
const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
display(Plot.plot({ x: { type: "point", domain: letters, grid: true } }));
```

A **band** scale splits space into evenly spaced **intervals** (bands). That is what bar charts rely on—each category owns a band. **`Plot.cell`** makes those bands visible:

```js echo
const letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
display(Plot.plot({
  x: { type: "band", domain: letters },
  marks: [
    Plot.cell(letters, {
      x: (d) => d,
      stroke: "lightgrey"
    })
  ]
}));
```

---

## Diamonds: data types, scales, and marks

The built-in **`diamonds`** dataset (available in Observable Framework with other sample tables) mixes **continuous** fields—`carat`, `depth`, `price`, `x`, `y`, and so on—with **ordinal** fields such as **`cut`** and **`color`**. Skim the columns:

```js echo
view(Inputs.table(diamonds.slice(0, 100)));
```

**Two continuous position channels** pair naturally with **`Plot.dot`** (here `x` and `y` are spatial fields in the dataset, and **radius** encodes **price**):

```js echo
display(Plot.plot({
  marks: [
    Plot.dot(diamonds, {
      x: "x",
      y: "y",
      r: "price",
      fill: "currentColor",
      opacity: 0.25,
      tip: true
    })
  ]
}));
```

**One ordinal position + one quantitative length** is the usual bar pattern. **`Plot.groupX`** counts rows per **`cut`**:

```js echo
display(Plot.plot({
  marks: [
    Plot.barY(
      diamonds,
      Plot.groupX({ y: "count" }, { x: "cut", y: "count" })
    )
  ]
}));
```

You can add another summary on the same grouping—for example **mean price** driving **`fill`**:

```js echo
display(Plot.plot({
  marks: [
    Plot.barY(
      diamonds,
      Plot.groupX(
        { y: "count", fill: "mean" },
        { x: "cut", y: "count", fill: "price", tip: true }
      )
    )
  ],
  color: {
    scheme: "YlOrRd",
    legend: true,
    label: "Average price"
  },
  x: { label: "Cut" },
  y: { label: "Count of diamonds" }
}));
```

**Two ordinal position channels** often use **`Plot.cell`**. With one row per diamond, raw cells overlap; the snippet below uses the first 100 rows like the [Fall 2025 week 7 notes](https://raw.githubusercontent.com/InteractiveDataVis/Interactive-Data-Vis-Fall2025/refs/heads/class/src/lab_2/week_7_notes.md) to keep the grid readable:

```js echo
display(Plot.plot({
  marks: [
    Plot.frame(),
    Plot.cell(diamonds.filter((d, i) => i < 100), {
      x: "color",
      y: "cut",
      opacity: 0.25
    })
  ]
}));
```

**`Plot.text`** with **`Plot.group`** can show **counts** per `(cut, color)` pair:

```js echo
display(Plot.plot({
  marks: [
    Plot.frame(),
    Plot.text(
      diamonds,
      Plot.group({ text: "count" }, { x: "cut", y: "color", text: "count" })
    )
  ]
}));
```

Aggregating **mean price** into each cell yields a heatmap-style view:

```js echo
display(Plot.plot({
  marks: [
    Plot.frame(),
    Plot.cell(
      diamonds,
      Plot.group(
        { fill: "mean" },
        { x: "color", y: "cut", fill: "price", tip: true }
      )
    )
  ],
  color: {
    scheme: "YlOrRd",
    legend: true,
    label: "Average price",
    tickFormat: d3.format("$,.0f")
  }
}));
```

---

## Data Types <> Marks

There is no single rule for every chart, but usually each mark expects certain kinds of channels. The table below matches the Week 8 slides: typical `x` and `y` data types for common marks, plus extra channels where the slides call them out.

| Mark | x (typical) | y (typical) | Other channels |
|------|-------------|-------------|------------------------------|
| `Plot.lineY()` / `Plot.lineX()` | quantitative | quantitative | (orientation depends on which line mark you use) |
| `Plot.barY()` | ordinal (or nominal) | quantitative | Categories on `x`, lengths on `y` |
| `Plot.barX()` | quantitative | ordinal (or nominal) | Lengths on `x`, categories on `y` |
| `Plot.dot()` | quantitative | quantitative | **r** (radius) is often quantitative |
| `Plot.cell()` | ordinal (or nominal) | ordinal (or nominal) | **fill** can be quantitative _or_ qualitative |

Bars often pair a categorical position channel with a numeric length. Dots in a scatterplot usually put two quantitative channels on `x` and `y`. Cells (heatmap-style) commonly use two categorical axes to index a grid, with fill carrying the value you want to emphasize.

In code, you still pass field names (or arrays); Plot looks at the values (numbers, dates, strings) to choose scale behavior. If something looks wrong, ask: “Is this channel ordered numbers, dates, or labels?”—that answer points to the right scale and mark pairing.

```js echo
const rows = [
  { region: "North", sales: 120 },
  { region: "South", sales: 90 },
  { region: "East", sales: 150 }
];

display(Plot.plot({
  marginLeft: 50,
  marks: [
    Plot.barY(rows, { x: "region", y: "sales", fill: "steelblue" })
  ]
}))
```

Here `x` is nominal/ordinal (region labels) and `y` is quantitative (sales)—the usual `Plot.barY` pattern from the table.

---

## Color Scales

**Color** is another channel, and it has its own scale. Color scale “families” mirror the data-type ideas above. See [Plot: scales](https://observablehq.com/plot/features/scales) for full options.

1. **Categorical (qualitative)**  
   - Nominal-style — Distinct categories → distinct hues (e.g. species, island).  
   - Ordinal-style — Still discrete, but order matters (e.g. grades, satisfaction bands); choose a palette that respects order.

```js
Plot.plot({
  color: {
    type: "ordinal",
    scheme: "Category10"
  },
  marks: [
    Plot.cell("ABCDEFGHIJ", {x: Plot.identity, fill: Plot.identity})
  ]
})
```

2. **Quantitative**  
   - Linear (and related) — Continuous numeric values interpolated along a ramp (e.g. temperature, population). Plot also supports transforms such as sqrt, log, power, and symlog on quantitative color scales when compression of large ranges helps.

```js
Plot.plot({
  axis: null,
  padding: 0,
  color: {
    type: "linear",
    scheme: "blues"
  },
  marks: [
    Plot.cell(d3.range(40), {x: Plot.identity, fill: Plot.identity, inset: -0.5})
  ]
})
```

3. **Diverging**  
   - Emphasizes a midpoint (often zero) and moves to two different hues on either side—useful for positive vs negative or above/below a reference.

```js
Plot.plot({
  axis: null,
  padding: 0,
  color: {
    type: "linear",
    scheme: "brbg"
  },
  marks: [
    Plot.cell(d3.range(40), {x: Plot.identity, fill: Plot.identity, inset: -0.5})
  ]
})
```

4. **More** — Sequential, threshold, quantile, and other specialized color scales appear in the docs when you need them.

You configure the plot-level color scale with the top-level **`color`** option (e.g. `legend`, `scheme`, `domain`, `type`), while individual marks still say which field drives color via **`fill`** or **`stroke`**.

```js echo
const penguins = [
  { island: "Biscoe", bill: 48 },
  { island: "Dream", bill: 44 },
  { island: "Torgersen", bill: 46 }
];

display(Plot.plot({
  marginLeft: 80,
  marginBottom: 40,
  marks: [
    Plot.dot(penguins, { x: "bill", y: "island", fill: "island", r: 8 })
  ],
  color: { legend: true }
}))
```

**Fill** binds **island** (qualitative) to the mark; **`color: { legend: true }`** documents the categorical color scale at the plot level.
