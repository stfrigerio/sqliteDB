//? Defines the expected structure of a record fetched from the habit table.
export interface HabitRecord {
    value: number; //^ Assuming the column name for the count is 'value'
}

//? Defines the properties needed to identify and update a habit entry.
export interface HabitDataArgs {
    table: string;
    habitKey: string; //^ Assuming the column name for the habit identifier is 'habitKey'
    date: string;
}

//? Combined arguments including the new value for updates.
export interface UpdateHabitDataArgs extends HabitDataArgs {
    newValue: number;
}