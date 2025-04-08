
/** Generates <option> elements for hours (00-23). */
export function createHourOptions(selectedHour: number): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 24; i++) {
        const option = document.createElement("option");
        const hourString = String(i).padStart(2, '0');
        option.value = hourString;
        option.textContent = hourString;
        if (i === selectedHour) {
            option.selected = true;
        }
        fragment.appendChild(option);
    }
    return fragment;
}

/** //? Generates <option> elements for minutes (00-59). */
export function createMinuteOptions(selectedMinute: number): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < 60; i++) {
        const option = document.createElement("option");
        const minuteString = String(i).padStart(2, '0');
        option.value = minuteString;
        option.textContent = minuteString;
        if (i === selectedMinute) {
            option.selected = true;
        }
        fragment.appendChild(option);
    }
    return fragment;
}

/** //? Parses "HH:MM" string into hours and minutes numbers. */
export function parseTimeString(timeString: string): { hour: number; minute: number } {
    let hour = 12; // Default hour
    let minute = 0; // Default minute

    if (/^\d{1,2}:\d{1,2}$/.test(timeString)) {
        const parts = timeString.split(':').map(Number);
        const parsedHour = parts[0];
        const parsedMinute = parts[1];

        if (!isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) {
            hour = parsedHour;
        }
        if (!isNaN(parsedMinute) && parsedMinute >= 0 && parsedMinute <= 59) {
            minute = parsedMinute;
        }
    }
     //& console.log(`[TimePickerUtils] Parsed "${timeString}" to H:${hour}, M:${minute}`);
    return { hour, minute };
}

/** //? Formats hour and minute numbers into "HH:MM" string. */
export function formatTimeString(hour: number | string, minute: number | string): string {
    const hh = String(hour).padStart(2, '0');
    const mm = String(minute).padStart(2, '0');
    return `${hh}:${mm}`;
}