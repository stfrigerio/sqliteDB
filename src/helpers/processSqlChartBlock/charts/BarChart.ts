import { getColorForIndex } from "../helpers/getColorForIndex";

interface BarChartOptions {
    stacked?: boolean;
}

export function createBarChart(labels: string[], datasets: any[], options?: BarChartOptions) {
    return {
        type: 'bar',
        data: {
            labels,
            datasets: datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: getColorForIndex(index, 0.6),
            }))
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true,
                    stacked: options?.stacked
                },
                x: {
                    stacked: options?.stacked
                }
            }
        }
    };
}