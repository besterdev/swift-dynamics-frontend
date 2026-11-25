import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import type { HTMLAttributes } from 'react'
import { Button } from '@/components/ui/button'

export const SortControls = ({
  label,
  handle,
  moveUp,
  moveDown,
}: {
  label: string
  handle: HTMLAttributes<HTMLSpanElement>
  moveUp?: () => void
  moveDown?: () => void
}) => {
  return (
    <div className="flex shrink-0 items-center gap-0.5 text-muted-foreground">
      <span
        {...handle}
        data-sort-grip
        draggable
        aria-hidden="true"
        title={'Drag ' + label + ' to reorder'}
        className="grid size-7 cursor-grab touch-none place-items-center rounded-md border border-border bg-muted select-none hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="size-4" />
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={'Move ' + label + ' up'}
        disabled={!moveUp}
        onClick={moveUp}
      >
        <ArrowUp />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        aria-label={'Move ' + label + ' down'}
        disabled={!moveDown}
        onClick={moveDown}
      >
        <ArrowDown />
      </Button>
    </div>
  )
}
