// src/components/dateNavigator/dateNavigator.types.ts
import { App } from "obsidian";
import { pluginState } from "src/pluginState";

//? Defines the period types the navigator can handle (currently only 'day')
export type NavigationPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year';

//? Configuration options for the DateNavigator
export interface DateNavigatorOptions {
    app: App;
    pluginState: typeof pluginState;
    containerEl: HTMLElement; // Where to render the navigator
    period?: NavigationPeriod; // Defaults to 'day'
    dateFormat?: string; // todo: Allow custom date formats later
}

//? References to the DOM elements created by the navigator builder
export interface DateNavigatorDOMElements {
    wrapper: HTMLElement;
    prevButton: HTMLButtonElement;
    nextButton: HTMLButtonElement;
    dateDisplay: HTMLElement; // The H1 or span showing the date
    openModalButton: HTMLButtonElement;
    periodSelect?: HTMLSelectElement;
}