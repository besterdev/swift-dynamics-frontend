import { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { DragEvent, PointerEvent } from 'react'

const itemMime = 'application/x-feature-flag-sort-item'
const scrollZone = 64

type TouchDrag = { pointerId: number; x: number; y: number; frame: number }
type DragState = { source: string; target: string | null }

export const useListDrag = (
  onMove: (source: string, target: string) => void,
) => {
  const scope = useId()

  const itemAt = (x: number, y: number) => {
    const selector = '[data-sort-scope="' + scope + '"]'
    return (
      document.elementFromPoint(x, y)?.closest<HTMLElement>(selector)?.dataset
        .sortItem ?? null
    )
  }

  const active = useRef<DragState | null>(null)
  const touch = useRef<TouchDrag | null>(null)
  const [drag, setDrag] = useState<DragState | null>(null)

  const update = useCallback((next: DragState | null) => {
    if (
      active.current?.source === next?.source &&
      active.current?.target === next?.target
    )
      return
    active.current = next
    setDrag(next)
  }, [])

  const finish = useCallback(
    (target: string | null) => {
      const source = active.current?.source
      if (touch.current) cancelAnimationFrame(touch.current.frame)
      touch.current = null
      update(null)
      if (source && target && source !== target) onMove(source, target)
    },
    [onMove, update],
  )

  useEffect(
    () => () => {
      if (touch.current) cancelAnimationFrame(touch.current.frame)
    },
    [],
  )

  const trackTouch = () => {
    const pointer = touch.current
    const source = active.current?.source
    if (!pointer || !source) return

    if (pointer.y < scrollZone || pointer.y > window.innerHeight - scrollZone) {
      const direction = pointer.y < scrollZone ? -1 : 1
      const distance =
        direction < 0 ? pointer.y : window.innerHeight - pointer.y
      window.scrollBy(0, direction * Math.min(18, (scrollZone - distance) / 3))
    }

    const target = itemAt(pointer.x, pointer.y)
    update({ source, target: target === source ? null : target })
    pointer.frame = requestAnimationFrame(trackTouch)
  }

  const handleProps = (id: string) => {
    return {
      onDragStart: (event: DragEvent<HTMLSpanElement>) => {
        if (touch.current) {
          event.preventDefault()
          return
        }
        event.dataTransfer.effectAllowed = 'move'
        event.dataTransfer.setData(itemMime, scope + '/' + id)
        update({ source: id, target: null })
      },
      onDragEnd: () => {
        finish(null)
      },
      onPointerDown: (event: PointerEvent<HTMLSpanElement>) => {
        if (event.pointerType !== 'touch' || !event.isPrimary) return
        event.preventDefault()
        event.currentTarget.setPointerCapture(event.pointerId)
        update({ source: id, target: null })
        touch.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          frame: requestAnimationFrame(trackTouch),
        }
      },
      onPointerMove: (event: PointerEvent<HTMLSpanElement>) => {
        const pointer = touch.current
        if (pointer?.pointerId !== event.pointerId) return
        pointer.x = event.clientX
        pointer.y = event.clientY
      },
      onPointerUp: (event: PointerEvent<HTMLSpanElement>) => {
        if (touch.current?.pointerId === event.pointerId)
          finish(itemAt(event.clientX, event.clientY))
      },
      onLostPointerCapture: (event: PointerEvent<HTMLSpanElement>) => {
        if (touch.current?.pointerId === event.pointerId) finish(null)
      },
    }
  }

  const dropProps = (id: string) => {
    return {
      'data-sort-item': id,
      'data-sort-scope': scope,
      onDragOver: (event: DragEvent<HTMLDivElement>) => {
        const source = active.current?.source
        if (
          !source ||
          source === id ||
          !event.dataTransfer.types.includes(itemMime)
        )
          return
        event.preventDefault()
        event.stopPropagation()
        event.dataTransfer.dropEffect = 'move'
        update({ source, target: id })
      },
      onDrop: (event: DragEvent<HTMLDivElement>) => {
        const source = active.current?.source
        if (
          !source ||
          event.dataTransfer.getData(itemMime) !== scope + '/' + source
        )
          return
        event.preventDefault()
        event.stopPropagation()
        finish(id)
      },
    }
  }

  const dropClass = (id: string) => {
    if (drag?.source === id) return 'opacity-50'
    if (drag?.target === id)
      return 'rounded-lg ring-2 ring-editor-accent ring-offset-2 ring-offset-background'
  }

  return { dropClass, handleProps, dropProps }
}
