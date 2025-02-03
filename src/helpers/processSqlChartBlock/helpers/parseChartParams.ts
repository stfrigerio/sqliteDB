export interface ChartOptions {
    fill?: boolean;
    tension?: number;
    pointRadius?: number;
    pointHoverRadius?: number;
    showLegend?: boolean;
    yAxisMin?: number;
    yAxisMax?: number;
    tooltips?: boolean;
    animations?: boolean;
}

export interface ChartConfig {
    table: string;
    xColumn: string;
    yColumns: string[];
    groupBy?: string;
    startDate?: string;
    endDate?: string;
    chartType: string;
    chartOptions?: ChartOptions;
}

export function parseChartParams(source: string): ChartConfig | null {
    const lines = source.split("\n");
    const params: any = {};
    let chartOptions: any = {};
    let inChartOptions = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Handle chartOptions block
        if (trimmed === 'chartOptions: {') {
            inChartOptions = true;
            continue;
        }
        if (trimmed === '}') {
            inChartOptions = false;
            continue;
        }

        if (inChartOptions) {
            // Parse chartOptions parameters
            const optionMatch = trimmed.match(/(\w+):\s*([^,]+),?$/);
            if (optionMatch) {
                const [, key, valueStr] = optionMatch;
                // Convert string values to appropriate types
                let value: any = valueStr.trim();
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else if (!isNaN(Number(value))) value = Number(value);
                chartOptions[key] = value;
            }
            continue;
        }

        // Handle regular parameters
        const parts = trimmed.split(":").map((p) => p.trim());
        if (parts.length >= 2) {
            const key = parts[0];
            const val = parts.slice(1).join(":").trim();
            params[key] = val;
        }
    }

    if (!params.table || !params.xColumn || !params.yColumns) {
        return null;
    }

    return {
        table: params.table,
        xColumn: params.xColumn,
        yColumns: params.yColumns.split(',').map((c: string) => c.trim()),
        groupBy: params.groupBy?.trim(),
        startDate: params.startDate,
        endDate: params.endDate,
        chartType: params.chartType || 'line',
        chartOptions: Object.keys(chartOptions).length > 0 ? chartOptions : undefined
    };
}