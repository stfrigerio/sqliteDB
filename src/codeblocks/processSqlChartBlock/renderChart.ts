import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

function getObsidianTextColor(): string {
    // Get the computed color from Obsidian's CSS variables
    const style = getComputedStyle(document.body);
    return style.getPropertyValue('--text-normal').trim() || '#dcddde';
}

function applyThemeColors(chartConfig: any) {
    const textColor = getObsidianTextColor();

    // Apply text color to all text elements in the chart
    if (chartConfig.options) {
        // Initialize plugins object if it doesn't exist
        if (!chartConfig.options.plugins) {
            chartConfig.options.plugins = {};
        }

        // Legend text color
        if (!chartConfig.options.plugins.legend) {
            chartConfig.options.plugins.legend = {};
        }
        if (!chartConfig.options.plugins.legend.labels) {
            chartConfig.options.plugins.legend.labels = {};
        }

        // Store the original generateLabels function if it exists
        const originalGenerateLabels = chartConfig.options.plugins.legend.labels.generateLabels;

        // Set the text color
        chartConfig.options.plugins.legend.labels.color = textColor;

        // If there's a custom generateLabels function, wrap it to add color and hidden styling
        if (originalGenerateLabels) {
            chartConfig.options.plugins.legend.labels.generateLabels = function(chart: any) {
                const labels = originalGenerateLabels(chart);
                // Add the text color to each generated label and apply gray style to hidden items
                return labels.map((label: any) => ({
                    ...label,
                    fontColor: label.hidden ? 'rgba(128, 128, 128, 0.5)' : (label.fontColor || textColor)
                }));
            };
        } else {
            // For charts without custom generateLabels (line, bar), add a default handler
            chartConfig.options.plugins.legend.labels.generateLabels = function(chart: any) {
                const original = Chart.defaults.plugins.legend.labels.generateLabels;
                const labels = original.call(this, chart);
                return labels.map((label: any) => ({
                    ...label,
                    fontColor: label.hidden ? 'rgba(128, 128, 128, 0.5)' : textColor
                }));
            };
        }

        // Tooltip text color
        if (!chartConfig.options.plugins.tooltip) {
            chartConfig.options.plugins.tooltip = {};
        }
        chartConfig.options.plugins.tooltip.titleColor = textColor;
        chartConfig.options.plugins.tooltip.bodyColor = textColor;

        // X-axis text color
        if (chartConfig.options.scales?.x?.ticks) {
            chartConfig.options.scales.x.ticks.color = textColor;
        }

        // Y-axis text color
        if (chartConfig.options.scales?.y?.ticks) {
            chartConfig.options.scales.y.ticks.color = textColor;
        }
    }

    return chartConfig;
}

export function renderChart(chartConfig: any, container: HTMLElement) {
    // Set container styles to prevent layout shifts
    container.style.width = '100%';
    container.style.display = 'block';
    container.style.position = 'relative';

    // Create canvas element for the chart
    const canvas = container.createEl('canvas');

    // Set canvas dimensions - remove maxWidth to allow full width
    canvas.style.width = '100%';
    canvas.style.height = '400px';

    // Apply Obsidian theme colors
    const themedConfig = applyThemeColors(chartConfig);

    // Ensure responsive is true and maintainAspectRatio is false for consistent sizing
    if (!themedConfig.options) {
        themedConfig.options = {};
    }
    themedConfig.options.responsive = true;
    themedConfig.options.maintainAspectRatio = false;

    // Create and render the chart
    new Chart(canvas, themedConfig as ChartConfiguration);
}
