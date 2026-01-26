export interface TabLine {
    id: string;
    strings: string[];
}

export interface ActiveCell {
    lineId: string;
    stringIndex: number;
    position: number;
}