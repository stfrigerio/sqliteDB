interface LineChartOptions {
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

export function createLineChart(labels: string[], datasets: any[], options: LineChartOptions = {}) {
    const defaultOptions: LineChartOptions = {
        fill: false,
        tension: 0.3,
        pointRadius: 3,
        pointHoverRadius: 5,
        showLegend: true,
        tooltips: true,
        animations: true
    };

    const chartOptions = { ...defaultOptions, ...options };

    return {
        type: 'line',
        data: {
            labels,
            datasets: datasets.map((dataset, index) => ({
                ...dataset,
                fill: chartOptions.fill,
                tension: chartOptions.tension,
                pointRadius: chartOptions.pointRadius,
                pointHoverRadius: chartOptions.pointHoverRadius,
                borderWidth: 2,
                // Point styling
                pointBackgroundColor: dataset.borderColor,
                pointBorderColor: dataset.borderColor,
                pointBorderWidth: 1,
                // Hover effects
                hoverBorderWidth: 2,
                hoverBorderColor: dataset.borderColor,
            }))
        },
        options: {
            responsive: true,
            // maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index',
            },
            animations: chartOptions.animations ? {
                tension: {
                    duration: 1000,
                    easing: 'linear',
                    from: 0.4,
                    to: 0.3,
                }
            } : false,
            plugins: {
                legend: {
                    display: chartOptions.showLegend,
                    position: 'top' as const,
                    labels: {
                        usePointStyle: true,
                        padding: 15,
                        font: {
                            size: 12
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
                    displayColors: true
                }
            },
            scales: {
                x: {
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
                        },
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
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
                }
            }
        }
    };
}