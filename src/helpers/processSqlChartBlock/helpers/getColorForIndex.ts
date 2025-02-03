export function getColorForIndex(index: number, alpha: number = 1): string {
    const colors = [
        `rgba(255, 99, 132, ${alpha})`,   // red
        `rgba(54, 162, 235, ${alpha})`,   // blue
        `rgba(75, 192, 192, ${alpha})`,   // green
        `rgba(255, 206, 86, ${alpha})`,   // yellow
        `rgba(153, 102, 255, ${alpha})`,  // purple
        `rgba(255, 159, 64, ${alpha})`,   // orange
    ];
    return colors[index % colors.length];
}