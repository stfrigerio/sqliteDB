// helpers.ts (add this new function)

export function renderResultsAsTable(results: { columns: string[], values: any[][] }, el: HTMLElement): void {
    el.empty(); // Clear the container first

    const table = el.createEl("table", { cls: "sql-results-table" }); // Add a class for styling

    // --- Create Table Header ---
    const thead = table.createEl("thead", { cls: "sql-results-thead" });
    const headerRow = thead.createEl("tr", { cls: "sql-results-tr sql-results-header-row" });
    results.columns.forEach(colName => {
        headerRow.createEl("th", { text: colName, cls: "sql-results-th" });
    });

    // --- Create Table Body ---
    const tbody = table.createEl("tbody", { cls: "sql-results-tbody" });
    results.values.forEach(valueRow => {
        const tr = tbody.createEl("tr", { cls: "sql-results-tr" });
        valueRow.forEach(cellValue => {
            // Render null/undefined as empty string or specific text
            const displayValue = (cellValue === null || cellValue === undefined) ? "" : String(cellValue);
            tr.createEl("td", { text: displayValue, cls: "sql-results-td" });
        });
    });
}

// Consider renaming the existing renderResults for clarity if needed
// export function renderResultsAsList(...) { ... }
// Or keep renderResults as the function for 'list' format.
// Let's assume the existing renderResults IS the list renderer for now.
export function renderResults(results: { columns: string[], values: any[][] }, el: HTMLElement): void {
    // This is your CURRENT rendering logic (presumably rendering as divs, list items, etc.)
    // For demonstration, let's make a simple list:
    el.empty();
    const list = el.createEl("ul", {cls: "sql-results-list"});
    results.values.forEach(valueRow => {
        const item = list.createEl("li");
        const content = results.columns.map((col, index) => `${col}: ${valueRow[index] ?? 'N/A'}`).join(" | ");
        item.createEl("pre", { text: content }); // Use pre for simple formatting
    });
}

// Don't forget to export the new function if helpers.ts is a module
// (The other helpers like parseSqlParams, validateTable, buildSqlQuery should already be exported)