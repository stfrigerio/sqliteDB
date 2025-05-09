export interface SqlParams {
    table?: string;
    keyColumn?: string;
    value?: string;
    columns?: string;
    dateColumn?: string;
    startDate?: string;
    endDate?: string;
    filterColumn?: string | string[];
    filterValue?: string | string[];
    orderBy?: string;
    orderDirection?: string;
    limit?: number;
    displayFormat?: string;
}

export interface ValidationError {
    message: string;
    availableColumns?: string[];
}

