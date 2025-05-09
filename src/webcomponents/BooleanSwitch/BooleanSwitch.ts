import { DBService } from "../../DBService";
import { BooleanSwitchDataService } from "../services/BooleanDataService";
import { applyBooleanSwitchStyles } from "./styles/applyBooleanSwitchStyles";
import { buildBooleanSwitchDOM, BooleanSwitchUIElements } from "./dom/buildBooleanSwitchDOM";
import { createChangeHandler } from "./eventHandlers/changeHandler";
import { loadBooleanValue } from "./data/loadBooleanValue";
import { upsertBooleanValue } from "./data/upsertBooleanValue";
import {
    updateSwitchState, updateStaticBooleanUI, setBooleanSwitchErrorState,
    clearBooleanSwitchErrorState
} from "./dom/booleanSwitchUiUpdaters";
import { DATE_CHANGED_EVENT_NAME } from "../../pluginState";

//? Unique ID counter for label/input association
let switchCounter = 0;

//? Web component for a boolean (0/1) toggle switch linked to database state.
export class BooleanSwitch extends HTMLElement {
    // --- State ---
    public habitKey: string = "";
    public initialDate: string = "";
    public emoji: string = "";
    public table: string = "";
    public currentValue: 0 | 1 = 0; // Default state is 'off' (0)
    private _initialLoadTriggered: boolean = false;
    private _isInitialized: boolean = false;
    public habitIdCol: string = "";
    public valueCol: string = ""; // Column name for 'value' (0/1)
    public dateCol: string = "";

    // --- Dependencies ---
    //? Renamed service property for clarity
    public booleanDataService: BooleanSwitchDataService | null = null;

    // --- Shadow DOM Elements ---
    private uiElements!: BooleanSwitchUIElements;

    private _isListeningForDateChanges: boolean = false; // Prevent multiple listeners

    // --- Instance specific ID ---
    private uniqueId: string;

    constructor() {
        super();
        this.uniqueId = `bs-${switchCounter++}`; // Assign unique ID
    }

    connectedCallback() {
        if (this._isInitialized) return;

        //~ Create bound event handler
        const changeHandler = createChangeHandler(this);

        this.uiElements = buildBooleanSwitchDOM(this.attachShadow({ mode: "open" }), this.uniqueId, changeHandler);
        applyBooleanSwitchStyles(this.shadowRoot!);
        this._isInitialized = true;
    }

    disconnectedCallback() {
        if (this._isListeningForDateChanges) {
            document.removeEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
            this._isListeningForDateChanges = false;
        }
    }

    //? Inject DBService and trigger attribute reading/initial load
    public setDbService(service: DBService): void {
        if (!service) { /* ... error handling ... */ this.showErrorState("Setup Error"); return; }
        try {
            this.booleanDataService = new BooleanSwitchDataService(service);
        } catch (error) { /* ... error handling ... */ this.showErrorState("Setup Error"); return; }
        this._readAttributesAndInitLoad();
    }

    private _readAttributesAndInitLoad(): void {
        // --- Read ALL attributes ---
        this.habitKey = this.getAttribute("data-key") ?? "";
        this.initialDate = this.getAttribute("data-date") ?? "@date";
        this.emoji = this.getAttribute("data-emoji") ?? "❓";
        this.table = this.getAttribute("data-table") ?? "";
        this.habitIdCol = this.getAttribute("data-key-id-col") ?? "";
        this.valueCol = this.getAttribute("data-value-col") ?? "";
        this.dateCol = this.getAttribute("data-date-col") ?? "";

        this._setupDateChangeListener();

        requestAnimationFrame(() => {
            updateStaticBooleanUI(this.uiElements, this.emoji, this.habitKey); //~ Update static parts of UI

            if (!this.table || !this.habitKey || !this.habitIdCol || !this.valueCol || !this.dateCol) {
                console.warn(`[HabitCounter Component ${this.habitKey}] Missing one or more required attributes: table, habit, data-habit-id-col, data-value-col, data-date-col.`);
                this.showErrorState("Config Error");
                updateStaticBooleanUI(this.uiElements, this.emoji, this.habitKey || "Config Error");
                return; // Stop initialization if config is bad
            }

            if (!this._initialLoadTriggered) {
                this._initialLoadTriggered = true;
                loadBooleanValue(this).catch(err => console.error("Unhandled error during initial load:", err)); //~ Load data via helper
            } else {
                console.log(`[BooleanSwitch Component ${this.habitKey}] Initial load already triggered.`);
            }
        });
    }

    private _setupDateChangeListener(): void {    
        //? Only add listener if component uses dynamic date and not already listening
        if (this.initialDate === "@date" && !this._isListeningForDateChanges) {
            document.addEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
            this._isListeningForDateChanges = true;
        } else {
            //& console.log(`[BooleanSwitch ${this.habitKey}] Not adding listener (date=${this.initialDate}, listening=${this._isListeningForDateChanges})`);
        }
    }

    // Inside BooleanSwitch class
    private _handleGlobalDateChange = (event: Event): void => {
        //? Type guard for CustomEvent
        if (!(event instanceof CustomEvent)) {
            console.log(`[BooleanSwitch ${this.habitKey}] Event was not CustomEvent.`);
            return;
        }

        const newIsoDate = event.detail?.newIsoDate;

        //? Double-check this component should react (uses @date)
        if (this.initialDate === "@date") {
            loadBooleanValue(this)
                .catch(err => {
                    console.error(`[BooleanSwitch ${this.habitKey}] Error reloading data after date change:`, err);
                })
        } else {
            //& console.log(`[BooleanSwitch ${this.habitKey}] Ignoring date change event (date=${this.initialDate}).`);
        }
    };

    //? Public method called by change handler to trigger DB update
    public async _updateData(): Promise<void> {
        await upsertBooleanValue(this);
    }

    //? Public method called by data helpers to update display state
    public _updateDisplay(newValue: 0 | 1): void {
        this.currentValue = newValue;
        updateSwitchState(this.uiElements, newValue === 1);
        this.clearErrorState();
        this._enableSwitch();
    }

    //? Public methods for UI state helpers
    public showErrorState(message?: string): void {
        setBooleanSwitchErrorState(this, this.uiElements, message); // Pass host element
    }
    public clearErrorState(): void {
        clearBooleanSwitchErrorState(this, this.uiElements);
    }

    //? Enable/disable the actual input element
    private _enableSwitch(): void {
        if(this.uiElements.checkboxElement) this.uiElements.checkboxElement.disabled = false;
        this.removeAttribute('aria-disabled');
    }
    private _disableSwitch(): void {
        if(this.uiElements.checkboxElement) this.uiElements.checkboxElement.disabled = true;
        this.setAttribute('aria-disabled', 'true');
    }
}

// --- Custom Element Definition ---
if (!customElements.get("boolean-switch")) {
    customElements.define("boolean-switch", BooleanSwitch);
}