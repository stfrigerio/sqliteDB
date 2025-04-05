//? Expected structure from DB fetch (aliased)
export interface BooleanRecord {
    value: 0 | 1; //? Expecting 0 or 1 specifically
}

//? Base arguments for identifying an entry
export interface BooleanSwitchDataArgs {
    table: string;
    habitKey: string; 
    date: string;
    habitIdCol: string; //? Column name for the 'habitKey'
    valueCol: string; //? Column name for the 0/1 value
    dateCol: string;
}

//? Arguments for upserting the boolean value
export interface UpsertBooleanSwitchArgs extends BooleanSwitchDataArgs {
    newValue: 0 | 1; //? The new state (0 or 1)
}