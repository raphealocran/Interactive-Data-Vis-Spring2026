---
title: Faceting and SVGs
toc: true
---

# Facets

[Faceting](https://observablehq.com/plot/features/facets) partitions data by ordinal or categorical value and then repeats a plot for each partition (each facet), producing small multiples for comparison. Faceting is enabled by declaring the horizontal↔︎ facet channel `fx`, the vertical↕︎ facet channel `fy`, or both, for two-dimensional faceting.

We've seen this before, but its worth calling out intentionally. Let's make a basic penguins chart without faceting. We can make a simple bar chart that includes grouping on the y, with "count" as our reducer on the x direction. 

```js echo
Plot.plot({
  marginLeft: 80,
  grid: true,
  color: { legend: true },
  marks: [
    Plot.barX(penguins, 
      Plot.groupY(
        { x: "count" },               // ← reducer
        { y: "island", fill: "sex" }  // ← options
      )),
    Plot.frame()
  ]
})
```
Faceting allows us to split by another layer, to see things even more clearly. Right now, that chart shows count of penguins, split by island, colored by sex, as a stacked bar. What if we also wanted to include the split of species? That would be count of penguins, per island, per species, per sex. We would have to introduce another dimension of the visualization with faceting. 

We have changed dimensionality in our visualizations before, from two dimensions (scatterplots, or simply databases that don't have the right shape) to one dimension (bar charts) by using transforms. The transform actually computes new data to fit the dimensionality we want to visualize. 

We can think of faceting similarly, as a way to **increase the dimensionality** of our visualization, similar to how transforms helped us decrease dimensionality with reducing to count. By adding `fy: "species"` to our options in the transform, we are now grouping with that additional metric in mind, and it is reflected in the visualization. 

```js echo
Plot.plot({
  marginLeft: 80,
  marginRight: 60,
  grid: true,
  y: { label: null },
  fy: {label: null},
  color: {legend: true},
  marks: [
    Plot.barX(penguins, 
      Plot.groupY(
        { x: "count" },                             // ← reducer
        { y: "island", fill: "sex", fy: "species" } // ← options, with facet
      )),
    Plot.text([
      (`While Chinstrap and Gentoo 
        penguins were each observed
        on only one island, Adelie 
        penguins were observed on 
        all three islands.`
      )
      ], {
      fy: ["Adelie"],
      frameAnchor: "top-right",
      lineWidth: 18,
      dx: -6,
      dy: 6
    }),
    Plot.frame()
  ]
})
```

This new visualization includes so much more. It technically performs the transform on the data to get it to the right shape with a reduction (count), and visually it splits by species _and_ island, and stacks / colors by sex. Facets are a great tool to split and explore your data even more and possibly combine two visualizations into one.

<hr>

# Plot → d3.js → SVG
Let's take some time to look under the hood and explore: How does plot work, technically?

## SVGs

SVGs (scalable vector graphics) are HTML elements that can render two dimensional vector graphics. This can be leveraged for anything from logos to how we make our Observable Plots. SVG is the HTML mechanism that does the “drawing” of our data on the screen.  

SVG is a container that renders the 2 dimensional objects, which sit inside the nested structure. 

```html echo
<svg width="200" height="200" >
  <rect width="100" height="100" x="50" y="50" fill="red" />
</svg>
```

There's a [myriad of elements](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element) that can go inside svg, but the ones we use regularly for our visualizations are: 
* `<circle>`: a circle element, which takes properties like `cx`, `cy`, and `r`
* `<rect>`: a rectangular element, takes properties like `width`, `height`, `x`, and `y`
* `<path>`: a path, which is very flexible but needs to be created with [line commands](https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorials/SVG_from_scratch/Paths) 

If we peel back the curtain, plot is doing some impressive things when it takes our data and turns it into visualizations. We haven’t had to think about it too closely, but the options we provide to plot are used to devise, position, and style the elements inside the svg. 

Plot does this by joining **data to elements**. When we pass in a dataset like the penguins dataset, and tell it to position (x and y) based on certain variables, it calculates the scales and renders these things all on its own. In the following scatterplot, it assesses the domain of culmen lengths and depths, the available screen space, and adds one dot for every penguin in the exact right position given the scales. 

```js echo
Plot.plot({
  width,
  marks: [
    Plot.frame(),
    Plot.dot(penguins, {
      // use this variable to position via x
      x: "culmen_length_mm",
      // use this variable to position via y 
      y: "culmen_depth_mm",
      // use this variable to color them
      fill: "island",
      tip: true
    })
  ]
})
``` 

This is significantly easier than if we had to do this on our own. Even just calculating the horizontal scale would be very complicated in javascript. We can try with some quick math...

```js echo
// this is the entire pixel domain data could be placed.
const domain = [0, width]
// this is the entire range of data values for the x value, as per the data. Remove any NaNs.
const rangeValues = penguins.map((penguin) => penguin.culmen_length_mm).filter(d => d)
const range = [ Math.min(...rangeValues), Math.max(...rangeValues) ]

const xScale = (culmen_length_mm) => {
  const rangeSpan = range[1] - range[0];
  const domainSpan = domain[1] - domain[0];
  
  // where does this value sit in the values range?
  const normalized = (culmen_length_mm - range[0]) / rangeSpan;

  // given its spot in the range, return the relative spot in the domain
  return domain[0] + (normalized * domainSpan);
  // in case the domain is greater than 0, we have to offset by it
}
```

Then when we have some penguin values, our function should return the relative x position: 
```js echo
display(xScale(penguins[0].culmen_length_mm))
display(xScale(penguins[5].culmen_length_mm))
display(xScale(penguins[10].culmen_length_mm))
```

If we did this for both x and y, we could finally position a dot, something like: 

```html run=false
<svg>
  <circle cx="[X SCALED VALUE]" cy="[Y SCALED VALUE]" r="10">
</svg>
```

In the above example, we'd have to plot one circle for every element in the data, so we'd be mapping over the data to produce all the values in question, and rendering them on the chart. (Aren't you glad we can just render a `Plot.plot` function instead?)


## DOM Manipulation

Behind the scenes, Plot is doing something called DOM manipulation. This means it leverages the [DOM API](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model) to change what is displayed on the page. Specifically, it is loading the data, and then using that data to change what is rendered on the page. 

This is doable with basic javascript, and even in the markdown pages we use for Observable Framework. Below, we will create an HTML element, then using JS, grab and manipulate that element. 

<div id="something-to-manipulate" style="font-style: italic;">This is an HTML element, ready to be manipulated</div>


```js
function changeTheDOM() {
  // grab the element
  const el = document.getElementById("something-to-manipulate")
  
  // change the styling
  el.style.color = "pink"
  el.style.fontWeight = 800
  
  // change the text 
  el.textContent = "You did it!"

  // append new elements
  const childEl = document.createElement("div")
  console.log(childEl)
  childEl.textContent = "Hello, world."
  el.appendChild(childEl)

}

view(Inputs.button("Manipulate the DOM", { value: null, reduce: changeTheDOM }))
```


## d3.js

There is a javascript library that is designed specifically for data visualization use cases, and can help us do _both_ the scaling and the DOM manipulation -- [d3.js](https://d3js.org/what-is-d3). D3 has a ton of helpful methods, some of which we may have already seen, like formatting our numbers, or organizing our data. But the reason it was developed was primarily for creating HTML elements from data.

We will discuss this in future classes, but just as a quick sample, d3 can help us make the scales we built before with its built in methods. We can even make a y scale based on another data element (`bill_depth_mm`).

```js echo
const xDataDomain = d3.extent(penguins.map(d => d.culmen_length_mm))
const d3XScale = d3.scaleLinear()
  .domain(xDataDomain)
  .range([0, width])

const yDataDomain = d3.extent(penguins.map(d => d.culmen_depth_mm))
const d3YScale = d3.scaleLinear()
  .domain(yDataDomain)
  .range([400, 0])
```

Let's try again with our new d3 scale:
```js echo
display(d3XScale(penguins[0].culmen_length_mm))
display(d3XScale(penguins[5].culmen_length_mm))
display(d3XScale(penguins[10].culmen_length_mm))
```

It can also do the DOM manipulation _tied to the data_. It will iterate over the data, add, position, and style the element as per the data scales. With this significant help, we get a lot closer to rendering this visualization in an svg. Here's an example, but don't worry about the methods here -- the idea is that we can create elements in SVG using d3. 

```js
const svg = d3.create('svg')
  .attr("width", width)
  .attr("height", 400)
  
svg.selectAll()
  .data(penguins)
  .join('circle')
  .attr("cx", penguin => d3XScale(penguin.culmen_length_mm))
  .attr("cy", penguin => d3YScale(penguin.culmen_depth_mm))
  .attr("r", 3)
  .attr("fill", penguin => penguin.island === "Dream" ? "#efb118" : penguin.island === "Biscoe" ? "#4269d0" : "#ff725c")

view(svg.node())
```

The looks about correct given the distributions we saw above. We aren't exactly rendering the same plot, but we can get it pretty close. Plot saves us a lot of trouble -- creating the scales, making some style decisions for us, but this is what is happening under the hood. 

# Maps

SVGs are helpful with rendering path style maps. These aren't satellite maps, but just a simple line path to imply geographical area. To do this, we need the geographical data in a certain drawable form.

Most data for maps come in something called shapefiles. Shapefiles are a popular geospatial vector data format for storing the location, shape, and attributes of geographic features. A shapefile is actually a _collection_ of files that work together to describe geographic features like points (cities), lines (roads, rivers), or polygons (countries, lakes, land parcels). These files are primarily used when working with GIS software (mapping, spatial analysis, etc).

GeoJSONs or TopoJSONS, on the other hand, are web-tech friendly files that we can plot in an svg. There are a few steps to get from these map data files to a rendered map: 

1. [optional] Convert the shapefile to geoJSON: If you only have shapefiles, you'll need to convert those to GeoJSON or TopoJSON with something like [mapshaper.org](https://mapshaper.org/).
2. [optional] Use something like [Geo Data Merger](https://funkeinteraktiv.github.io/geo-data-merger/) to add data to the properties of the Geo/TopoJSON file
3. Upload the data (shapefile, GeoJSON, and/or data) to the code base. This looks like the usual `FileAttachments`, in our case:

```js echo
const geo = await FileAttachment('../class_code/unemployment_data/geo.json').json()
display(geo)
 // since the id codes are number that can have a leading zero, we want to keep those as strings and the rates can be numbers
const unemployment = await FileAttachment('../class_code/unemployment_data/us-county-unemployment.csv')
  .csv({ typed: false })
  .then((data) => data.map(d => ({ ...d, rate: +d.rate})))
display(unemployment)
```

4. Use topojson from d3 to convert this topology file into a feature collection we can render in svg:

```js echo
const counties = topojson.feature(geo, geo.objects.counties)
display(counties)
```
5. [optional] If your GeoJSON data doesn't already have the data as part of the properties, you'll need to create a join to add that information. 

```js echo
const unemploymentByID = new Map(unemployment.map(d => [d.id, d.rate]))
```

```js echo
Plot.plot({
  projection: "albers-usa",
  color: {
    type: "quantile",
    n: 9,
    scheme: "blues",
    label: "Unemployment (%)",
    legend: true
  },
  marks: [
    Plot.geo(counties, {
      fill: d => unemploymentByID.get(d.id),
      stroke: "#404040",
      title: (d) => `${d.properties.name} ${unemploymentByID.get(d.id)}%`,
      tip: true
    })
  ]
})
```

The complicated nature of working with maps and joining with data requires a solid understanding of map data, javascript, and d3. If you're hoping to venture into this world for another dataset and map that you have, I recommend reviewing [this tutorial from observable](https://observablehq.com/@observablehq/build-your-first-choropleth-map-with-observable-plot). 

