import React, { useState, useMemo } from "react";
import './DataTable.css';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";



// Mapping of backend column keys → dashboard-friendly names
const COLUMN_LABELS = {
  id: "#",
  security: "Security",
  recorded_at: "Recorded At",
  diff_percent: "Buy Dominance (%)",
  total_bid_splits: "Number of ppl buying",
  total_ask_splits: "Number of ppl selling",
  total_bid: "Total Bid",
  total_ask: "Total Ask",
  top_bid_qty: "Top Bid Qty",
  top_bid_price: "Most Bid Price",
  current_bid_price: "Current Bid Price",
  bid_dominance: "Ppl Count: Buy vs Sell (%)",
};

// Add this constant at the top with your other constants
const COLUMN_ORDER = [
  "id",
  "security",
  "recorded_at",
  "diff_percent",
  "bid_dominance",
  "total_bid_splits",
  "total_ask_splits",
  "total_bid",
  "total_ask",
  "top_bid_qty",
  "top_bid_price",
  "current_bid_price"
  
];

export default function DataTable({ data }) {
  const [sorting, setSorting] = useState([]);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  // Helper function to format cell values
  const formatValue = (col, value) => {
    if (value === null || value === undefined) return "-";
    
    if (col === "recorded_at") {
      return new Date(value).toLocaleString();
    }
    
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && typeof value !== "boolean") {
      return numValue.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    }
    
    return value;
  };

  // Define columns
  const columns = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return COLUMN_ORDER
      .filter(key => key in data[0])
      .map((key) => ({
        accessorKey: key,
        header: COLUMN_LABELS[key] || key.replace(/_/g, " ").toUpperCase(),
        cell: (info) => formatValue(key, info.getValue()),
        sortingFn: (rowA, rowB, columnId) => {
          const a = rowA.getValue(columnId);
          const b = rowB.getValue(columnId);
          
          const aNum = parseFloat(a);
          const bNum = parseFloat(b);
          
          if (!isNaN(aNum) && !isNaN(bNum)) {
            return aNum > bNum ? 1 : aNum < bNum ? -1 : 0;
          }
          
          return String(a).localeCompare(String(b));
        },
      }));
  }, [data]);

  const table = useReactTable({
    data: data || [],
    columns,
    state: {
      sorting,
      pagination,
    },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (!data || data.length === 0) {
    return <p className="text-center text-gray-500">No data available.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="values">
        <div>
          <label>Show: </label>
          <select value={table.getState().pagination.pageSize} onChange={(e) => table.setPageSize(Number(e.target.value))}>
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span> entries</span>
        </div>
        <div>
          Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
          {Math.min(
            (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
            table.getFilteredRowModel().rows.length
          )}{" "}
          of {table.getFilteredRowModel().rows.length} entries
        </div>
      </div>

      {/* Table */}
      <div className="Table overflow-x-auto bg-white rounded shadow">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100 border-b">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="text-left px-4 py-2 font-semibold text-gray-700 whitespace-nowrap cursor-pointer hover:bg-gray-200 select-none"
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      <span className="text-xs">
                        {{
                          asc: "▲",
                          desc: "▼",
                        }[header.column.getIsSorted()] ?? <span className="text-gray-400">⇅</span>}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, i) => (
              <tr
                key={row.id}
                className={`border-b hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-2 text-sm text-gray-800 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="Pagination">
          <button
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            ««
          </button>
          <button
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            «
          </button>

          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>

          <button
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            »
          </button>
          <button
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
            className="px-3 py-1 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
          >
            »»
          </button>
        </div>
      )}
    </div>
  );
}