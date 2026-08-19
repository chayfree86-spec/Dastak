import React from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import Pagination from './Pagination'
import EmptyState from './EmptyState'
import ErrorState from './ErrorState'
import Skeleton from './Skeleton'

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  error = null,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  pagination,
  onSort,
  sortField,
  sortDirection = 'asc',
  className = '',
  rowKey = 'id',
  onRowClick,
}) {
  const handleSort = (key, sortable) => {
    if (!sortable || !onSort) return
    const nextDir = sortField === key && sortDirection === 'asc' ? 'desc' : 'asc'
    onSort(key, nextDir)
  }

  const getSortIcon = (key, sortable) => {
    if (!sortable) return null
    if (sortField !== key) {
      return <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-60 ml-1" />
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-[#2845D6] dark:text-blue-400 ml-1" />
    ) : (
      <ArrowDown className="w-3 h-3 text-[#2845D6] dark:text-blue-400 ml-1" />
    )
  }

  return (
    <div className={`rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-100/80 dark:bg-slate-900">
              {columns.map((col, cIdx) => (
                <th
                  key={col.key || cIdx}
                  onClick={() => handleSort(col.key, col.sortable)}
                  className={`px-4 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 select-none ${
                    col.sortable ? 'cursor-pointer hover:text-slate-900 dark:hover:text-slate-100' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${
                    col.className || ''
                  }`}
                >
                  <div className={`inline-flex items-center ${col.align === 'right' ? 'justify-end w-full' : ''}`}>
                    <span>{col.header}</span>
                    {getSortIcon(col.key, col.sortable)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-xs text-slate-700 dark:text-slate-200">
            {loading ? (
              Array.from({ length: 6 }).map((_, rIdx) => (
                <tr key={`skel-row-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => (
                    <td key={`skel-cell-${cIdx}`} className="px-4 py-3.5">
                      <Skeleton className="h-4 w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan={columns.length || 1} className="p-6">
                  <ErrorState message={error?.message} onRetry={onRetry} />
                </td>
              </tr>
            ) : !data || data.length === 0 ? (
              <tr>
                <td colSpan={columns.length || 1} className="p-6">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, idx) => {
                const keyVal = row[rowKey] !== undefined ? row[rowKey] : idx
                return (
                  <tr
                    key={keyVal}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/40 ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                  >
                    {columns.map((col, cIdx) => (
                      <td
                        key={`${keyVal}-${col.key || cIdx}`}
                        className={`px-4 py-3.5 align-middle ${
                          col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                        } ${col.className || ''}`}
                      >
                        {col.render
                          ? col.render(row, idx)
                          : row[col.key] !== undefined && row[col.key] !== null
                          ? String(row[col.key])
                          : '-'}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {!loading && !error && data && data.length > 0 && pagination && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  )
}
