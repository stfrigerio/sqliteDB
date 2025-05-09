/**
 * Creates the HTMLButtonElement for the timestamp updater.
 *
 * @param onClick The async function to execute when the button is clicked.
 * @returns The created HTMLButtonElement.
 */
export function createTimestampButtonElement(onClick: () => Promise<void>): HTMLButtonElement {
    const button = document.createElement('button');
    button.setText('Update Timestamp');
    button.addClass('timestamp-updater-button');

    button.style.backgroundColor = 'var(--interactive-accent)';
    button.style.color = 'var(--text-on-accent)';
    button.style.border = 'none';
    button.style.padding = '6px 12px';
    button.style.borderRadius = '4px';
    button.style.cursor = 'pointer';
    button.style.fontSize = '0.9em';

    button.addEventListener('click', async (event) => {
        event.stopPropagation();
        button.disabled = true;
        button.style.opacity = '0.7';
        button.style.cursor = 'wait';
        try {
            await onClick();
        } finally {
            button.disabled = false;
            button.style.opacity = '1';
            button.style.cursor = 'pointer';
        }
    });

    return button;
}