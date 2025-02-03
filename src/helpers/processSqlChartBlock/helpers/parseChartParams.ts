export interface BaseChartConfig {
    table: string;
    chartType: 'line' | 'bar' | 'pie';
    startDate?: string;
    endDate?: string;
    chartOptions?: any;
}

// For line and bar charts
export interface TimeSeriesChartConfig extends BaseChartConfig {
    chartType: 'line' | 'bar';
    xColumn: string;
    yColumns: string[];
    categoryColumn?: string;
}

// For pie charts
export interface PieChartConfig extends BaseChartConfig {
    chartType: 'pie';
    categoryColumn: string;
    valueColumn: string;
}

export type ChartConfig = TimeSeriesChartConfig | PieChartConfig;

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
            const optionMatch = trimmed.match(/(\w+):\s*([^,]+),?$/);
            if (optionMatch) {
                const [, key, valueStr] = optionMatch;
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
            if (key === 'yColumns') {
                params[key] = val.split(',').map((c: string) => c.trim());
            } else {
                params[key] = val;
            }
        }
    }

    if (!params.table || !params.chartType) {
        return null;
    }

    const baseConfig = {
        table: params.table,
        chartType: params.chartType,
        startDate: params.startDate,
        endDate: params.endDate,
        chartOptions: Object.keys(chartOptions).length > 0 ? chartOptions : undefined
    };

    switch (params.chartType) {
        case 'pie':
            if (!params.categoryColumn || !params.valueColumn) {
                return null;
            }
            return {
                ...baseConfig,
                chartType: 'pie',
                categoryColumn: params.categoryColumn,
                valueColumn: params.valueColumn
            };

        case 'line':
        case 'bar':
            if (!params.xColumn || !params.yColumns) {
                return null;
            }
            return {
                ...baseConfig,
                chartType: params.chartType,
                xColumn: params.xColumn,
                yColumns: Array.isArray(params.yColumns) ? params.yColumns : [params.yColumns],
                categoryColumn: params.categoryColumn
            };

        default:
            return null;
    }
}