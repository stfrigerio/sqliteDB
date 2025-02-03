import { getColorForIndex } from "../helpers/getColorForIndex";

interface PieChartOptions {
    showLegend?: boolean;
    isDoughnut?: boolean;
    cutout?: number;         // percentage of the chart radius (0-100)
    tooltips?: boolean;
    animations?: boolean;
    rotation?: number;       // starting angle in degrees
}

export function createPieChart(labels: string[], datasets: any[], options: PieChartOptions = {}) {
    const defaultOptions: PieChartOptions = {
        showLegend: true,
        isDoughnut: false,
        cutout: 50,          // only used if isDoughnut is true
        tooltips: true,
        animations: true,
        rotation: -90        // start from top (-90 degrees)
    };

    const chartOptions = { ...defaultOptions, ...options };

    return {
        type: chartOptions.isDoughnut ? 'doughnut' : 'pie',
        data: {
            labels,
            datasets: datasets.map(dataset => ({
                ...dataset,
                backgroundColor: labels.map((_, index) => 
                    getColorForIndex(index, 0.6)
                ),
                hoverBackgroundColor: labels.map((_, index) => 
                    getColorForIndex(index, 0.8)
                ),
                borderWidth: 2,
                borderColor: 'white',
                hoverBorderWidth: 3,
                hoverBorderColor: 'white',
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            rotation: chartOptions.rotation,
            cutout: chartOptions.isDoughnut ? `${chartOptions.cutout}%` : 0,
            animations: chartOptions.animations ? {
                animateRotate: true,
                animateScale: true
            } : false,
            plugins: {
                legend: {
                    display: chartOptions.showLegend,
                    position: 'right' as const,
                    labels: {
                        padding: 15,
                        font: {
                            size: 12
                        },
                        generateLabels: (chart: any) => {
                            const data = chart.data;
                            return data.labels.map((label: string, index: number) => ({
                                text: `${label}: ${data.datasets[0].data[index]}`,
                                fillStyle: data.datasets[0].backgroundColor[index],
                                strokeStyle: data.datasets[0].borderColor,
                                lineWidth: 1,
                                hidden: isNaN(data.datasets[0].data[index]),
                                index
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
                    callbacks: {
                        label: function(context: any) {
                            const label = context.label || '';
                            const value = context.parsed;
                            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                            const percentage = ((value * 100) / total).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    };
}