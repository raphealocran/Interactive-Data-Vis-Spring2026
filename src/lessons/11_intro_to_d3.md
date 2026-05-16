---
title: "Intro to d3.js"
toc: true
---

# d3.js

We reviewed d3 a bit in our introduction to svgs in [Faceting and SVGs](./9_faceting_and_svgs), but let's take it more step by step and review the concepts.

## Selection

D3.js uses DOM manipulation to add, change, or remove elements that are already on the screen. This is usually used to attach DOM elements to data, but we can also just select and manipulate any element with the same methods.

First, we use `d3.select` to "select" everything on the page that fits the selector criteria. We can start with just selecting any pre-existing element, with the help of css selectors. Let's make an svg and select it with javascript:

<svg id="svg-component" style="border: 1px solid" width="${width}">
  <text 
    id="text-component" 
    style="font-style: italic; transform: translate(50%, 50%); text-anchor: middle"
    >this is our svg for selection</text>
</svg>

SVG selection, from d3:

```js echo
const svgSelection = d3.select("#svg-component");
display(svgSelection);
```

This looks like a bunch of code nonesense, and it somewhat is. But now that we have that DOM element saved in a variable, we can make changes to it with d3 methods.

## Action

The next step in the d3 process is actions on a selection. We can do many things with the selection, including simply modifying the style, or appending more elements, or changing elements, etc. Each of these buttons runs a function that does something to the selection (the svg above):

```js
view(
  Inputs.button("abra", {
    label: "Change the background color",
    reduce: changeColor,
  }),
);
view(Inputs.button("kadabra", { label: "Add a circle", reduce: addCircle }));
view(
  Inputs.button("alakazam", {
    label: "Change the text value",
    reduce: changeText,
  }),
);
view(
  Inputs.button("undo", {
    label: "Reset the svg",
    reduce: reset,
  }),
);
```

The functions used in each button to manipulate the DOM are as follows:

```js echo
function changeColor() {
  // edit the style of the element
  svgSelection.style("background-color", "pink");
}

function addCircle() {
  svgSelection
    // append a circle
    .append("circle")
    .attr("id", "appended-circle")
    .attr("cx", 40)
    .attr("cy", 40)
    .attr("r", 20)
    // style the appended circle (notice this style is not on the svg, but the circle)
    .style("fill", "lightblue")
    .style("stroke", "white");
}

function changeText() {
  // select the text component within the svg and change the text value
  svgSelection.select("#text-component").text("🎉 BOO! new text!!! 🎉");
}

function reset() {
  // select the text component within the svg and revert it back to original text
  svgSelection.select("#text-component").text("this is our svg for selection");
  // unset the background color
  svgSelection.style("background-color", "unset");
  // remove appended circle
  svgSelection.select("#appended-circle").remove();
}
```

If we look at the SVG node (element) after clicking some buttons, we can see those changes exist on the element itself. Check it out in the inspector, and you can see the function style and element changes exist in the DOM tree.

## Data Binding

This is enough if all we wanted to do was modify elements on the page, but we want to actually bind the elements on the page to data. To do this, we join elements to data, and rely on d3 to reconcile. Let's make a new SVG and some fake data to append to it.

We will start with just some random data generated with a points generator to make an object with an x and y betweeon 0 and 100:

```js
const data = generateRandomPoints();
display(data);
```

Circles SVG:

<svg id="svg-component-circles" style="border: 1px solid" width="100" height="100"></svg>

```js
function generateRandomPoints(count = 10) {
  const points = [];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 100) + 1;
    const y = Math.floor(Math.random() * 100) + 1;
    points.push({ x, y });
  }

  return points;
}
```

We've already used selections for things that exist already, but d3 is a bit confusing in that when doing your first data join when the pages loads, we often start by selecting things that _don't (yet) exist_. We start with a selection of the svg, then `selectAll` of the elements we _intend_ to make.

Then, in that sub-selection, we use `join` to create the new element that should be joined to data, and pass in functions to help determine the relevant properties of the svg element, like `cx` and `cy` in a `<circle>`, or `width` and `height` in a `<rect>`.

```js echo
// grab the other svg with the appropriate id / css selector
const svg = d3.select("#svg-component-circles");
// create the circles selection by selecting something that doesn't exist, but matches what we intend to make
const circles = svg
  .selectAll("circle.data-join")
  .data(data)
  // join = create one circle for every data element
  .join("circle")
  // add the class so it matches the original selection ("circle.data-join")
  .attr("class", "data-join")
  // the x and y should be based on the x and y from the data
  .attr("cx", (d) => d.x)
  .attr("cy", (d) => d.y)
  .attr("r", 3);
```

You can think of this selection as a declaration of the items on the screen that _will_ match the visual when the data join is reflected. This probably seems backwards (or, overly complex) as you think about creating visualizations that render on the page right away. But this approach of `join`ing with an empty `selection` is optimized for the potential next step, in which the data can change.

```js echo
function draw(data) {
  // grab the new svg with the appropriate id / css selector
  const svg = d3.select("#svg-component-changes");
  // create the circles selection by selecting something that doesn't exist, but matches what we intend to make
  const circles = svg
    .selectAll("circle.data-join")
    .data(data)
    // join = create one circle for every data element
    .join("circle")
    .attr("class", "data-join")
    // the x and y should be based on the x and y from the data
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 3);

  // this next return is observable specific, so it renders in the markdown file
  return svg.node();
}
```

The above function is when we draw, or actually run, the d3 code to append, update, and remove the circles. You can think of this function as instructions for how the SVG should reflect the data. By re-running these instructions over and over, we are re-drawing the visual with the same instructions but new data.

We will start by calling it to add data to the svg node:

```js echo
draw(changingData);
```

<svg id="svg-component-changes" style="border: 1px solid" width="100" height="100"></svg>

Then we can manipulate the visual with buttons. Each of these buttons call a function that does two things: (1) change the data in some way, and (2) trigger the draw function to re-draw on the svg.

```js
view(
  Inputs.button("refresh", {
    label: "Refresh the points",
    reduce: changeData,
  }),
);
view(
  Inputs.button("add", {
    label: "Add new points",
    reduce: addPoints,
  }),
);
view(Inputs.button("delete", { label: "Delete points", reduce: deletePoints }));
```

If it simply changed the data but didn't re-run the draw function, the SVG would not reflect the new values. When working with d3, you have to be very explicit about each step -- data change, update visual (`draw()`). With observable framework, we have the luxury of not having to deal with all the steps of updates (managing data, triggering a change) because of its built in [reactivity](https://observablehq.com/framework/reactivity).

The functions for changing, adding points, or deleting points are as follows.

```js echo
let changingData = generateRandomPoints();

function changeData() {
  // regenerate random points
  changingData = generateRandomPoints();
  // re-draw with the new random points
  draw(changingData);
}

function addPoints() {
  // create three new points
  const newPoints = generateRandomPoints(3);
  // add those three new points to the existing points
  changingData = [...changingData, ...newPoints];
  // re-run the draw function with more data
  draw(changingData);
}

function deletePoints() {
  const length = changingData.length;
  // remove the last three points
  changingData = changingData.slice(0, changingData.length - 3);
  // re-draw with those points removed
  draw(changingData);
}
```

This example is complex in that it spans multiple js blocks and requires a function to update, but the intended concept is that, whenever actions / instructions are called on a selection, it remedies with whatever state the data is at that point.
