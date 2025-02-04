import { SqlParams } from "../types";

export function parseSqlParams(source: string): SqlParams | null {
    const lines = source.split("\n");
    const params: Partial<SqlParams> = {};

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        const parts = trimmed.split(":").map((p) => p.trim());
        if (parts.length >= 2) {
            const key = parts[0];
            const val = parts.slice(1).join(":").trim(); // re-join in case there's a colon

            switch (key) {
                case 'columns':
                    params.columns = val.split(',').map(c => c.trim()).join(', ');
                    break;
                case 'filterColumn':
                case 'filterValue':
                    params[key] = val.split(',').map(v => v.trim());
                    break;
                case 'limit':
                    const limitNum = parseInt(val);
                    if (!isNaN(limitNum)) params.limit = limitNum;
                    break;
                case 'orderDirection':
                    if (val.toLowerCase() === 'asc' || val.toLowerCase() === 'desc') {
                        params.orderDirection = val.toLowerCase() as 'asc' | 'desc';
                    }
                    break;
                case 'table':
                    params.table = val;
                    break;
                case 'dateColumn':
                    params.dateColumn = val;
                    break;
                case 'startDate':
                    params.startDate = val;
                    break;
                case 'endDate':
                    params.endDate = val;
                    break;
                case 'orderBy':
                    params.orderBy = val;
                    break;
            }
        }
    }

    // Validate required parameters
    if (!params.table) {
        return null;
    }

    return params as SqlParams;
}