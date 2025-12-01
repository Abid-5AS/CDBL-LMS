import { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption } from "./table";

export const ModernTable = Object.assign(Table, {
    Header: TableHeader,
    Body: TableBody,
    Footer: TableFooter,
    Head: TableHead,
    Row: TableRow,
    Cell: TableCell,
    Caption: TableCaption,
});
