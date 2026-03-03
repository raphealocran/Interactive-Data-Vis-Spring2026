---
title: "Intro to Observable Framework"
toc: true
---

# Intro to Observable Framework

---

## What is Observable Framework?
**Observable Framework** is an open-source **static-site generator** specifically designed for building high-performance data apps, dashboards, and reports. Unlike traditional notebooks, it allows you to develop locally on your own machine using your preferred text editor and version control systems like Git.

Observable framework is a lot of things, but specifically for our class, it is: 
*   **A local development server:** Used to preview your apps with instant "hot reloading" updates as you save changes. That means you can make code changes, see them update live, without having to spin up a server through other means. 
*   **A static site generator:** Compiles Markdown, JavaScript, and other assets into a static site that can be hosted anywhere. This is how GitHub takes your code in whatever form (including `.md`) and makes it readable for browsers (`.html`, `.js`, etc)

### Project Structure
In this course, all content lives under **`src/`**. The structure of lessons and labs is as follows:
*   **`src/index.md`**: The home page of the app.
*   **`src/lessons/`**: Lesson pages (e.g. `1_intro_to_web_development.md`, `3_intro_to_observable_framework.md`).
*   **`src/lab_0/`, `src/lab_1/`, …**: Each lab has a **`readme.md`** (instructions) and an **`index.md`** (your dashboard). You do your lab work in each lab’s `index.md`.
*   **Data files**: Static data such as `.csv` or `.json` live in the lab folders (e.g. `lab_1/data/pollinator_activity_data.csv`). You load them with `FileAttachment()` in your `index.md`.
*   **`observablehq.config.js`** (at the project root): Configures the app title, theme, and—importantly—the **sidebar**. The `pages` array defines the order and grouping of Lessons and Labs (Instructions vs. Dashboard) that you see in the nav.

## Layouts, Elements, and Inputs

There are several options already available to us in observable framework that we could use for dashboard styling. We can always just include text between js blocks, like we do for most of this file and other class example files, or we can get more fancy, and use some of the built in styling that is outlined in the [markdown page](https://observablehq.com/framework/markdown) of Observable Framework documentation. Out of the box, we have:

### Cards

<div class="card">
This is content inside of a card, which is styled simply by putting the <span class="code">class="card"</span> in the HTML div element opening tag. You'll notice that this document doesn't include any "card" class definition or styling— it is out of the box dashboard element from Observable Framework.
</div>

### Grids

You can also make [grids](https://observablehq.com/framework/markdown#grids) that include cards, text, or even plots inside of them: 

<div class="grid grid-cols-4">
  <div class="card"><span>A</span></div>
  <div class="card"><span>B</span></div>
  <div class="card"><span>C</span></div>
  <div class="card"><span>D</span></div>
</div>

The grids are automatically responsive to page width, so in the case of the above grid, it's a 4-column grid that (likely, on your screen) has auto-resized to be two columns of two rows. If you expand the browser full screen and collapse the left-hand navigation, it should turn into four columns.

You can also be more specific with your grid style, and incorporate it into the dashboard. Something like this leverages a few things we haven't seen yet, but organizes it in the grid structure. 

<div class="grid grid-cols-2">
  <!-- first column -->
  <div class="card">
    <!-- use inline JS here, which does change the syntax highlighting (colors) -->
    ${Plot.plot({
      title: "Histogram of olympian weights",
      width: 400,
      height: 350,
      y: { grid: true },
      marks: [
        Plot.rectY(olympians, Plot.binX({ y: "count" }, { x: "weight" })),
        Plot.ruleY([0])
      ]
    })}
  </div>
  <!-- second column -->
  <div>
    <i>You may recall, this table is one that we used to bin the olympian weights into a histogram.</i>
    <div class="card" style="padding: 0;">
      ${Inputs.table(olympians)}
    </div>
  </div>
</div>

<div class="tip">
  <a href="https://observablehq.com/framework/markdown#cards">Observable recommends</a> that you remove the padding on <span class="code">Inputs.table</span> inside of cards. 
  <!-- Also, notice that inside of a tip, we can't use markdown to make that link in the previous sentence? 
  We have to use an <a> tag since we are already in HTML.  -->
</div>


### Interactive Inputs
To make data apps truly interactive, Framework provides **Inputs**—graphical UI elements like **dropdowns, sliders, radio buttons, and text boxes**. 

You can add a dropdown that provides options for the user to select or change: 

```js echo
const color = view(Inputs.select([
  "steelblue", "pink", "orange", "green"
], {value: "steelblue", label: "Favorite color"}));
```

Or maybe a radio button so the options are always displayed: 

```js echo
const radioColor = view(Inputs.radio(["red", "green", "blue"], {label: "color"}));
```

Or a text input: 

```js echo
const name = view(
  Inputs.text({
    label: "Name",
    placeholder: "Enter your name",
    value: "Anonymous"
  })
);
```

Inputs are typically displayed using the built-in `view` function. Because they are tied into the reactive system, choosing a value from an input (like filtering a table by selecting a category from a dropdown) will automatically trigger updates in every other part of the page that depends on that selection.

**Note**: Searching "observable inputs" may send you to observable HQ inputs -- be sure to go to the [framework documentation](https://observablehq.com/framework/inputs/) directly for details on inputs. 

<hr/>

## JavaScript and Reactivity
One of the most powerful features of Observable Framework is how it handles **JavaScript** within Markdown files. JavaScript can be included in two ways:

1.  **Fenced code blocks**: Use ` ```js ` blocks for top-level declarations like loading data or defining helper functions. These fenced code blocks have been leveraged throughout the markdown version of this file. By including three back ticks (` ``` `), you're telling the compiler that the content between each set of three back ticks is code. By adding the "js" (` ```js `), you're telling your compiler _and_ your IDE that it is javascript, and to assume as such with syntax highlighting. 


2.  **Inline expressions**: You can also use `${...}` to interpolate JavaScript values directly into your text or HTML. This means you can create expressions that can include variables. For example, your favorite color from the above dropdown is currently ${color}! (referenced with: `${color}`)

**Reactivity** is the engine that drives these pages. The framework runs like a **spreadsheet**: when a variable is updated, any code that references that variable automatically re-runs. Because of this reactive nature, code runs independent of its order on the page, giving you complete flexibility in how you arrange your content.

The value of this is that you can have an input that changes something somewhere else in your dashboard. This may seem trivial, but this "state management" can be _very_ complex in standard web apps. Framework makes it easy so we can focus on the visualization rather than the web application pipes. 

Let's try an example: 

```js echo
const text = view(
  Inputs.text({
    label: "Reactive text:",
    placeholder: "Enter some text",
  })
);
```

<div class="code">The text you have entered is: ${text}</div>

You can even bring this into visualizations, which will matter more later. This doesn't make much sense right now, but you can see that as you type text into the input above, it makes a bar chart in which the x and y values are simply the index of the letter: 

```js echo 
Plot.plot({
  marks: [
    Plot.frame(),
    Plot.barY(text, {
      x: (d, i) => i,
      y: (d, i) => i
    })
  ]
})
```

<hr/>


## Styles and CSS

You can also stylize your dashboards, and there is more than one way to include styles in your markdown files.

Since the markdown supports native html, you can include a style block anywhere in your file, to style specific classes or elements. The block below styles elements that use the `"code"` class (and here: <span class="code">this is code styled</span>)

```html echo
<style>
  .code {
    font-family: monospace;
    color: #A935D4;
    font-size: 0.8rem;
    font-weight: 800;
  }
</style>
```

<div class="tip">
  You may have noticed the code for this note includes `echo` after the code blocks. This allows you to see the code in the rendered display, without repeating the code block twice:
  <div style="display: flex; flex-direction: column">
    <span class="code">
      ```html echo
    </span>
    <span class="code">
      ```js echo
    </span>
  </div>
</div>

You can also pass style inline to your elements, but it might get messy if the style is too long. 
<div style="padding: 10px; background: rgba(255, 192, 203, 0.5); background-opacity: 0.2; border-radius: 4px">
  🐴 Pink pony club in here ✨ 
</div>
<br>

#### Still not satisfied? 
If you're hoping to get even fancier for your work outside of these solutions, you can play with the available [observable themes](https://observablehq.com/framework/themes), and even bring those colors into your charts with css variables (`stroke: "var(--theme-foreground-focus)"`). To get even crazier, you can [make your own stylesheet](https://observablehq.com/framework/config#style) that will bring whatever color variables you need into your markdown file and make them available for use. 

<hr/>
