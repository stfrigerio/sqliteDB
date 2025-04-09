import { MarkdownRenderChild, App } from 'obsidian';
import { DateNavigator } from './DateNavigator';
import { pluginState } from '../../pluginState';
import { NavigationPeriod } from './dateNavigator.types';

//? Helper function to parse the period from the code block source
function parsePeriodFromSource(source: string): NavigationPeriod | null {
    const sourceTrimmed = source?.trim().toLowerCase();
    if (!sourceTrimmed) return null;

    const validPeriods: NavigationPeriod[] = ['day', 'week', 'month', 'quarter', 'year'];
    if (validPeriods.includes(sourceTrimmed as NavigationPeriod)) {
        return sourceTrimmed as NavigationPeriod;
    }
    console.warn(`[DateNavigatorRenderer] Invalid period specified in code block source: "${sourceTrimmed}". Defaulting.`);
    return null;
}

/**
 * An Obsidian Render Child responsible for rendering and managing the lifecycle
 * of a DateNavigator instance within a Markdown code block.
 */
export class DateNavigatorRenderer extends MarkdownRenderChild {
    private navigator: DateNavigator | null = null;
    private initialPeriod: NavigationPeriod;

    constructor(
        containerEl: HTMLElement,
        private appInstance: App,
        private source: string
    ) {
        super(containerEl);
        this.initialPeriod = parsePeriodFromSource(source) ?? 'day';
    }

    /** Called by Obsidian when the component should be loaded/rendered. */
    onload() {
        this.containerEl.empty();
        this.containerEl.addClass('date-navigator-container-wrapper');

        try {
            this.navigator = new DateNavigator({
                app: this.appInstance,
                pluginState: pluginState,
                containerEl: this.containerEl,
                period: this.initialPeriod
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