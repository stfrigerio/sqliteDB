import { Modal, App, Notice, MarkdownView } from "obsidian";
import { pluginState } from "../../pluginState"; // Assuming this exists and works

function getISOWeekNumber(date: Date): number {
	const temp = new Date(date.getTime());
	temp.setHours(0, 0, 0, 0);
	// Thursday in current week decides the year.
	temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
	const week1 = new Date(temp.getFullYear(), 0, 4);
	return (
		1 +
		Math.round(
			((temp.getTime() - week1.getTime()) / 86400000 - ((week1.getDay() + 6) % 7)) /
			7
		)
	);
}

export class DatePickerModal extends Modal {
	private selectedDate: Date;
	private currentMonth: Date;
	private today: Date = new Date();

	constructor(app: App) {
		super(app);
		// Ensure selectedDate is always a Date object
		const initialDate = pluginState.selectedDate ? new Date(pluginState.selectedDate) : new Date();
		// Validate if the parsed date is valid, otherwise default to today
		this.selectedDate = isNaN(initialDate.getTime()) ? new Date() : initialDate;
		// Set time to 00:00:00 to compare dates easily
		this.selectedDate.setHours(0, 0, 0, 0);
		this.today.setHours(0, 0, 0, 0);

		this.currentMonth = new Date(this.selectedDate.getFullYear(), this.selectedDate.getMonth(), 1);
	}

	onOpen() {
		// Add a class to the modal content for easier styling
		this.contentEl.addClass("custom-datepicker-modal-content");
		this.render();
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty(); // Clear previous content

		// --- Header ---
		const header = contentEl.createEl("div", { cls: "calendar-header" });
		const prevBtn = header.createEl("button", { text: "←", cls: "clickable-icon" });
		prevBtn.setAttribute("aria-label", "Previous month");
		prevBtn.onclick = () => {
			this.currentMonth.setMonth(this.currentMonth.getMonth() - 1);
			this.render();
		};

		const title = header.createEl("span", {
			cls: "calendar-title",
			text: this.currentMonth.toLocaleString("default", { month: "long", year: "numeric" }),
		});

		const nextBtn = header.createEl("button", { text: "→", cls: "clickable-icon" });
		nextBtn.setAttribute("aria-label", "Next month");
		nextBtn.onclick = () => {
			this.currentMonth.setMonth(this.currentMonth.getMonth() + 1);
			this.render();
		};

		// --- Weekday Headers ---
		const weekdaysContainer = contentEl.createDiv({ cls: "calendar-weekdays" });
		const weekdays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];
		weekdaysContainer.createDiv({ cls: "week-number-header", text: "W#" }); // Header for Week#
		weekdays.forEach(day => weekdaysContainer.createDiv({ cls: "calendar-weekday", text: day }));

		// --- Calendar Grid ---
		// buildCalendar now returns the grid itself
		const calendarGrid = this.buildCalendar();
		contentEl.appendChild(calendarGrid);

		// --- Footer ---
		const footer = contentEl.createDiv({ cls: "calendar-footer" });
		// Display currently selected date
		const selectedDateDisplay = footer.createEl("span", { cls: "selected-date-display" });
		this.updateSelectedDateDisplay(selectedDateDisplay); // Initial display

		const confirmBtn = footer.createEl("button", { text: "Select", cls: "mod-cta" }); // Use Obsidian's primary button style
		confirmBtn.onclick = () => {
			const iso = this.selectedDate.toISOString().split("T")[0];
			pluginState.selectedDate = iso; // Update global state
			new Notice(`Date set to ${iso}`);
			// Optional: Force re-render if your plugin uses the date reactively in preview
			this.app.workspace.getActiveViewOfType(MarkdownView)?.previewMode?.rerender(true);
			this.close();
		};
	}

	private buildCalendar(): HTMLElement {
		const grid = document.createElement("div");
		grid.className = "calendar-grid"; // This will be the actual grid container

		const year = this.currentMonth.getFullYear();
		const month = this.currentMonth.getMonth();
		const firstDayOfMonth = new Date(year, month, 1);
		const daysInMonth = new Date(year, month + 1, 0).getDate();

		// Calculate offset for Monday start (0=Mon, 6=Sun)
		const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

		// --- Add Week Numbers and Empty Cells before the 1st ---
		let day = 1 - startOffset; // Start day counter considering offset
		let currentWeekNumber = -1;

		while (day <= daysInMonth) {
			// Calculate and add week number cell for the current row
			const dateForWeekNum = new Date(year, month, day > 0 ? day : 1); // Use day 1 if current day is placeholder
			const weekNumber = getISOWeekNumber(dateForWeekNum);
			// Only add week number if it changed (start of a new row essentially)
			if (weekNumber !== currentWeekNumber) {
				const weekEl = document.createElement("div");
				weekEl.className = "week-number";
				weekEl.textContent = `${String(weekNumber).padStart(2, "0")}`;
				grid.appendChild(weekEl);
				currentWeekNumber = weekNumber;
			} else if (grid.children.length % 8 === 0) {
                // If week number didn't change but we are at start of grid row, add it
                // This handles month starts that continue week number from previous month correctly
				const weekEl = document.createElement("div");
				weekEl.className = "week-number";
				weekEl.textContent = `${String(weekNumber).padStart(2, "0")}`;
				grid.appendChild(weekEl);
            }


			// Add the 7 day cells for the week
			for (let i = 0; i < 7; i++) {
				const cell = document.createElement("div"); // Use a div as container for button
				cell.className = "calendar-day-cell";

				if (day < 1 || day > daysInMonth) {
					// Empty cell (before start or after end of month)
					cell.classList.add("empty");
				} else {
					const currentDate = new Date(year, month, day);
					currentDate.setHours(0, 0, 0, 0); // Normalize time for comparison

					const btn = document.createElement("button");
					btn.textContent = String(day);
					btn.className = "calendar-day";
					btn.setAttribute("aria-label", currentDate.toDateString());

					// Check if this is the currently selected date
					if (currentDate.getTime() === this.selectedDate.getTime()) {
						btn.classList.add("selected");
						btn.setAttribute("aria-selected", "true");
					} else {
                        btn.setAttribute("aria-selected", "false");
                    }

					// Check if this is today's date
					if (currentDate.getTime() === this.today.getTime()) {
						btn.classList.add("today");
					}

					btn.onclick = () => {
						// Update selected date state
						this.selectedDate = currentDate;

						const previouslySelected = grid.querySelector(".calendar-day.selected");
						if (previouslySelected) {
							previouslySelected.classList.remove("selected");
                            previouslySelected.setAttribute("aria-selected", "false");
						}
						btn.classList.add("selected");
                        btn.setAttribute("aria-selected", "true");

						this.updateSelectedDateDisplay();
					};
					cell.appendChild(btn);
				}
				grid.appendChild(cell);
				day++;
			}
		}
		return grid;
	}

	private updateSelectedDateDisplay(element?: HTMLElement) {
		const displayEl = element ?? this.contentEl.querySelector(".selected-date-display");
		if (displayEl) {
			displayEl.textContent = `Selected: ${this.selectedDate.toLocaleDateString()}`;
		}
	}


	onClose() {
		this.contentEl.empty();
	}
}