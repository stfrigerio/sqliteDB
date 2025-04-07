import { App } from "obsidian";
import { DBService } from "src/DBService";
import { TextInputDataService } from "../services/TextInputDataService"; 
import { applyTextInputStyles } from "./styles/applyTextInputStyles";
import { buildTextInputDOM,  } from "./dom/buildTextInputDOM";
import { createInputChangeHandler } from "./eventHandlers/inputHandlers";
import { createModalTriggerHandler } from "./eventHandlers/modalTriggerHandlers";
import { TextInputConfig, ModalType, TextInputEventProps, TextInputDOMElements } from "./TextInput.types";
import { loadTextValue } from "./data/loadTextValue";
import { upsertTextValue } from "./data/upsertTextValue";
import { updateInputValue, setTextErrorState, clearTextErrorState, updateStaticTextUI } from "./dom/textInputUiUpdaters";
import { DATE_CHANGED_EVENT_NAME } from "src/pluginState";

export class TextInput extends HTMLElement {
    // --- Dependencies ---
    private appInstance: App | null = null;
    public textDataService: TextInputDataService | null = null;

    // --- State & Config ---
    public config: TextInputConfig = {};
    public currentValue: string = "";
    private _isInitialized: boolean = false;
    //^ data related state/config
    public table: string = "";
    public date: string = "";
    public valueCol: string = "";
    public dateCol: string = "";

    private _isListeningForDateChanges: boolean = false; // Prevent multiple listeners


    // --- Shadow DOM Elements ---
    private uiElements!: TextInputDOMElements;

    // --- Lifecycle ---
    connectedCallback() {
        if (this._isInitialized) return;

        //~ Initialization logic will be triggered by setDependencies,
        //~ but we need to build the DOM structure and setup listeners that
        //~ depend only on attributes right away.

        //~ Create bound event handler (needed by DOM builder if input acts as trigger)
        const eventProps: TextInputEventProps = { // Partial props okay here? Or defer fully? Let's defer.
            app: this.appInstance!, // Assume app will be set, riskier
            uiElements: this.uiElements, // Placeholder
            currentValue: this.currentValue,
            setValue: this._setValue,
            // Config will be filled later
        };

        const handlers = {
            handleInputChange: createInputChangeHandler(eventProps), // Needs props later
            handleModalTrigger: createModalTriggerHandler(eventProps), // Needs props later
        };

        //? Read config attributes needed *immediately* for DOM build (like isButton, modalType)
        const initialConfig: TextInputConfig = {
            modalType: (this.getAttribute("data-modal-type") as ModalType) ?? 'none',
            isButton: this.getAttribute("data-is-button")?.toLowerCase() === 'true',
            // Read others needed by buildTextInputDOM, possibly placeholder/initialValueAttr too
            placeholder: this.getAttribute("placeholder") ?? undefined,
            initialValueAttr: this.getAttribute("data-initial-value") ?? "",
            label: this.getAttribute("data-label") ?? undefined,
        };


        //? Build DOM structure immediately
        this.uiElements = buildTextInputDOM(this.attachShadow({ mode: "open" }), initialConfig, handlers);
        applyTextInputStyles(this.shadowRoot!);

        //? This reads the attribute directly, safe to call now.
        this._setupDateChangeListener();

        this._isInitialized = true; // Mark basic init done
    }

    disconnectedCallback() {
        if (this._isListeningForDateChanges) {
            document.removeEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
            this._isListeningForDateChanges = false;
        }
    }

    // --- Public Methods ---
    /** Injects DBService first, then App instance. */
    public setDependencies(dbService: DBService, app: App): void {
        if (!dbService || !app) { /* ... error ... */ return; }
        this.appInstance = app;
        try {
            this.textDataService = new TextInputDataService(dbService);
        } catch (error) { /* ... error ... */ return; }

        //? Now that dependencies are set, complete the setup
        this._readAttributesAndInitializeData();
    }

    /** Reads data-related attributes and triggers initial load. Called AFTER dependencies are set. */
    private _readAttributesAndInitializeData(): void {
        // --- Read Data Attributes ---
        this.table = this.getAttribute("data-table") ?? "";
        this.date = this.getAttribute("data-date") ?? "@date";
        this.valueCol = this.getAttribute("data-value-col") ?? "";
        this.dateCol = this.getAttribute("data-date-col") ?? "";

        // --- Update Config object
        this.config.table = this.table;
        this.config.date = this.date;
        this.config.valueCol = this.valueCol;
        this.config.dateCol = this.dateCol;

        // --- Trigger Initial Load ---
        requestAnimationFrame(() => {
            updateStaticTextUI(this.uiElements, this.config.label); 
            if (!this.table || !this.valueCol || !this.dateCol) {
                console.warn(`[TextInput ${this.config.label}] Missing required data configuration attributes (table, valueCol, dateCol).`);
                this.showErrorState("Config Error"); this._disableInput?.();
            }
            loadTextValue(this).catch(err => console.error(`[TextInput ${this.config.label}] Unhandled error during initial load:`, err));
        });
    }

    /** Central method to update state, UI, and trigger save. */
    private _setValue = (newValue: string, triggerSave: boolean = false): void => {
        if (this.currentValue !== newValue) {
            this.currentValue = newValue;

            //? Always update the input display
            this._updateDisplay(this.currentValue);

            this.dispatchEvent(new CustomEvent('input-change', { detail: { value: this.currentValue }, /*...*/ }));

            //? Trigger save only if configured and requested
            if (triggerSave && this.config.table && this.config.date && this.config.valueCol && this.config.dateCol) {
                //? Call the upsert helper
                upsertTextValue(this).catch(err => {
                    console.error(`[TextInput ${this.config.table}] Error during save:`, err);
                    //? Consider reverting UI or showing persistent error?
                    // this.showErrorState("Save Failed");
                });
            }
        }
    };

    private _setupDateChangeListener(): void {
        const dateAttr = this.getAttribute("data-date"); // Read attribute directly
        if (dateAttr === "@date" && !this._isListeningForDateChanges) {
            document.addEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
            this._isListeningForDateChanges = true;
        }
    }

    private _handleGlobalDateChange = (event: Event): void => {
        //? Type guard for CustomEvent
        if (!(event instanceof CustomEvent)) return;

        const newIsoDate = event.detail?.newIsoDate;

        //? Double-check this component should react (uses @date)
        if (this.date === "@date") {
            //& console.log(`[TextInput ${this.uniqueId}] Date property matches "@date", reloading data...`);
            this.classList.add('loading');
            this._updateDisplay("..."); // Show loading dots

            loadTextValue(this)
                .catch(err => { /* ... */ })
                .finally(() => { this.classList.remove('loading'); });
        } else {
            //& console.log(`[TextInput ${this.uniqueId}] Ignoring date change event (internal date property is "${this.date}").`);
        }
    };

    //? Public method called by data helpers to update display
    public _updateDisplay(newValue: string): void {
        this.currentValue = newValue; // Update internal state
        updateInputValue(this.uiElements, newValue); //~ Update DOM via helper
        this.clearErrorState(); //? Clear errors on successful update
        //? Enable/disable logic might be needed based on state
    }

    //? Public methods for UI state helpers
    public showErrorState(message?: string): void { setTextErrorState(this, this.uiElements, message); }
    public clearErrorState(): void { clearTextErrorState(this, this.uiElements); }

    private _enableInput(): void { if(this.uiElements?.inputElement) this.uiElements.inputElement.disabled = false; this.removeAttribute('aria-disabled'); }
    private _disableInput(): void { if(this.uiElements?.inputElement) this.uiElements.inputElement.disabled = true; this.setAttribute('aria-disabled', 'true'); }
}

// --- Custom Element Definition ---
if (!customElements.get("text-input")) { customElements.define("text-input", TextInput); }