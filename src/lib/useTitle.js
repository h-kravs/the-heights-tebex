import { useEffect } from 'react'

const BASE = 'The Heights LA | Official Store'

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | The Heights LA` : BASE
  }, [title])
}
