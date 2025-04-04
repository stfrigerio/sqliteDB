export class PluginState {
	private _selectedDate: string;

	constructor() {
		this._selectedDate = new Date().toISOString().split("T")[0];
	}

	get selectedDate(): string {
		return this._selectedDate;
	}

	set selectedDate(newDate: string) {
		this._selectedDate = newDate;
	}
}

export const pluginState = new PluginState();
