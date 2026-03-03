# Lab 1: Passing Pollinators

The goals for this tutorial are:

- to learn the basics of importing data and creating a basic dashboard
- to build a few Observable Plot options
- to start iterating with visualizations to answer data questions

The assignment requirements are as follows:

1. Create a dashboard in the `index.md` file that answers all three questions posed in the lab below.
4. Submit your lab via email directly to me (ellie.frymire@gmail.com). Include:
    1. your github repository folder link for this lab, which will look something like `https://github.com/[USERNAME]/Interactive-Data-Vis-Spring2026/tree/main/src/[LAB FOLDER]`.
    2. your [deployed link](#4-set-up-your-github-pages-for-your-deployment), which will look something like `https://[USERNAME].github.io/Interactive-Data-Vis-Spring2026/[LAB FOLDER]/`.

---

# Data Context

The local farm has some new observational data from their plots. They need your help to determine important trends about the bees and the flowers. They are hoping to know more about the three bee species observed, the flowers, and the ideal conditions. Specifically, your dashboard should answer:
  1. What is the body mass and wing span distribution of each pollinator species observed?
  2. What is the ideal weather (conditions, temperature, etc) for pollinating?
  3. Which flower has the most nectar production?

There are other pieces of data available, which could yeild additional interesting trends, but these questions are the most important. The data has been provided in one dataset, and already in the `/data` folder. 

## Pollinator Activity Field Study Dataset

| Column Name | Type | Range/Values | Description |
|-------------|------|--------------|-------------|
| **date** | Date | 2024-06-01 to 2024-06-30 | Calendar date of observation |
| **observation_hour** | Integer | 7-19 | Hour of day (24-hour format, 7am-7pm) |
| **observation_minute** | Integer | 0-59 | Minute within the hour |
| **location** | Categorical | Plot A, B, C, D | Garden plot where observation occurred |
| **temperature** | Numeric | 14-32°C | Air temperature at time of observation |
| **humidity** | Numeric | 30-90% | Relative humidity percentage |
| **wind_speed** | Numeric | 1-19 km/h | Wind speed measured at location |
| **weather_condition** | Categorical | Sunny, Partly Cloudy, Cloudy | General weather conditions |
| **flower_species** | Categorical | Lavender, Sunflower, Coneflower | Flower being observed |
| **nectar_production** | Numeric | 0.3-1.1 μL | Nectar produced per flower (microliters) |
| **pollinator_species** | Categorical | Honeybee, Bumblebee, Carpenter Bee | Bee species observed |
| **pollinator_group** | Categorical | Small Bee, Medium Bee, Large Bee | Size classification of bee |
| **visit_count** | Integer | 1-30+ | Number of visits during observation period |
| **avg_body_mass_g** | Numeric | 0.08-0.54g | Average body mass of observed bees (grams) |
| **avg_wing_span_mm** | Numeric | 15-50mm | Average wing span of observed bees (millimeters) |

