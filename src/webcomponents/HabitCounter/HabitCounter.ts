// import { DBService } from "../../DBService";
import { RemoteDBService } from "src/RemoteDBService";
import { HabitDataService } from "../services/HabitDataService";
import { applyHabitCounterStyles } from "./styles/applyHabitCounterStyles";
import { buildHabitCounterDOM } from "./dom/buildHabitCounterDOM";
import { createDecrementHandler, createIncrementHandler } from "./eventHandlers/clickHandlers";
import { loadHabitData } from "./data/loadHabitData";
import { updateHabitData } from "./data/updateHabitData";
import {
    updateDisplayValue,
    updateStaticUI,
    setComponentErrorState,
    clearComponentErrorState,
    HabitCounterUIElements
} from "./dom/uiUpdaters";
import { DATE_CHANGED_EVENT_NAME, } from "../../pluginState";

//? Main Web Component class, acts as an orchestrator.
export class HabitCounter extends HTMLElement {
    // --- State ---
    public habitKey: string = ""; //? Make public if needed by handlers/helpers
    public initialDate: string = "";
    public emoji: string = "";
    public table: string = "";
    public habitIdCol: string = "";
    public valueCol: string = "";
    public dateCol: string = "";
    public currentValue: number = 0;
    private _initialLoadTriggered: boolean = false;
    private _isInitialized: boolean = false;

    // --- Dependencies ---
    public habitDataService: HabitDataService | null = null; //? Public for helpers

    // --- Shadow DOM Element References ---
    //? Store the object returned by the builder
    private uiElements: HabitCounterUIElements

    private _isListeningForDateChanges: boolean = false; // Prevent multiple listeners

    // --- Lifecycle ---
    connectedCallback() {
        if (this._isInitialized) return;

        //~ Create handlers bound to this instance *before* building DOM
        const handlers = {
            handleDecrement: createDecrementHandler(this),
            handleIncrement: createIncrementHandler(this),
        };

        this.uiElements = buildHabitCounterDOM(this.attachShadow({ mode: "open" }), handlers); //~ Build DOM via helper
        applyHabitCounterStyles(this.shadowRoot!); //~ Apply styles via helper
        this._setupDateChangeListener(); //^ Call setup listener
        this._isInitialized = true;
    }

    disconnectedCallback() {
        document.removeEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
        this._isListeningForDateChanges = false;
    }

    // --- Public Methods ---
    public setDbService(service: RemoteDBService): void {
        if (!service) {
            console.error("[HabitCounter Component] Invalid DBService provided.");
            this.showErrorState("Setup Error"); //~ Use helper
            return;
        }
        try {
            this.habitDataService = new HabitDataService(service); //~ Initialize service dependency
        } catch (error) {
            console.error("[HabitCounter Component] Failed to initialize HabitDataService:", error);
            this.showErrorState("Setup Error");
            return;
        }
        this._readAttributesAndInitLoad(); //~ Trigger attribute reading and loading
    }

    // --- Internal Orchestration ---
    private _readAttributesAndInitLoad(): void {
        this.habitKey = this.getAttribute("habit") ?? "";
        this.initialDate = this.getAttribute("date") ?? "@date";
        this.emoji = this.getAttribute("emoji") ?? "❓";
        this.table = this.getAttribute("table") ?? "";
        this.habitIdCol = this.getAttribute("data-habit-id-col") ?? "";
        this.valueCol = this.getAttribute("data-value-col") ?? "";
        this.dateCol = this.getAttribute("data-date-col") ?? "";

        // --- Defer UI update and load trigger slightly ---
        requestAnimationFrame(() => {
            updateStaticUI(this.uiElements, this.emoji, this.habitKey); //~ Update static parts of UI

            if (!this.table || !this.habitKey || !this.habitIdCol || !this.valueCol || !this.dateCol) {
                console.warn(`[HabitCounter Component ${this.habitKey}] Missing one or more required attributes: table, habit, data-habit-id-col, data-value-col, data-date-col.`);
                this.showErrorState("Config Error");
                updateStaticUI(this.uiElements, this.emoji, this.habitKey || "Config Error");
                return; // Stop initialization if config is bad
            }

            if (!this._initialLoadTriggered) {
                this._initialLoadTriggered = true;
                loadHabitData(this).catch(err => console.error("Unhandled error during initial load:", err)); //~ Load data via helper
            } else {
                console.log(`[HabitCounter Component ${this.habitKey}] Initial load already triggered.`);
            }
        });
    }

    private _setupDateChangeListener(): void {
        //? Only add listener if component uses dynamic date and not already listening
        if (this.getAttribute("date") === "@date" && !this._isListeningForDateChanges) {
            document.addEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
            this._isListeningForDateChanges = true;
        } else {
            //& console.log(`[HabitCounter Component ${this.habitKey}] Not adding listener (date=${this.getAttribute("date")}, listening=${this._isListeningForDateChanges})`);
        }
    }

    private _handleGlobalDateChange = (event: Event): void => {
        //? Type guard for CustomEvent
        if (!(event instanceof CustomEvent)) return;

        const newIsoDate = event.detail?.newIsoDate;

        //? Double-check this component should react (uses @date)
        if (this.initialDate === "@date") {

            //? Reload data using the same helper
            loadHabitData(this).catch(err => {
                console.error(`[HabitCounter Component ${this.habitKey}] Error reloading data after date change:`, err);
            });
        }
    };

    //? Public method called by click handlers via instance reference
    public async _updateData(delta: number): Promise<void> {
       await updateHabitData(this, delta); //~ Update data via helper
    }

    //? Public method called by data helpers to update display
    public _updateDisplay(newValue: number): void {
        this.currentValue = newValue; //? Update internal state first
        updateDisplayValue(this.uiElements, newValue); //~ Update DOM via helper
        this.clearErrorState(); //? Clear errors on successful update
    }

    //? Public methods for UI state helpers
    public showErrorState(message?: string): void {
        setComponentErrorState(this.uiElements, message); //~ Set error via helper
    }

    public clearErrorState(): void {
        clearComponentErrorState(this.uiElements); //~ Clear error via helper
    }
}

// --- Custom Element Definition ---
if (!customElements.get("habit-counter")) {
    customElements.define("habit-counter", HabitCounter);
}