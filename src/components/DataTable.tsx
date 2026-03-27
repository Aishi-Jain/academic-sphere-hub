import { ReactNode, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchKey?: string;
  filterKey?: string;
  filterOptions?: { label: string; value: string }[];
  filterPlaceholder?: string;
  pageSize?: number;
  actions?: ReactNode;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchKey,
  filterKey,
  filterOptions,
  filterPlaceholder,
  pageSize = 10,
  actions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let result = data;

    if (searchKey && search) {
      result = result.filter((item) =>
        String(item[searchKey]).toLowerCase().includes(search.toLowerCase())
      );
    }

    if (filterKey && filter !== "all") {
      result = result.filter((item) => String(item[filterKey]) === filter);
    }

    return result;
  }, [data, filter, filterKey, search, searchKey]);

  const totalPages = Math.max(Math.ceil(filtered.length / pageSize), 1);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="space-y-5">
      <div className="data-card">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center">
            {searchKey && (
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search..."
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                  className="pl-11"
                />
              </div>
            )}

            {filterOptions && (
              <div className="w-full max-w-[220px]">
                <select
                  value={filter}
                  onChange={(event) => {
                    setFilter(event.target.value);
                    setPage(0);
                  }}
                  className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-foreground backdrop-blur-xl"
                >
                  <option value="all">{filterPlaceholder || "All"}</option>
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {actions}
        </div>
      </div>

      <div className="data-card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground"
                  >
                    {column.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((item, index) => (
                <tr key={index} className="border-b border-white/6 transition hover:bg-white/[0.03] last:border-0">
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 align-middle text-foreground">
                      {column.render ? column.render(item) : String(item[column.key] ?? "")}
                    </td>
                  ))}
                </tr>
              ))}

              {paged.length === 0 && (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-16 text-center text-sm text-muted-foreground">
                    No data found for the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="data-card flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length === 0 ? 0 : page * pageSize + 1}-
          {Math.min((page + 1) * pageSize, filtered.length)} of {filtered.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            disabled={page === 0}
            onClick={() => setPage((current) => current - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {Array.from({ length: Math.min(totalPages, 5) }, (_, index) => (
            <Button
              key={index}
              variant={page === index ? "default" : "outline"}
              size="icon"
              onClick={() => setPage(index)}
            >
              {index + 1}
            </Button>
          ))}

          <Button
            variant="outline"
            size="icon"
            disabled={page >= totalPages - 1 || filtered.length === 0}
            onClick={() => setPage((current) => current + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
