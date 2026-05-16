---
title: "Different Charts With d3.js"
toc: true
---

# Simplest data join

The easiest exploration of data to elements is something like a scatterplot because the data and elements have the same number. In the example random data in the [previous lesson](./11_intro_to_d3), we created one circle for every data point. Their position was random, but usually associated with data. Let's expand that example. First, the generator function:  

```js echo
function generateRandomPoints(count = 10, domainMax = 100) {
  const points = [];

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * domainMax) + 1;
    const y = Math.floor(Math.random() * domainMax) + 1;
    points.push({ x, y });
  }

  return points;
}
```

Now let's make some data by invoking the function: 
```js echo
const data = generateRandomPoints();
display(data);
```

Now, let's visualize it in a small chart. This time, I will use d3 to make an svg in every block, rather than selecting and modifying the svg. This is more of a specific pattern to framework and how it works, less so for d3 as a js library in a larger application. If you're using d3 outside of framework, you'll want to follow the select / modify flow of the previous lesson. 

```js echo
  // create an svg with d3, which automatically operates as a selector
  const svg = d3.create("svg")
    .style("border", "1px solid black")
    .attr("width", 100)
    .attr("height", 100)
  // create the circles selection by selecting something that doesn't exist, but matches what we intend to make
  const circles = svg
    // css selector that would match the resulting added nodes
    .selectAll("circle.data-join")
    .data(data)
    // join = create one circle for every data element
    .join("circle")
    .attr("class", "data-join")
    // the x and y should be based on the x and y from the data
    .attr("cx", (d) => d.x)
    .attr("cy", (d) => d.y)
    .attr("r", 3);

  // this next display is observable specific, so it renders in the markdown file
  display(svg.node())
```

10 points, 10 circles. Each circle positioned by its x and y. 

# Adding scales

## Linear scale 

In the above example we don't need to worry about scales because the random data generator only returns x and y values that fit within the svg's width and height. That example is just for simplicity of seeing data --> circles, but we will almost always need scales. 

We've discussed this a bit in [faceting and svgs](./9_faceting_and_svgs.md), but let's apply it within the data join more explicitly. 

Let's keep it simple by just expanding the data from 0 -> 100 to 0 -> 500, but _keep the svg sizing at 100 pixels wide_. Conceptually we can make this jump pretty easily -- its a matter of dividing by 5 to get from data to pixels. We have data that spans all numbers between 0 and 500, but they need to fit in the space of 0 to 100 pixels. The value for 250 is in the middle of our data domain, so it should be right in the middle at 50 pixels. That makes logical sense: `250 / 5 = 50`.

It is almost never that easy, so let's add d3 scales to do this math for us, no matter the data domain and complexity. We will stick with our data generator but expand the domain to 500. 

```js echo
const biggerData = generateRandomPoints(10, 500)
display(biggerData)
```

Now let's plot the same with scales, and annotate one of the circles so we can confirm: 
```js
  const svg = d3.create("svg")
    .style("border", "1px solid black")
    .attr("width", 100)
    .attr("height", 100)
    .style("overflow", "visible")
  
  const scale = d3.scaleLinear()
    .domain([0, 500])
    .range([0, 100])
  
  const circles = svg
    .selectAll("circle.data-join")
    .data(biggerData)
    .join("circle")
    .attr("class", "data-join")
    // apply the scale function when positioning them via x and y
    .attr("cx", (d) => scale(d.x))
    .attr("cy", (d) => scale(d.y))
    .attr("r", 3);

  // find some middle point on the x axis
  const middleData = [...biggerData].sort((a, b) => a.x - b.x)[Math.floor(biggerData.length / 2)]
  
  // add a basic annotation with append
  const annotation = svg
    .append("text")
    .datum(middleData)
    .text(d => `(${d.x}, ${d.y})`)
    .attr("x", d => scale(d.x))
    .attr("y", d => scale(d.y))
    .attr("text-anchor", "middle")
    .attr("dominant-baseline", "middle")
    .attr("dy", 8)
    .style("font-size", 8)

  display(svg.node())
```

## Band scale

Linear scale is the easiest to understand but we can also use something like a band scale (`d3.scaleBand()`), which automatically splits data across the available range into bands. Let's just quickly visualize what band scales look like across a larger width: 


```js echo
const bandData = ["A", "B", "C", "D", "E", "F", "G"]

const svg = d3.create("svg")
    .style("border", "1px solid black")
    .attr("width", 300)
    .attr("height", 100)

const bandScale = d3.scaleBand()
  .domain(bandData)
  .range([0, 300])

// Add rects that are the size of each band
const bands = svg.selectAll(".band-rect")
  .data(bandData)
  .join("rect")
  .attr("class", "band-rect")
  .attr("x", d => bandScale(d))
  .attr("y", 0)
  .attr("width", bandScale.bandwidth())
  .attr("height", 100)
  .attr("fill", (d, i) => i % 2 ? "lightgrey" : "white")

// annotate the rects with the band's domain value
const letters = svg.selectAll(".band-letter")
  .data(bandData)
  .join("text")
  .text(d => d)
  .attr("class", "band-letter")
  .attr("x", d => bandScale(d) + bandScale.bandwidth() / 2)
  .attr("y", 50)
  .style("fill", "grey")
  .style("font-size", "0.8em")
  .attr("text-anchor", "middle")
  .attr("dominant-baseline", "middle")

display(svg.node())
```

We can try this with an actual bar chart now. Let's use the alphabet dataset available to us in the observable universe to explore it: 

```js
Inputs.table(alphabet)
```

We only had a band scale, which helps us size in the x direction. Let's expand this to also size in the y direction with a linear scale. 

```js
const svg = d3.create("svg")
    .style("border", "1px solid black")
    .attr("width", 400)
    .attr("height", 200)
    .attr("overflow", "visible")

const xScale = d3.scaleBand()
  .domain(alphabet.map(d => d.letter))
  .range([0, 400])
  .paddingInner(0.1)

// calculate the min and max of the alphabet dataset
const [min, max] = d3.extent(alphabet.map(d => d.frequency))
const yScale = d3.scaleLinear()
  .domain([min, max])
  .range([180, 0]) // this is conceptually backwards. See the note for more details. 
  .nice()

console.log(alphabet.map(d => xScale(d.letter)))
// Add rects that are the size of each band
const bars = svg.selectAll(".bar")
  .data(alphabet)
  .join("rect")
  .attr("class", "bar")
  .attr("x", d => xScale(d.letter))
  .attr("y", d => 20 + yScale(d.frequency)) // slight padding down
  .attr("width", xScale.bandwidth())
  .attr("height", d => 180 - yScale(d.frequency))
  .attr("fill", "lightgrey")

// annotate the rects with the letter
const letters = svg.selectAll(".letter")
  .data(alphabet)
  .join("text")
  .text(d => d.letter)
  .attr("class", "letter")
  .attr("x", d => xScale(d.letter) + xScale.bandwidth() / 2) // position center of the bar
  .attr("y", d => 20 + yScale(d.frequency)) // slight padding down
  .attr("dy", -3) // bump up a tiny bit
  .style("fill", "grey")
  .style("font-size", "0.8em")
  .attr("text-anchor", "middle")

display(svg.node())
```

<div class="note">
You may notice that the `range` for the `yScale` starts from the height, rather than starting from 0. That's because the SVG origin is in the top left. We respect this when making scales, and the [d3 axis helper](https://d3js.org/d3-axis) methods assume this approach. 
</div>


## Time scale

Lastly, there are time scales (`d3.scaleTime`) for mapping `Date` values to horizontal positions. In this example, each row has a `date` and a count `n`; we plot a dot at that date and value—no fixed bar width. Let's take this a step further: extract helpful constants (width, height, margins) and add axes.

```js echo
const timedata = [
  { date: new Date("2025-06-01"), n: 40 },
  { date: new Date("2025-06-15"), n: 55 },
  { date: new Date("2025-07-01"), n: 35 },
  { date: new Date("2025-07-20"), n: 62 },
];

const width = 400;
const height = 180;
const margin = { top: 12, right: 20, bottom: 32, left: 32 };

const x = d3
  .scaleTime()
  .domain(d3.extent(timedata, (d) => d.date))
  .range([margin.left, width - margin.right])
  .nice();

const y = d3
  .scaleLinear()
  .domain([0, d3.max(timedata, (d) => d.n)])
  .range([height - margin.bottom, margin.top])
  .nice();

const svg = d3
  .create("svg")
  .style("border", "1px solid black")
  .attr("width", width)
  .attr("height", height)
  .attr("font-size", 10);

svg
  .append("g")
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(x).ticks(4));

svg
  .append("g")
  .attr("transform", `translate(${margin.left},0)`)
  .call(d3.axisLeft(y).ticks(4));

svg
  .selectAll("circle")
  .data(timedata)
  .join("circle")
  .attr("cx", (d) => x(d.date))
  .attr("cy", (d) => y(d.n))
  .attr("r", 6)
  .attr("fill", "steelblue");

display(svg.node());
```



# Reducing data into visuals

One visual per data point is not always what we want to visualize, so we need to use d3.js to help us reduce data into the appropriate visual. Let's consider this with lines—we have to go from several points over time to one path element.

Luckily, D3 has helpers to build the SVG elements. Here is some sample line data:

```js echo
const linedata = [
  { date: new Date("2025-06-01"), n: 40 },
  { date: new Date("2025-06-10"), n: 55 },
  { date: new Date("2025-06-15"), n: 55 },
  { date: new Date("2025-07-01"), n: 35 },
  { date: new Date("2025-07-04"), n: 62 },
];
```

```js
const width = 400;
const height = 180;
const margin = { top: 12, right: 20, bottom: 32, left: 32 };

const x = d3
  .scaleTime()
  .domain(d3.extent(linedata, (d) => d.date))
  .range([margin.left, width - margin.right])
  .nice();

// linedata.map(d => console.log(x))

const y = d3
  .scaleLinear()
  .domain([0, d3.max(linedata, (d) => d.n)])
  .range([height - margin.bottom, margin.top])
  .nice();

// This is where we translate from data to path—a helper to compute the path's `d` attribute.
const pathFn = d3.line()
  // this is where we scale it for both x and y—the path should be created in pixel coordinates
  .x(d => x(d.date))
  .y(d => y(d.n))

const svg = d3
  .create("svg")
  .style("border", "1px solid black")
  .attr("width", width)
  .attr("height", height)
  .attr("font-size", 10);

svg.selectAll(".line")
  .data([linedata])
  .join("path")
  .attr("class", "line")
  .attr("d", d => pathFn(d))
  .attr("stroke", "black")
  .attr("fill", "none")

svg
  .append("g")
  .attr("transform", `translate(0,${height - margin.bottom})`)
  .call(d3.axisBottom(x).ticks(4));

svg
  .append("g")
  .attr("transform", `translate(${margin.left},0)`)
  .call(d3.axisLeft(y).ticks(4));

display(svg.node())
```