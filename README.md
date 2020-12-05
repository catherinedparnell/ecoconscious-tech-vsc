# vsc-duke README

A VSCode extension built to keep us developers mindful of our environmental impact.

## Features

Calculates and displays estimated cumulative carbon emissions in grams based off of computer use since launching the extension in your project.

## Calculations
We used location-based energy mix data to obtain the lbs of carbon dioxide produced per kilowatt hour in each US state (region). We used the change in capacity and voltage per second of the laptop of battery in order to calculate an estimated expenditure of power. Using the two values, we calculated the estimated carbon emissions and converted to
grams.

## Extension Settings

This extension contributes the following settings:

* `vsc-duke.emissions`: Show your cumulative grams of carbon emissions
* `vsc-duke.location`: Shows your current location
* `vsc-duke.alignLeft`: Toggles alignment of toolbar

## Known Issues

* Data is only available for those located in the United States, so emissions can only be calculated for those located within the United States.
* Our calculations are only an estimation! They are estimated based off of the current capacity of the battery, therefore if battery is at 100% calculations cannot be accurately computed. Furthermore, it would be more accurate to compute using CPU and GPU, resources that are currently unavailable to us for access. We are working on creating a better, more efficient and more accurate way to calculate power expenditure.

## Release Notes

### 1.0.0

Initial release

Our Experience at HackDuke
-------------------------------------------------
We built this extension as a part of the HackDuke Code for Good Hackathon in the Energy & Environment track. It is part of a broader project, focused to informing and educating developers on the environmental impact of their technological pursuits. Stay tuned for our website and partnering Chrome Extension.
