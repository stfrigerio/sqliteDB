export const DATE_CHANGED_EVENT_NAME = 'plugin-date-changed';

export class PluginState {
    private _selectedDate: string;

    constructor() {
        this._selectedDate = new Date().toISOString().split("T")[0];
    }

    get selectedDate(): string {
        return this._selectedDate;
    }

    set selectedDate(newIsoDate: string) {
        if (this._selectedDate !== newIsoDate) {
            this._selectedDate = newIsoDate;
            document.dispatchEvent(new CustomEvent(DATE_CHANGED_EVENT_NAME, {
                detail: { newIsoDate: this._selectedDate } // Pass the new date
            }));
        } else {
            //& console.log(`[PluginState] Date unchanged: ${newIsoDate}`);
        }
    }
}

export const pluginState = new PluginState();