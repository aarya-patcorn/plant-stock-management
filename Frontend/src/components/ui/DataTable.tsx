import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";

export type DataTableProps<TData> = {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  emptyMessage?: string;
  isLoading?: boolean;
  manualSorting?: boolean;
  onSortingChange?: OnChangeFn<SortingState>;
  sorting?: SortingState;
};

const SORT_ICONS: Record<"asc" | "desc" | "none", string> = {
  asc: "↑",
  desc: "↓",
  none: "↕",
};

const BADGE_TYPE_STYLES: Record<string, string> = {
  color: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
  productCategory: "bg-amber-50 text-amber-800 ring-1 ring-amber-200",
  rawMaterialName: "bg-cyan-50 text-cyan-800 ring-1 ring-cyan-200",
  token: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  unit: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  packagingBagColor: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",
};

export function DataBadge({
  children,
  type,
}: {
  children: ReactNode;
  type: "color" | "productCategory" | "rawMaterialName" | "token" | "unit" | "packagingBagColor";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TYPE_STYLES[type]}`}
    >
      {children}
    </span>
  );
}

export function DataTable<TData>({
  columns,
  data,
  emptyMessage = "No data available.",
  isLoading = false,
  manualSorting = false,
  onSortingChange,
  sorting: controlledSorting,
}: DataTableProps<TData>) {
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sorting = controlledSorting ?? internalSorting;
  const handleSortingChange = onSortingChange ?? setInternalSorting;

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    manualSorting,
    onSortingChange: handleSortingChange,
    state: {
      sorting,
    },
  });

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="w-full overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0">
          <thead className="sticky top-0 z-10 bg-slate-900 text-white">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort();
                  const sortDirection = header.column.getIsSorted();
                  const icon = SORT_ICONS[
                    sortDirection === "asc" ? "asc" : sortDirection === "desc" ? "desc" : "none"
                  ];

                  return (
                    <th
                      className="whitespace-nowrap border-b border-slate-800 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide"
                      key={header.id}
                    >
                      {header.isPlaceholder ? null : canSort ? (
                        <button
                          className="flex w-full items-center gap-2 text-left transition-colors hover:text-slate-200"
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          <span className="flex-1">
                            {flexRender(header.column.columnDef.header, header.getContext())}
                          </span>
                          <span className="text-[11px]">{icon}</span>
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-slate-500"
                  colSpan={columns.length || 1}
                >
                  Loading...
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  className="px-4 py-8 text-center text-sm text-slate-500"
                  colSpan={columns.length || 1}
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  className="odd:bg-white even:bg-slate-50 hover:bg-blue-50 transition-colors"
                  key={row.id}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      className="whitespace-nowrap border-b border-slate-100 px-4 py-3 text-sm text-slate-700 align-top"
                      key={cell.id}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}