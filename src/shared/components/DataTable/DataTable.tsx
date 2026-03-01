import React from 'react';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'center' | 'right';
  width?: string;
  render?: (item: T, index: number) => React.ReactNode;
  headerRender?: () => React.ReactNode;
  className?: string;
  headerClassName?: string;
  hidden?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  emptyMessage?: string;
  onRowHover?: (item: T | null, index: number) => void;
  onRowClick?: (item: T, index: number) => void;
  className?: string;
  rowKey?: (item: T, index: number) => string;
}

export function DataTable<T>({
  columns,
  data,
  emptyMessage = 'No data found',
  onRowHover,
  onRowClick,
  className = '',
  rowKey,
}: DataTableProps<T>): JSX.Element {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right'): string => {
    switch (align) {
      case 'left':
        return styles.alignLeft;
      case 'right':
        return styles.alignRight;
      case 'center':
      default:
        return styles.alignCenter;
    }
  };

  const visibleColumns = columns.filter(col => !col.hidden);

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            {visibleColumns.map((column) => (
              <th
                key={column.key}
                className={`${getAlignmentClass(column.align)} ${column.headerClassName || ''}`}
                style={column.width ? { width: column.width } : undefined}
              >
                {column.headerRender ? column.headerRender() : column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={visibleColumns.length} className={styles.noData}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, index) => (
              <tr
                key={rowKey ? rowKey(item, index) : index}
                onMouseEnter={() => onRowHover?.(item, index)}
                onMouseLeave={() => onRowHover?.(null, -1)}
                onClick={onRowClick ? () => onRowClick(item, index) : undefined}
                style={onRowClick ? { cursor: 'pointer' } : undefined}
              >
                {visibleColumns.map((column) => (
                  <td
                    key={column.key}
                    className={`${getAlignmentClass(column.align)} ${column.className || ''}`}
                  >
                    {column.render ? column.render(item, index) : String(item[column.key as keyof T] || '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

DataTable.displayName = 'DataTable';



