import { DBService } from "../../DBService";
import { HabitDataService } from "./services/HabitDataService";
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

//? Main Web Component class, acts as an orchestrator.
export class HabitCounter extends HTMLElement {
    // --- State ---
    public habitKey: string = ""; //? Make public if needed by handlers/helpers
    public initialDate: string = "";
    public emoji: string = "";
    public table: string = "";
    public currentValue: number = 0;
    private _initialLoadTriggered: boolean = false;
    private _isInitialized: boolean = false;

    // --- Dependencies ---
    public habitDataService: HabitDataService | null = null; //? Public for helpers

    // --- Shadow DOM Element References ---
    //? Store the object returned by the builder
    private uiElements: HabitCounterUIElements = {
        wrapper: null, valueDisplay: null, labelElement: null, minusButton: null, plusButton: null
    };

    // --- Lifecycle ---
    connectedCallback() {
        if (this._isInitialized) return;
        //& console.log("[HabitCounter Component] connectedCallback - Initializing...");

        //~ Create handlers bound to this instance *before* building DOM
        const handlers = {
            handleDecrement: createDecrementHandler(this),
            handleIncrement: createIncrementHandler(this),
        };

        this.uiElements = buildHabitCounterDOM(this.attachShadow({ mode: "open" }), handlers); //~ Build DOM via helper
        applyHabitCounterStyles(this.shadowRoot!); //~ Apply styles via helper
        this._isInitialized = true;
       //& console.log("[HabitCounter Component] Initialization complete.");
    }

    // --- Public Methods ---
    public setDbService(service: DBService): void {
       //& console.log("[HabitCounter Component] setDbService called.");
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
        //& console.log("[HabitCounter Component] _readAttributesAndInitLoad running.");
        this.habitKey = this.getAttribute("habit") ?? "";
        this.initialDate = this.getAttribute("date") ?? "@date";
        this.emoji = this.getAttribute("emoji") ?? "❓";
        this.table = this.getAttribute("table") ?? "";
        
        // --- Defer UI update and load trigger slightly ---
        requestAnimationFrame(() => {
            //& console.log(`[HabitCounter Component ${this.habitKey}] Deferred execution starting.`);
            //? Now access uiElements, which should be reliably assigned.
            console.log(`[HabitCounter Component ${this.habitKey}] DEBUG: Inspecting this.uiElements within deferred call:`, this.uiElements);

            updateStaticUI(this.uiElements, this.emoji, this.habitKey); //~ Update static parts of UI

            if (!this.table) {
                console.warn(`[HabitCounter Component ${this.habitKey}] Table attribute missing.`);
                this.showErrorState("No table");
                return;
            }

            if (!this._initialLoadTriggered) {
                this._initialLoadTriggered = true;
                //& console.log(`[HabitCounter Component ${this.habitKey}] Triggering initial loadHabitData...`);
                loadHabitData(this).catch(err => console.error("Unhandled error during initial load:", err)); //~ Load data via helper
            } else {
                console.log(`[HabitCounter Component ${this.habitKey}] Initial load already triggered.`);
            }
        });
    }

    //? Public method called by click handlers via instance reference
    public async _updateData(delta: number): Promise<void> {
        //& console.log(`[HabitCounter Component ${this.habitKey}] _updateData called with delta: ${delta}`);
       await updateHabitData(this, delta); //~ Update data via helper
    }

    //? Public method called by data helpers to update display
    public _updateDisplay(newValue: number): void {
       //& console.log(`[HabitCounter Component ${this.habitKey}] _updateDisplay called with value: ${newValue}`);
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