export function renderResults(result: { columns: string[], values: any[][] }, el: HTMLElement) {
    const { columns, values } = result;

    // Create a container element for all rows.
    const container = el.createEl("div");

    values.forEach(rowValues => {
        // Create a container for each row.
        const rowContainer = container.createEl("div");

        columns.forEach((col, index) => {
            // Create a span for the column/value pair.
            const pairSpan = rowContainer.createEl("span");
            
            // Append the column name in bold.
            pairSpan.createEl("strong", { text: col });
            
            // Append the colon and the corresponding value.
            pairSpan.createEl("span", { text: ": " + String(rowValues[index] ?? "") });
            
            // Add a line break after each column/value pair.
            rowContainer.createEl("br");
        });
        
        // Optionally add an extra break between rows.
        container.createEl("br");
    });
}
