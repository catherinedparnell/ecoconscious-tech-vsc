# Welcome to EcoConscious Tech's Vscode Extension

A VSCode extension built to keep us developers mindful of our environmental impact.

## Features

Calculates and displays estimated cumulative carbon emissions in the toolbar since the launch of the extension in your project.

## Calculations

We considered two main components when calculating emissions. First, power consumed, and second, the coefficient of how much carbon is produced for power consumed. Due to limitations in garnering wattage from power producing entities like CPU, GPU, and DRAM, we chose to estimate expenditure of power based on a formula using the change in capacity and voltage per second of the laptop battery. Then, we found location-based energy mix data from the [U.S. Environmental Protection Agency eGRID](https://www.epa.gov/egrid) to obtain the lbs of carbon dioxide produced per kilowatt hour in each US state for the year 2016, and were able to fetch users locations with their IP address using the [GeoJS API](https://www.geojs.io/).

Using the two values, we calculated the estimated carbon emissions per second and converted it to cumulated grams, and it is displayed in the toolbar. Now you can code and see an estimation of your real-time environmental impact.

## Extension Settings

This extension contributes the following settings:

* `vsc-duke.emissions`: Show your cumulative grams of carbon emissions
* `vsc-duke.location`: Show your current location
* `vsc-duke.alignLeft`: Toggle alignment of toolbar

## Known Issues

* Data is only available for those located in the United States, so emissions can only be calculated for those located within the United States.
* Our calculations are only an estimation! They are estimated based off of the current capacity of the battery, therefore if battery is at 100% calculations cannot be accurately computed. Furthermore, it would be more accurate to compute using CPU and GPU, resources that are currently unavailable to us for access. We are working on creating a better, more efficient and more accurate way to calculate power expenditure.

## Release Notes

### 1.0.0

Initial release

## Acknowledgements

Special thanks to inspiration from the [Green Web Foundation](https://www.thegreenwebfoundation.org/green-web-datasets/) and their many green web conservation efforts. Inspiration also came from this academic work: [Energy and Policy Considerations for Deep Learning in NLP](https://arxiv.org/pdf/1906.02243.pdf).

Our Experience at HackDuke
-------------------------------------------------
We built this extension as a part of the HackDuke Code for Good Hackathon in the Energy & Environment track. It is part of a broader project, focused on informing and educating developers and internet users alike on the environmental impact of their technological pursuits. Check out our project [website](http://ecoconscioustech.surge.sh/) and partnering [Chrome extension](https://github.com/catherinedparnell/ecoconscious-tech-chrome).
