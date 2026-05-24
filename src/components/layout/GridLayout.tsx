import React from 'react'
import clsx from 'clsx'

interface GridLayoutProps {
  cols?:     1 | 2 | 3 | 4 | 6 | 12
  rows?:     'auto' | number
  gap?:      'sm' | 'md' | 'lg'
  className?: string
  children:  React.ReactNode
}

const colsMap = {
  1:  'grid-cols-1',
  2:  'grid-cols-2',
  3:  'grid-cols-3',
  4:  'grid-cols-4',
  6:  'grid-cols-6',
  12: 'grid-cols-12',
}
const gapMap = { sm: 'gap-2', md: 'gap-3', lg: 'gap-4' }

export const GridLayout: React.FC<GridLayoutProps> = ({
  cols = 3, rows = 'auto', gap = 'md', className, children,
}) => (
  <div
    className={clsx(
      'grid w-full h-full',
      colsMap[cols],
      gapMap[gap],
      rows !== 'auto' && `grid-rows-${rows}`,
      className,
    )}
  >
    {children}
  </div>
)

interface GridCellProps {
  colSpan?: 1 | 2 | 3 | 4 | 6 | 12
  rowSpan?: 1 | 2 | 3 | 4
  className?: string
  children:  React.ReactNode
}

const colSpanMap = { 1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4', 6: 'col-span-6', 12: 'col-span-12' }
const rowSpanMap = { 1: 'row-span-1', 2: 'row-span-2', 3: 'row-span-3', 4: 'row-span-4' }

export const GridCell: React.FC<GridCellProps> = ({
  colSpan = 1, rowSpan = 1, className, children,
}) => (
  <div className={clsx(colSpanMap[colSpan], rowSpanMap[rowSpan], 'min-h-0', className)}>
    {children}
  </div>
)
