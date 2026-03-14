import { ref } from 'vue'

const MIN_SWIPE_DISTANCE_PX = 60
const HORIZONTAL_SWIPE_RATIO = 1.2

export function useDaySwipe({ onSwipePrevious, onSwipeNext, isDisabled }) {
  const touchStartX = ref(null)
  const touchStartY = ref(null)

  function isInteractiveTarget(target) {
    return Boolean(target?.closest('input, textarea, button, a, label, select, [data-no-day-swipe]'))
  }

  function handleTouchStart(event) {
    if (isDisabled?.()) return
    if (isInteractiveTarget(event.target)) {
      touchStartX.value = null
      touchStartY.value = null
      return
    }

    const touch = event.touches[0]
    touchStartX.value = touch.clientX
    touchStartY.value = touch.clientY
  }

  async function handleTouchEnd(event) {
    if (touchStartX.value === null || touchStartY.value === null) {
      return
    }

    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - touchStartX.value
    const deltaY = touch.clientY - touchStartY.value

    touchStartX.value = null
    touchStartY.value = null

    if (Math.abs(deltaX) < MIN_SWIPE_DISTANCE_PX) {
      return
    }

    if (Math.abs(deltaX) <= Math.abs(deltaY) * HORIZONTAL_SWIPE_RATIO) {
      return
    }

    if (deltaX > 0) {
      await onSwipePrevious?.()
      return
    }

    await onSwipeNext?.()
  }

  function handleTouchCancel() {
    touchStartX.value = null
    touchStartY.value = null
  }

  return {
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  }
}
