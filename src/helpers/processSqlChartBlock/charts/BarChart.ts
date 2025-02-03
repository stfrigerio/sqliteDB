import { getColorForIndex } from "../helpers/getColorForIndex";

interface BarChartOptions {
    stacked?: boolean;
    showLegend?: boolean;
    horizontal?: boolean;
    barThickness?: number;
    borderRadius?: number;
    yAxisMin?: number;
    yAxisMax?: number;
    tooltips?: boolean;
    animations?: boolean;
}

export function createBarChart(labels: string[], datasets: any[], options: BarChartOptions = {}) {
    const defaultOptions: BarChartOptions = {
        stacked: false,
        showLegend: true,
        horizontal: false,
        barThickness: 8,
        borderRadius: 4,
        tooltips: true,
        animations: true
    };

    const chartOptions = { ...defaultOptions, ...options };
    const indexAxis = chartOptions.horizontal ? 'y' : 'x';
    const valueAxis = chartOptions.horizontal ? 'x' : 'y';

    return {
        type: 'bar',
        data: {
            labels,
            datasets: datasets.map((dataset, index) => ({
                ...dataset,
                backgroundColor: getColorForIndex(index, 0.6),
                hoverBackgroundColor: getColorForIndex(index, 0.8),
            }))
        },
        options: {
            responsive: true,
            // maintainAspectRatio: false,
            indexAxis,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            animations: chartOptions.animations ? {
                numbers: {
                    type: 'number',
                    duration: 600,
                    easing: 'easeOutQuart',
                },
                x: {
                    type: 'number',
                    duration: 300,
                    from: 0
                },
                y: {
                    type: 'number',
                    duration: 300,
                    from: 0
                }
            } : false,
            plugins: {
                legend: {
                    display: chartOptions.showLegend,
                    position: 'top' as const,
                    labels: {
                        usePointStyle: false,
                        padding: 15,
                        font: {
                            size: 12
                        },
                        generateLabels: (chart: any) => {
                            const datasets = chart.data.datasets;
                            return datasets.map((dataset: any, i: number) => ({
                                text: dataset.label,
                                fillStyle: dataset.backgroundColor,
                                strokeStyle: dataset.borderColor,
                                lineWidth: 0,
                                hidden: !chart.isDatasetVisible(i),
                                index: i
                            }));
                        }
                    }
                },
                tooltip: {
                    enabled: chartOptions.tooltips,
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleFont: {
                        size: 13
                    },
                    bodyFont: {
                        size: 12
                    },
                    padding: 10,
                    cornerRadius: 4,
                    displayColors: true,
                    callbacks: {
                        label: function(context: any) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += context.parsed[valueAxis];
                            return label;
                        }
                    }
                }
            },
            scales: {
                [valueAxis]: {
                    stacked: chartOptions.stacked,
                    beginAtZero: true,
                    min: chartOptions.yAxisMin,
                    max: chartOptions.yAxisMax,
                    grid: {
                        display: true,
                        drawBorder: true,
                        drawOnChartArea: true,
                        drawTicks: true,
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        font: {
                            size: 11
                        }
                    }
                },
                [indexAxis]: {
                    stacked: chartOptions.stacked,
                    grid: {
                        display: false,
                        drawBorder: true,
                        drawTicks: true,
                    },
                    ticks: {
                        font: {
                            size: 11
                        },
                        maxRotation: chartOptions.horizontal ? 0 : 45,
                        minRotation: chartOptions.horizontal ? 0 : 45
                    }
                }
            }
        }
    };
}