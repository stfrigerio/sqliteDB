import { App } from "obsidian";
import { PluginState } from "src/pluginState";
import { DateNavigatorOptions, DateNavigatorDOMElements, NavigationPeriod } from "./dateNavigator.types";
import { createPrevHandler, createNextHandler, createOpenModalHandler } from "./eventHandlers/dateNavigationHandlers";
import { buildDateNavigatorDOM, updateDateNavigatorDisplay } from "./dom/buildDateNavigatorDOM";
import { DATE_CHANGED_EVENT_NAME } from "../../pluginState";
import { createPeriodChangeHandler } from "./eventHandlers/periodChangeHandler";

/**
 * Creates and manages the interactive Date Navigator header.
 * Uses pluginState to get/set the current date.
 * Updates its display when the date changes.
 */
export class DateNavigator {
    private app: App;
    private pluginState: PluginState;
    private containerEl: HTMLElement;
    private configPeriod: NavigationPeriod;
    private elements: DateNavigatorDOMElements | null = null;
    private isListening: boolean = false;

    constructor(options: DateNavigatorOptions) {
        this.app = options.app;
        this.pluginState = options.pluginState;
        this.containerEl = options.containerEl;
        this.configPeriod = options.period ?? 'day';

        if (!this.app || !this.pluginState || !this.containerEl) {
            throw new Error("DateNavigator missing required options (app, pluginState, containerEl).");
        }

        //? Set the global state's period to match this instance *on initialization*.
        //? This means the last rendered navigator sets the global period.
        if (this.pluginState.currentPeriod !== this.configPeriod) {
            //? Note: This immediately changes global state and triggers event/recalc
            this.pluginState.currentPeriod = this.configPeriod;
        }

        //? Now build the UI using the synchronized (or initially matching) state
        this._buildUI();
        this._setupStateListener();
    }

    /** Builds the initial UI */
    private _buildUI(): void {
        const currentGlobalPeriod = this.pluginState.currentPeriod;
        const currentSelectedDate = this.pluginState.selectedDate;

        //~ Create bound handlers first
        const handlers = {
            handlePrev: createPrevHandler(this.pluginState, this.app),
            handleNext: createNextHandler(this.pluginState, this.app),
            handleOpenModal: createOpenModalHandler(this.pluginState, this.app),
            handlePeriodChange: createPeriodChangeHandler(this.pluginState),
        };
        //~ Build DOM and store element references
        this.elements = buildDateNavigatorDOM(
            this.containerEl,
            currentSelectedDate,
            currentGlobalPeriod,
            handlers
        );
    }

    /** Updates the displayed date. Bound method for callbacks. */
    private _updateDisplay = (): void => {
        const currentIsoDate = this.pluginState.selectedDate;
        const currentPeriod = this.pluginState.currentPeriod;

        updateDateNavigatorDisplay(this.elements, currentIsoDate, currentPeriod);
    };

    /** Listen for the custom date change event from pluginState */
    private _setupStateListener(): void {
        if (this.isListening) return;
        document.addEventListener(DATE_CHANGED_EVENT_NAME, this._updateDisplay);
        this.isListening = true;
    }

    /** Cleans up the component (e.g., remove listeners, clear container) */
    public destroy(): void {
        this.containerEl.empty();
        this.elements = null;
    }
}