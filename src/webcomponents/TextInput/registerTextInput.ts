import { App } from "obsidian";
import { TextInput } from "./TextInput";
import { DBService } from "src/DBService";

//? Define element if needed
if (!customElements.get("text-input")) {
    customElements.define("text-input", TextInput);
}

/**
 * Finds placeholder elements and replaces them with initialized TextInput components.
 * @param el The container element to search within.
 * @param app The Obsidian App instance.
 */
export const registerTextInput = (el: HTMLElement, app: App, dbService: DBService) => {
    const placeholders = el.querySelectorAll("span.text-input-placeholder");

    placeholders.forEach((placeholderEl) => {
        if (!(placeholderEl instanceof HTMLElement)) return;

        //~ Read all attributes
        const configAttrs: Record<string, string | undefined> = {
            label: placeholderEl.dataset.label,
            placeholder: placeholderEl.dataset.placeholder,
            initialValue: placeholderEl.dataset.initialValue,
            modalType: placeholderEl.dataset.modalType,
            isButton: placeholderEl.dataset.isButton, // Read button mode flag
            table: placeholderEl.dataset.table,
            date: placeholderEl.dataset.date,
            valueCol: placeholderEl.dataset.valueCol,
            dateCol: placeholderEl.dataset.dateCol,
        };

        try {
            const component = document.createElement("text-input") as TextInput;

            //~ Set all attributes on the component element
            Object.entries(configAttrs).forEach(([key, value]) => {
                if (value !== undefined) {
                    // Convert camelCase (like isButton) to kebab-case for attributes
                    const attrName = key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
                    component.setAttribute(`data-${attrName}`, value);
                }
            });
            // Manually set placeholder if needed as it's not a data-* attribute
            if (configAttrs.placeholder) component.setAttribute("placeholder", configAttrs.placeholder);

            //^ Inject BOTH dependencies AFTER setting attributes
            component.setDependencies(dbService, app);

            placeholderEl.replaceWith(component);
        } catch (error) {
            console.error(`[TextInput Reg] Error processing placeholder:`, error, placeholderEl); // Keep error log
            placeholderEl.textContent = "[Error Loading Input]";
        }
    });
}