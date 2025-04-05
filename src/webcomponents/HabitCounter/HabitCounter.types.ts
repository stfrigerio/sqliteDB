//? Expected structure returned by the data service fetch method.
export interface HabitRecord {
    value: number;
}

//? Base arguments for identifying a habit entry, now includes column names.
export interface HabitDataArgs {
    table: string;
    habitKey: string; //? The *value* identifying the specific habit
    date: string;
    //^ Column Names specified by the user
    habitIdCol: string;
    valueCol: string;
    dateCol: string;
}

//? Arguments for updating, inheriting base args and adding the new value.
export interface UpdateHabitDataArgs extends HabitDataArgs {
    newValue: number;
}