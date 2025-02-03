import { createLineChart } from './LineChart';
import { createBarChart } from './BarChart';

export type ChartType = 'line' | 'bar' | 'scatter' | 'pie';

export function createChart(type: ChartType, labels: string[], datasets: any[], options?: any) {
    switch (type) {
        case 'line':
            return createLineChart(labels, datasets, options);
        case 'bar':
            return createBarChart(labels, datasets, options);
        //todo add pie and others
        default:
            return createLineChart(labels, datasets); // fallback to line chart
    }
}