import { MarkdownRenderChild, App } from 'obsidian';

import { DateNavigator } from './components/dateNavigator/DateNavigator';
import { pluginState } from '../../pluginState';

/**
 * An Obsidian Render Child responsible for rendering and managing the lifecycle
 * of a DateNavigator instance within a Markdown code block.
 */
export class DateNavigatorRenderer extends MarkdownRenderChild {

    private navigator: DateNavigator | null = null;

    constructor(
        containerEl: HTMLElement,
        private appInstance: App
    ) {
        super(containerEl);
    }

    /** Called by Obsidian when the component should be loaded/rendered. */
    onload() {
        this.containerEl.empty();
        this.containerEl.addClass('date-navigator-container-wrapper');

        try {
            this.navigator = new DateNavigator({
                app: this.appInstance,
                pluginState: pluginState,
                containerEl: this.containerEl
            });
        } catch (error) {
            console.error("[DateNavigatorRenderer] Failed to create DateNavigator:", error);
            this.containerEl.setText('Error loading date navigator component.');
        }
    }

    /** Called by Obsidian when the component should be unloaded/cleaned up. */
    onunload() {
        this.navigator?.destroy();
        this.navigator = null;
    }
}