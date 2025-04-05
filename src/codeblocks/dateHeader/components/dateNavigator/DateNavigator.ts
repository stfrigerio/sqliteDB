import { App } from "obsidian";
import { PluginState } from "src/pluginState";
import { DateNavigatorOptions, DateNavigatorDOMElements, NavigationPeriod } from "./dateNavigator.types";
import { createPrevHandler, createNextHandler, createOpenModalHandler } from "./eventHandlers/dateNavigationHandlers";
import { buildDateNavigatorDOM, updateDateNavigatorDisplay } from "./dom/buildDateNavigatorDOM";

/**
 * Creates and manages the interactive Date Navigator header.
 * Uses pluginState to get/set the current date.
 * Updates its display when the date changes.
 */
export class DateNavigator {
    private app: App;
    private pluginState: PluginState;
    private containerEl: HTMLElement;
    private period: NavigationPeriod;
    private elements: DateNavigatorDOMElements | null = null;

    constructor(options: DateNavigatorOptions) {
        this.app = options.app;
        this.pluginState = options.pluginState;
        this.containerEl = options.containerEl;
        this.period = options.period ?? 'day'; // Default to day navigation

        if (!this.app || !this.pluginState || !this.containerEl) {
            throw new Error("DateNavigator missing required options (app, pluginState, containerEl).");
        }

        this._buildUI();
    }

    /** Builds the initial UI */
    private _buildUI(): void {
        //~ Create bound handlers first
        const handlers = {
            handlePrev: createPrevHandler(this.pluginState, this.period, this.app, this._updateDisplay),
            handleNext: createNextHandler(this.pluginState, this.period, this.app, this._updateDisplay),
            handleOpenModal: createOpenModalHandler(this.pluginState, this.app, this._updateDisplay),
        };
        //~ Build DOM and store element references
        this.elements = buildDateNavigatorDOM(this.containerEl, this.pluginState.selectedDate, handlers);
    }

    /** Updates the displayed date. Bound method for callbacks. */
    private _updateDisplay = (newIsoDate: string): void => {
        if (this.elements?.dateDisplay) {
            updateDateNavigatorDisplay(this.elements.dateDisplay, newIsoDate);
        } else {
            console.error("[DateNavigator] Cannot update display, dateDisplay element reference is missing.");
        }
    };

    /** Cleans up the component (e.g., remove listeners, clear container) */
    public destroy(): void {
        this.containerEl.empty();
        this.elements = null;
    }
}