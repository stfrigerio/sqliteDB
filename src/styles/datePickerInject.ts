export function injectDatePickerStyles() {
	const styleId = "custom-datepicker-styles";
	// Avoid injecting multiple times
	if (document.getElementById(styleId)) {
		return;
	}

	const style = document.createElement("style");
	style.id = styleId;
	style.textContent = `
		/* Style the modal content area */
		.custom-datepicker-modal-content {
			padding: var(--size-4-4) var(--size-4-6); /* Consistent padding */
		}

		/* Header: Title and Navigation Buttons */
		.calendar-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: var(--size-4-3); /* Space below header */
		}
		.calendar-title {
			font-weight: var(--font-bold);
			font-size: var(--font-ui-large);
		}
		.calendar-header button.clickable-icon {
			/* Use Obsidian's icon button style */
            padding: var(--size-4-1) var(--size-4-2);
            font-size: var(--font-ui-large); /* Make arrows bigger */
            line-height: 1;
		}

		/* Weekday Headers Row */
		.calendar-weekdays {
			display: grid;
			grid-template-columns: 36px repeat(7, 1fr); /* Week# + 7 days */
			gap: var(--size-4-1);
			padding-bottom: var(--size-4-1);
			border-bottom: 1px solid var(--background-modifier-border);
			margin-bottom: var(--size-4-2);
		}
		.calendar-weekday,
		.week-number-header {
			text-align: center;
			font-weight: var(--font-semibold);
			font-size: var(--font-ui-small);
			color: var(--text-muted);
			line-height: 1; /* Ensure consistent height */
		}
        .week-number-header {
            font-style: italic;
        }

		/* Calendar Grid: Week Numbers and Day Cells */
		.calendar-grid {
			display: grid;
			grid-template-columns: 36px repeat(7, 1fr); /* Week# + 7 days */
			gap: var(--size-4-1); /* Gap between cells */
            align-items: center; /* Vertically center content in grid rows */
		}

		/* Individual cell container (holds button or is empty) */
		.calendar-day-cell {
			display: flex; /* Center button inside */
			justify-content: center;
			align-items: center;
            aspect-ratio: 1 / 1; /* Make cells squareish */
            min-height: 30px; /* Ensure minimum height */
		}
        .calendar-day-cell.empty {
            /* Style for empty cells (before/after month) */
            /* background-color: var(--background-secondary); */ /* Subtle background */
            /* opacity: 0.5; */
            /* Or just leave them blank */
        }


		/* Week Number Cells in the main grid */
		.week-number {
			text-align: center;
			font-size: var(--font-ui-smaller);
			color: var(--text-faint);
			font-style: italic;
            align-self: center; /* Align vertically in grid row */
            padding: 0 var(--size-4-1); /* Add some horizontal padding */
            line-height: var(--line-height-normal);
		}

		/* Day Buttons */
		.calendar-day {
			display: flex;
			align-items: center;
			justify-content: center;
			width: 100%; /* Fill cell width */
            height: 100%; /* Fill cell height */
			padding: var(--size-4-1);
			border: 1px solid transparent; /* Reserve space for border */
			border-radius: var(--radius-s);
			background-color: var(--background-secondary);
			color: var(--text-normal);
			font-size: var(--font-ui-small);
			cursor: pointer;
			transition: all 0.1s ease-in-out;
            line-height: 1; /* Prevent text pushing button size */
		}

		.calendar-day:hover {
			background-color: var(--background-modifier-hover);
			color: var(--text-normal); /* Keep text readable on hover */
            border-color: var(--background-modifier-border-hover);
		}

        /* Today's Date Indicator */
        .calendar-day.today {
            border-color: var(--text-accent); /* Use accent color for border */
            /* Optional: Add a subtle background or different font weight */
            /* background-color: var(--background-primary-alt); */
            /* font-weight: var(--font-bold); */
        }

		/* Selected Date Styling */
		.calendar-day.selected {
			background-color: var(--interactive-accent); /* Use theme's accent color */
			color: var(--text-on-accent);
			font-weight: var(--font-bold);
            border-color: var(--interactive-accent-hover); /* Slightly darker border */
		}
        .calendar-day.selected:hover {
            background-color: var(--interactive-accent-hover); /* Darken on hover */
            color: var(--text-on-accent);
        }

        /* Today and Selected */
        .calendar-day.today.selected {
             /* Optional: Make combo distinct if needed, e.g., thicker border */
             /* border-width: 2px; */
        }


		/* Footer Area */
		.calendar-footer {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-top: var(--size-4-3); /* Space above footer */
            padding-top: var(--size-4-2);
            border-top: 1px solid var(--background-modifier-border);
		}
        .selected-date-display {
            font-size: var(--font-ui-small);
            color: var(--text-muted);
        }

		.calendar-footer button {
			/* Let .mod-cta handle primary button style */
			/* Add margin if needed */
			/* margin-left: var(--size-4-2); */
		}

	`;
	document.head.appendChild(style);
}