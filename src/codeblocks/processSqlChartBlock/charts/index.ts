import { createLineChart } from './LineChart';
import { createBarChart } from './BarChart';
import { createPieChart } from './PieChart';

export type ChartType = 'line' | 'bar' | 'scatter' | 'pie';

export function createChart(type: ChartType, labels: string[], datasets: any[], options?: any) {
    switch (type) {
        case 'line':
            return createLineChart(labels, datasets, options);
        case 'bar':
            return createBarChart(labels, datasets, options);
        case 'pie':
            return createPieChart(labels, datasets, options);
        default:
            return createLineChart(labels, datasets); // fallback to line chart
    }
}