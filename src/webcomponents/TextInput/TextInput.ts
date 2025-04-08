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

let textInputCounter = 0;

export class TextInput extends HTMLElement {
    // --- Dependencies ---
    public appInstance: App | null = null;
    public textDataService: TextInputDataService | null = null;

    // --- State & Config ---
    public config: TextInputConfig = {};
    public currentValue: string = "";
    private _isInitialized: boolean = false;
    private _domBuilt: boolean = false; // Tracks if Shadow DOM exists
    private _initialLoadTriggered: boolean = false; // Tracks if initial load has been triggered

    //^ data related state/config
    public table: string = "";
    public date: string = "";
    public valueCol: string = "";
    public dateCol: string = "";

    private _isListeningForDateChanges: boolean = false; // Prevent multiple listeners

    // --- Shadow DOM Elements ---
    private uiElements!: TextInputDOMElements;
    private uniqueId: string; // For logging/debugging

    constructor() {
        super();
        this.uniqueId = `ti-${textInputCounter++}`;
    }

    // --- Lifecycle ---
    connectedCallback() {
        //& console.log(`[TextInput ${this.uniqueId}] connectedCallback.`);
        //? We only mark that the element is in the DOM.
        //? Initialization waits for dependencies via setDependencies.
        //? Setup listener only after attributes are read.
        if (this._isInitialized) return;
    }

    disconnectedCallback() {
        //& console.log(`[TextInput ${this.uniqueId}] disconnectedCallback - Cleaning up listener.`);
        if (this._isListeningForDateChanges) {
            document.removeEventListener(DATE_CHANGED_EVENT_NAME, this._handleGlobalDateChange);
            this._isListeningForDateChanges = false;
        }
    }

    // --- Public Methods ---
    /** Injects DBService first, then App instance. */
    public setDependencies(dbService: DBService, app: App): void {
        //& console.log(`[TextInput ${this.uniqueId}] setDependencies called.`);
        if (this._isInitialized) {
           //& console.log(`[TextInput ${this.uniqueId}] Already initialized, skipping dependency set.`);
            return; // Don't re-initialize if already done
        }
        if (!dbService || !app) {
            console.error("[TextInput] Invalid DBService or App instance provided during dependency injection.");
            this.textContent = "[Init Error - Dependencies]";
            return;
        }
        this.appInstance = app;
        try {
            this.textDataService = new TextInputDataService(dbService);
        } catch (error) {
            console.error(`[TextInput ${this.uniqueId}] Failed to initialize TextInputDataService:`, error);
            this.textContent = "[Data Service Error]";
            return;
        }

        //? Start the setup process now that dependencies are available
        this._readAttributesAndBuildConfig(); // Reads attributes, sets 'this.date', setups listener
        this._initializeComponent();       // Builds DOM, creates handlers, applies styles, triggers load
        this._isInitialized = true;        // Mark initialization complete
       //& console.log(`[TextInput ${this.uniqueId}] Initialization fully complete.`);
    }

    /** Reads data-related attributes and triggers initial load. Called AFTER dependencies are set. */
    private _readAttributesAndBuildConfig(): void {
         // --- Read ALL Attributes ---
        this.config = {
            label: this.getAttribute("data-label") ?? undefined,
            placeholder: this.getAttribute("placeholder") ?? undefined,
            initialValueAttr: this.getAttribute("data-initial-value") ?? "",
            modalType: (this.getAttribute("data-modal-type") as ModalType) ?? 'none',
            isButton: this.getAttribute("data-is-button")?.toLowerCase() === 'true',
            table: this.getAttribute("data-table") ?? undefined,
            date: this.getAttribute("data-date") ?? "@date",
            valueCol: this.getAttribute("data-value-col") ?? undefined,
            dateCol: this.getAttribute("data-date-col") ?? undefined,
        };
        //? Copy to component properties
        this.table = this.config.table ?? "";
        this.date = this.config.date ?? "@date"; // Store initial date config here
        this.valueCol = this.config.valueCol ?? "";
        this.dateCol = this.config.dateCol ?? "";

        //^ --- Setup Listener AFTER reading attributes and setting this.date ---
        this._setupDateChangeListener(); // Safe to call now
    }

    /** Builds DOM, creates handlers, applies styles, triggers initial load. */
    private _initializeComponent(): void {
        if (!this.appInstance) { console.error("[TextInput] Cannot initialize component: App instance missing."); return; }
        if (this.shadowRoot) { console.warn(`[TextInput ${this.config.label || this.uniqueId}] Already has shadowRoot, skipping DOM build.`); return } // Prevent rebuilding DOM
    
        //? Pass 'this' which now contains the fully populated config
        const handlers = {
            handleInputChange: createInputChangeHandler(this),
            handleModalTrigger: createModalTriggerHandler(this),
        };
    
        //~ Build DOM and get element references
        this.uiElements = buildTextInputDOM(this.attachShadow({ mode: "open" }), this.config, handlers);

        //~ Apply styles
        applyTextInputStyles(this.shadowRoot!); // shadowRoot definitely exists now

        this._domBuilt = true; // Mark DOM built

        // --- Update Static UI & Trigger Initial Load (Deferred slightly) ---
        requestAnimationFrame(() => {
            updateStaticTextUI(this.uiElements, this.config.label);

            // --- Data Validation & Load Trigger ---
            if (this.table && this.valueCol && this.dateCol) {
                // Config looks okay for data operations
                if (!this._initialLoadTriggered) {
                    this._initialLoadTriggered = true;
                    loadTextValue(this).catch(err => console.error(`[TextInput ${this.config.label || this.uniqueId}] Unhandled error during initial load:`, err));
                }
            } else {
                console.warn(`[TextInput ${this.config.label || this.uniqueId}] Missing required data configuration attributes (table, valueCol, dateCol). Will use initialValueAttr.`);
                this._updateDisplay(this.config.initialValueAttr ?? "");
                this._disableInput?.();
            }
        });
    }

    /** Central method to update state, UI, and trigger save. */
    public _setValue = (newValue: string, triggerSave: boolean = false): void => {
        if (this.currentValue !== newValue) {
            this.currentValue = newValue;
            this._updateDisplay(this.currentValue); // Update UI optimistically
            this.dispatchEvent(new CustomEvent('input-change', { /* ... */ }));
            // Use 'this' properties for validation
            if (triggerSave && this.table && this.valueCol && this.dateCol) {
               //& console.log(`[TextInput ${this.config.label || this.uniqueId}] Save triggered.`);
                upsertTextValue(this).catch(/* ... */);
            }
        }
    };

    //? Listener Setup (called from _readAttributesAndBuildConfig)
    private _setupDateChangeListener(): void {
        if (this.date === "@date" && !this._isListeningForDateChanges) {
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