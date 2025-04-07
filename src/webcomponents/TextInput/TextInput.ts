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
import { updateInputValue, setTextErrorState, clearTextErrorState } from "./dom/textInputUiUpdaters";

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

    // --- Shadow DOM Elements ---
    private uiElements!: TextInputDOMElements;

    // --- Lifecycle ---
    connectedCallback() {
        if (this._isInitialized) return;
        // Initialization requires appInstance
    }

    // --- Public Methods ---
    /** Injects DBService first, then App instance. */
    public setDependencies(dbService: DBService, app: App): void {
        if (!dbService || !app) {
            console.error("[TextInput] Invalid DBService or App instance provided.");
            //? Maybe show an error state on the element directly?
            this.textContent = "[Init Error]";
            return;
        }
        this.appInstance = app;
        try {
            this.textDataService = new TextInputDataService(dbService); //^ Init Data Service
        } catch(error){
            console.error("[TextInput] Failed to initialize TextInputDataService:", error);
            this.textContent = "[Data Service Error]";
            return;
        }

        if (!this._isInitialized) {
            this._readAttributesAndBuildConfig();
            this._initializeComponent();
            this._isInitialized = true;
        }
    }

    // --- Internal Initialization ---
    private _readAttributesAndBuildConfig(): void {
        this.config = {
            // UI Config
            label: this.getAttribute("data-label") ?? undefined,
            placeholder: this.getAttribute("placeholder") ?? undefined,
            initialValueAttr: this.getAttribute("data-initial-value") ?? "", // Read initial value from attr
            modalType: (this.getAttribute("data-modal-type") as ModalType) ?? 'none',
            isButton: this.getAttribute("data-is-button")?.toLowerCase() === 'true', //^ Read isButton flag

            // Data Config
            table: this.getAttribute("data-table") ?? undefined,
            date: this.getAttribute("data-date") ?? "@date", // Default to @date
            valueCol: this.getAttribute("data-value-col") ?? undefined,
            dateCol: this.getAttribute("data-date-col") ?? undefined,
        };
        //? Copy needed values from config/attributes to 'this' properties
        this.table = this.config.table ?? "";
        this.date = this.config.date ?? "@date";
        this.valueCol = this.config.valueCol ?? "";
        this.dateCol = this.config.dateCol ?? "";
    }

    private _initializeComponent(): void {
        if (!this.appInstance) {
            console.error("[TextInput] Cannot initialize: App instance not set.");
            return;
        }

        const eventProps: TextInputEventProps = {
            ...this.config, // Includes data config now
            app: this.appInstance,
            uiElements: this.uiElements, // Placeholder
            currentValue: this.currentValue,
            setValue: this._setValue,
        };

        const handlers = {
            handleInputChange: createInputChangeHandler(eventProps),
            handleModalTrigger: createModalTriggerHandler(eventProps),
        };

        this.uiElements = buildTextInputDOM(this.attachShadow({ mode: "open" }), this.config, handlers);
        eventProps.uiElements = this.uiElements;
        applyTextInputStyles(this.shadowRoot!);

        //^ --- Trigger Initial Load (if data configured) ---
        if (this.config.table && this.config.date && this.config.valueCol && this.config.dateCol) {
            loadTextValue(this).catch(err => console.error(`[TextInput ${this.config.table}] Unhandled error during initial load:`, err));
        } else {
            //? No data config, just use initialValueAttr
            this._updateDisplay(this.config.initialValueAttr ?? "");
        }

        // todo: date change listener if needed
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
    
    // todo: disable/enable methods
}

// --- Custom Element Definition ---
if (!customElements.get("text-input")) { customElements.define("text-input", TextInput); }