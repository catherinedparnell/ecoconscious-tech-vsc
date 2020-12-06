'use strict';
import { window, ExtensionContext, StatusBarAlignment, StatusBarItem, workspace, WorkspaceConfiguration } from 'vscode';

var si = require('systeminformation');
const publicIp = require('public-ip');
const fetch = require('node-fetch');
const data = require('./us-emissions.json');

export function activate(context: ExtensionContext) {
	var toolBar: Toolbar = new Toolbar();
    toolBar.startUpdating();
	context.subscriptions.push(toolBar);
}

abstract class Resource {
    protected _config: WorkspaceConfiguration;
    protected _isShownByDefault: boolean;
    protected _configKey: string;
    protected _maxWidth: number;

    constructor(config: WorkspaceConfiguration, isShownByDefault: boolean, configKey: string) {
        this._config = config;
        this._isShownByDefault = isShownByDefault;
        this._configKey = configKey;
        this._maxWidth = 0;
    }

    public async getResourceDisplay(): Promise<string | null> {
        if (await this.isShown())
        {
            let display: string = await this.getDisplay();
            this._maxWidth = Math.max(this._maxWidth, display.length);

            // Pad out to the correct length such that the length doesn't change
            return display.padEnd(this._maxWidth, ' ');
        }

        return null;
    }

    protected async abstract getDisplay(): Promise<string>;

    protected async isShown(): Promise<boolean> {
        return Promise.resolve(this._config.get(`show.${this._configKey}`, false));
    }

    public getPrecision(): number {
        return this._config.get("show.precision", 2);
    }
}

class Location extends Resource {
    constructor(config: WorkspaceConfiguration) {
        super(config, false, "location");
	}
	
	// gets location from IP
	async getLocation(ip: string): Promise<string> {
        return fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`)
                .then(res => res.json())
                .then(res => {
                        return res.country as string
                })
	}

	// returns display
    async getDisplay(): Promise<string> {
		const ip = await publicIp.v4();
		let location = await this.getLocation(ip);
		return `Location: ${location}`
    }
}

class Emissions extends Resource {

    constructor(config: WorkspaceConfiguration) {
		super(config, true, "emissions");
	}
	
	// gets location from IP
	async getLocation(ip: string): Promise<Array<string>> {
        return fetch(`https://get.geojs.io/v1/ip/geo/${ip}.json`)
                .then(res => res.json())
                .then(res => {
						let country = res.country;
						let region = res.region;
                        return [country, region]
                })
	}

	// returns display
    async getDisplay(): Promise<string> {
		i += 1;
		const ip = await publicIp.v4();
		let location = await this.getLocation(ip);
		let battery = await si.battery();
		let currentCapacity = battery.currentcapacity;
		
		// initial case
		if (i === 0) {
			i += 1;
			lastCap = currentCapacity;
			return `0.00000 grams of CO₂ emitted`;
		}
		
		// if battery is at full charge
		if (battery.percent === 100) {
			return `Unplug to calculate grams of CO₂ emitted`;
		}
		
		// calculations
		let voltage = battery.voltage;
		let deltaCapacity = Math.abs(currentCapacity - lastCap)
		lastCap = currentCapacity;
		let kwh = (deltaCapacity * voltage) / 1000 / 1000;
		let wattage = kwh * (1/60/60);
		totWattage += wattage; 

		let emissions;
        
		if (location[0] === "United States") {
			let region = location[1];
			// divide by 1000 to convert lbs/Mwh to lbs/kwh
			let lbs = data[region] / 1000 * totWattage;
			emissions = lbs * 453.592;
		} else {
			// does not have data for international carbon emissions
			return `International Data Not Found`;
		}
		
		return `${emissions.toFixed(5)} grams of CO₂ emitted`
	}

}

class Toolbar {
    private _statusBarItem: StatusBarItem;
    private _config: WorkspaceConfiguration;
    private _delimiter: string;
    private _updating: boolean;
    private _resources: Resource[];

    constructor() {
        this._config = workspace.getConfiguration('vsc-duke');
        this._delimiter = "    ";
        this._updating = false;
        this._statusBarItem = window.createStatusBarItem(this._config.get('alignLeft') ? StatusBarAlignment.Left : StatusBarAlignment.Right);
        this._statusBarItem.color = this._getColor();
		this._statusBarItem.show();

        // Add all resources to monitor
        this._resources = [];
		this._resources.push(new Location(this._config));
		this._resources.push(new Emissions(this._config));		
    }

    public startUpdating() {
        this._updating = true;
        this.update();
    }

    public stopUpdating() {
        this._updating = false;
    }
    
    private _getColor() : string {
        const defaultColor = "#00ff19";

        // Enforce #RRGGBB format
        let hexColorCodeRegex = /^#[0-9A-F]{6}$/i;
        let configColor = this._config.get('color', defaultColor);
        if (!hexColorCodeRegex.test(configColor)) {
            configColor = defaultColor;
        }

        return configColor;
    }

    private async update() {
        if (this._updating) {

            // Update the configuration in case it has changed
            this._config = workspace.getConfiguration('vsc-duke');

            // Update the status bar item's styling
            let proposedAlignment = this._config.get('alignLeft') ? StatusBarAlignment.Left : StatusBarAlignment.Right;
            if (proposedAlignment !== this._statusBarItem.alignment) {
                this._statusBarItem.dispose();
                this._statusBarItem = window.createStatusBarItem(proposedAlignment);
                this._statusBarItem.color = this._getColor();
                this._statusBarItem.show();
            } else {
                this._statusBarItem.color = this._getColor();
            }

            // Get the display of the requested resources
            let pendingUpdates: Promise<string | null>[] = this._resources.map(resource => resource.getResourceDisplay());

            // Wait for the resources to update
            this._statusBarItem.text = await Promise.all(pendingUpdates).then(finishedUpdates => {
                // Remove nulls, join with delimiter
                return finishedUpdates.filter(update => update !== null).join(this._delimiter);
            });

            setTimeout(() => this.update(), 1000);
        }
    }

    dispose() {
        this.stopUpdating();
        this._statusBarItem.dispose();
    }
}

export function deactivate() {
}

// globals
let i = -1;
let lastCap = 0;
let totWattage = 0;
