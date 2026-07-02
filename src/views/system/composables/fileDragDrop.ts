export const RESOURCE_DRAG_MIME = 'application/x-xl-resource-items'

export const isResourceDragEvent = (event?: DragEvent) => {
    const types = Array.from(event?.dataTransfer?.types || [])
    return types.includes(RESOURCE_DRAG_MIME)
}
