import { getColorForIndex } from './getColorForIndex';
import { ChartConfig, TimeSeriesChartConfig, PieChartConfig } from './parseChartParams';

function isTimeSeriesConfig(config: ChartConfig): config is TimeSeriesChartConfig {
    return config.chartType === 'line' || config.chartType === 'bar';
}

function isPieConfig(config: ChartConfig): config is PieChartConfig {
    return config.chartType === 'pie';
}

function formatSeconds(totalSeconds: number): string {
	const hrs = Math.floor(totalSeconds / 3600);
	const mins = Math.floor((totalSeconds % 3600) / 60);
	const secs = Math.floor(totalSeconds % 60);

	const pad = (n: number) => String(n).padStart(2, '0');
	return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
}

export function processChartData(rowObj: any, config: ChartConfig) {
	if (isPieConfig(config)) {
		const isDuration = config.table === 'Time' && config.valueColumn === 'duration';

		const labels = rowObj.values.map((row: any[]) => {
			const label = row[0];
			const value = row[1];
			return isDuration ? `${label} | ${formatSeconds(value)}` : label;
		});

		const datasets = [{
			data: rowObj.values.map((row: any[]) => row[1]),
			label: config.valueColumn
		}];

		return { labels, datasets };
	}

	let labels: any[];
	let datasets: any[];

	if (config.categoryColumn) {
		const { labels: groupLabels, datasets: groupDatasets } = processGroupedData(rowObj, config);
		labels = groupLabels;
		datasets = groupDatasets;
	} else {
		labels = rowObj.values.map((row: any[]) => row[0]);
		datasets = processUngroupedData(rowObj, config);
	}

	return { labels, datasets };
}

function processGroupedData(rowObj: any, config: TimeSeriesChartConfig) {
    const groupedData = new Map();
    
    rowObj.values.forEach((row: any[]) => {
        const x = row[0];
        const group = String(row[1]);
        const y = row[2];
        
        if (!groupedData.has(group)) {
            groupedData.set(group, { x: [], y: [] });
        }
        
        groupedData.get(group).x.push(x);
        groupedData.get(group).y.push(y);
    });

    const labels = Array.from(groupedData.values())[0].x;
    const datasets = Array.from(groupedData.entries()).map(([group, data], index) => ({
        label: group,
        data: data.y,
        borderColor: getColorForIndex(index),
        backgroundColor: getColorForIndex(index, 0.2),
        fill: false,
        tension: 0.1
    }));

    return { labels, datasets };
}

function processUngroupedData(rowObj: any, config: TimeSeriesChartConfig) {
    if (config.chartType === 'line') {
        return [{
            label: config.yColumns[0],
            data: rowObj.values.map((row: any[]) => row[1]),
            borderColor: getColorForIndex(0),
            backgroundColor: getColorForIndex(0, 0.2),
            fill: false,
            tension: 0.1
        }];
    }

    if (config.chartType === 'bar') {
        return [{
            label: config.yColumns[0],
            data: rowObj.values.map((row: any[]) => row[1]),
            backgroundColor: getColorForIndex(0, 0.6),
            hoverBackgroundColor: getColorForIndex(0, 0.8),
            borderColor: getColorForIndex(0),
            borderWidth: 1
        }];
    }

    return config.yColumns.map((col: string, index: number) => ({
        label: col,
        data: rowObj.values.map((row: any[]) => row[index + 1]),
        borderColor: getColorForIndex(index),
        backgroundColor: getColorForIndex(index, 0.2),
        fill: false,
        tension: 0.1
    }));
}