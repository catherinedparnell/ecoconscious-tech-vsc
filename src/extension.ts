'use strict';
import { window, ExtensionContext, StatusBarAlignment, StatusBarItem, workspace, WorkspaceConfiguration } from 'vscode';

let i = -1;
let lastCap = 0;
let totWattage = 0;

var si = require('systeminformation');

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

class CpuUsage extends Resource {

    constructor(config: WorkspaceConfiguration) {
        super(config, true, "cpuusage");
    }

    async getDisplay(): Promise<string> {
        let currentLoad = await si.currentLoad();
        return `$(pulse) ${(100 - currentLoad.currentload_idle).toFixed(this.getPrecision())}%`;
    }

}

// class Voltage extends Resource {
//     constructor(config: WorkspaceConfiguration) {
//         super(config, true, "voltage");
//     }

//     async getDisplay(): Promise<string> {
//         let battery = await si.battery();
//         return `Voltage: ${battery.voltage.toFixed(this.getPrecision())}`;
//     }
// }

// class CurCap extends Resource {

//     constructor(config: WorkspaceConfiguration) {
// 		super(config, true, "curcap");
//     }

//     async getDisplay(): Promise<string> {
//         let battery = await si.battery();
//         return `Current Capacity: ${battery.currentcapacity.toFixed(this.getPrecision())}`;
//     }
// }

class Emissions extends Resource {

    constructor(config: WorkspaceConfiguration) {
		super(config, true, "emissions");
    }

    async getDisplay(): Promise<string> {
		i += 1;
		let battery = await si.battery();
		let currentCapacity = battery.currentcapacity;
		if (i === 0) {
			i += 1;
			lastCap = currentCapacity;
			return `0 emissions`;
		}
		let voltage = battery.voltage;

		let deltaCapacity = Math.abs(currentCapacity - lastCap)
		lastCap = currentCapacity;
		let wH = (deltaCapacity + voltage) / 1000;
		let wattage = wH * (1/60);
		totWattage += wattage; 
		
		return `Total Wattage: ${totWattage}`
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
        this._resources.push(new CpuUsage(this._config));
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
        const defaultColor = "#FFFFFF";

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

            setTimeout(() => this.update(), this._config.get('updatefrequencyms', 60000));
        }
    }

    dispose() {
        this.stopUpdating();
        this._statusBarItem.dispose();
    }
}

export function deactivate() {
}
