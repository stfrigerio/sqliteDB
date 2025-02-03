import { getColorForIndex } from './getColorForIndex';
import { ChartConfig } from './parseChartParams';

export function processChartData(rowObj: any, config: ChartConfig) {
    let labels: any[];
    let datasets: any[];

    if (config.groupBy) {
        const { labels: groupLabels, datasets: groupDatasets } = processGroupedData(rowObj, config);
        labels = groupLabels;
        datasets = groupDatasets;
    } else {
        labels = rowObj.values.map((row: any[]) => row[0]);
        datasets = processUngroupedData(rowObj, config);
    }

    return { labels, datasets };
}

function processGroupedData(rowObj: any, config: ChartConfig) {
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

function processUngroupedData(rowObj: any, config: ChartConfig) {
    return config.yColumns.map((col, index) => ({
        label: col,
        data: rowObj.values.map((row: any[]) => row[index + 1]),
        borderColor: getColorForIndex(index),
        backgroundColor: getColorForIndex(index, 0.2),
        fill: false,
        tension: 0.1
    }));
}