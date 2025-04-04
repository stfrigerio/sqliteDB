import { App } from "obsidian";
import { DatePickerModal } from "./DatePickerModal";

export function renderDatePicker(container: HTMLElement, app: App) {
	const wrapper = container.createDiv({ cls: "datepicker" });

	const button = wrapper.createEl("button", { text: "Select Date" });
	button.onclick = () => {
		new DatePickerModal(app).open();
	};
}
