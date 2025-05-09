import { getTextInputStyles } from "./getTextInputStyles";

/** Creates a style element and appends it to the shadow root. */
export function applyTextInputStyles(shadowRoot: ShadowRoot): void {
    if (!shadowRoot) {
        console.error("[TextInputStyles] Cannot apply styles: ShadowRoot is null.");
        return;
    }
    const style = document.createElement("style");
    style.textContent = getTextInputStyles();
    shadowRoot.appendChild(style);
}