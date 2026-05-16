// this time, we _do_ have to import plot and d3, because we aren't in the observable markdown file that includes these libraries by default.
import * as Plot from "npm:@observablehq/plot";
import * as d3 from "npm:d3";

export function plotChart(width) {
  return Plot.plot({
    width,
    marks: [
      Plot.frame(),
      Plot.text(["Hello, world!"], {
        frameAnchor: "middle",
      }),
    ],
  });
}

export function d3Chart(width) {
  const svg = d3
    .create("svg")
    .attr("width", width)
    .attr("height", 100)
    .style("border-style", "solid");

  svg
    .append("text")
    .text("Hello, world!")
    .attr("x", width / 2)
    .attr("y", 50)
    .attr("text-anchor", "middle");

  return svg.node();
}

export function scatterplot(width, data, x, y, color) {
  console.log("scatterplot called");
  console.log("scatterplot with data:", data);

  // Set up margins for axes
  const margin = { top: 20, right: 30, bottom: 40, left: 50 };
  const height = 300;
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((d) => d[x])))
    .range([0, innerWidth]);

  const yScale = d3
    .scaleLinear()
    .domain(d3.extent(data.map((d) => d[y])))
    .range([innerHeight, 0]); // Flip y axis so smaller values are at bottom

  const colorScale = d3
    .scaleOrdinal()
    .domain(data.map((d) => d[color]))
    .range(d3.schemeTableau10);

  const svg = d3.create("svg").attr("width", width).attr("height", height);

  // Create a group for the chart content
  const g = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add x axis
  g.append("g")
    .attr("transform", `translate(0,${innerHeight})`)
    .call(d3.axisBottom(xScale))
    .append("text")
    .attr("x", innerWidth / 2)
    .attr("y", 35)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    // obviously this is hard coded, so it would still render if we changed the x variable, but its a helpful example of how to make axis text appear.
    .text("Culmen Depth (mm)");

  // Add y axis
  g.append("g")
    .call(d3.axisLeft(yScale))
    .append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -35)
    .attr("x", -innerHeight / 2)
    .attr("fill", "black")
    .style("text-anchor", "middle")
    // same here -- hard coded, and would still render if we changed the y variable.
    .text("Culmen Length (mm)");

  // Add circles
  g.selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => xScale(d[x]))
    .attr("cy", (d) => yScale(d[y]))
    .attr("r", 3)
    .attr("fill", (d) => colorScale(d[color]));

  return svg.node();
}
