---
title: "Libraries and Imports"
toc: true
---

# Libraries

We aren't limited to just Plot within observable markdown files -- we have access to all the libraries that are listed in the observable framework documentation under "libraries" -- and you don't have to import them. This includes libraries like lodash, leaflet, mapbox, and of course, d3.js.

## Mapping libraries

### Leaflet

We have used SVG for making maps with plot and projections in [Faceting and SVGs](./9_faceting_and_svgs), but observable includes other tile based libraries like leaflet and mapbox.

To make this work in observable, we leverage `display` to show an element created via the DOM api (`document.createElement("div")`). We do this all in the same code block for ease -- creating the div, manipulating the style, appending the map to it, and making customizations to the map.

The library is already included, and as per [the documentation](https://observablehq.com/framework/lib/leaflet), can be accessed with the letter `L`.

```js echo
// create a div
const div = display(document.createElement("div"));
// edit the style of this div directly
div.style = "height: 400px;";

// lat / long of CUNY
const cunyLocation = [40.7485, -73.9838];

// create a map with `L` as the leaflet import and `.map` as the method to call
const map = L.map(div).setView(cunyLocation, 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

L.marker(cunyLocation).addTo(map).bindPopup("CUNY Graduate Center").openPopup();
```

There are many more ways to customize a leaflet map, which can be found in the [leaflet documentation](https://leafletjs.com/reference.html).

### Mapbox

Another option is mapbox. Mapbox is a comprehensive paid platform that includes mapping tiles, data, and mapping tools. Leaflet is a simpler, open-source JS library that provides the core functionality for displaying maps in web browsers.

Because mapbox is a paid service, you will need an access code to render something here. You can do so by creating an account with [mapbox](https://www.mapbox.com/).

```js run=false
const div = display(document.createElement("div"));
div.style = "height: 400px;";

const map = new mapboxgl.Map({
  container: div,
  accessToken: ACCESS_TOKEN, // replace with your token, "pk.…"
  center: [2.2932, 48.86069], // starting position [longitude, latitude]
  zoom: 15.1,
  pitch: 62,
  bearing: -20,
});

invalidation.then(() => map.remove());
```

<hr/>

## Imports

Observable framework markdown files also let you organize your code in separate files and import them to render on the page. This could help you structure your dashboard in the sub components -- particularly if you want to use the component more than once.

In the `./components/charts.js` file, I've made two functions that render plots. One with Plot, and one with d3.js. Each one looks a little different, but they both can be used to create something similar:

```js echo
import { plotChart, d3Chart, scatterplot } from "./components/charts.js";
display(penguins);
```

<div style="display: flex; flex-direction: column; gap: 1em;">
  <div>Plot:</div>
  <div>${resize((width) => plotChart(width))}</div>
  <div>D3:</div>
  <div>${resize((width) => d3Chart(width))}</div>
</div>

We can also make significantly more robust charts with d3, particularly as a component in another file, and import it into our dashboards. If we take the penguins data and create a scatterplot in d3, using the data joins we will learn about in the next lesson, we can import that here:

```js
display(
  scatterplot(width, penguins, "culmen_depth_mm", "culmen_length_mm", "island"),
);
```
