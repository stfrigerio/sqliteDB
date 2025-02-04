export interface SqlParams {
    table?: string;
    keyColumn?: string;
    value?: string;
    columns?: string;
    dateColumn?: string;
    startDate?: string;
    endDate?: string;
    filterColumn?: string;
    filterValue?: string;
    orderBy?: string;
    orderDirection?: string;
    limit?: number;
}

export interface ValidationError {
    message: string;
    availableColumns?: string[];
}

