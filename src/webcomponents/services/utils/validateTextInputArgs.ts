// src/webcomponents/services/utils/validateTextInputArgs.ts
import { TextDataArgs, UpsertTextArgs } from "src/webcomponents/TextInput/TextInput.types";

const IDENTIFIER_REGEX = /^[a-zA-Z0-9_]+$/;

/** //? Validates base arguments required for identifying text input data row by date. */
export function validateBaseTextArgs(args: TextDataArgs): void {
    if (!args.table || !args.date) { //^ Need table and date
        throw new Error(`Missing required identifying arguments: table='${args.table}', date='${args.date}'`);
    }
     if (!args.valueCol || !IDENTIFIER_REGEX.test(args.valueCol)) { //^ Need value column
        throw new Error(`Invalid or missing value column name: '${args.valueCol}'`);
    }
     if (!args.dateCol || !IDENTIFIER_REGEX.test(args.dateCol)) { //^ Need date column
        throw new Error(`Invalid or missing date column name: '${args.dateCol}'`);
    }
}

/** //? Validates arguments required for upserting text input data. */
export function validateUpsertTextArgs(args: UpsertTextArgs): void {
    validateBaseTextArgs(args);
    if (typeof args.newValue !== 'string' && args.newValue !== null) {
        throw new Error(`Invalid or missing newValue: '${args.newValue}'`);
    }
}