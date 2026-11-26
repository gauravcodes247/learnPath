import { useCallback, useEffect, useState } from 'react'
import { api } from '../api'

// Client-side cache on top of the server's TTL cache: switching between
// pages doesn't refetch. Kept in sessionStorage so a page reload is instant too.
const CLIENT_TTL_MS = 5 * 60 * 1000
const keyFor = (userId) => `lp-reco-${userId}`

function readCache(userId) {
  try {
    const hit = JSON.parse(sessionStorage.getItem(keyFor(userId)))
    return hit && Date.now() - hit.at < CLIENT_TTL_MS ? hit.data : null
  } catch {
    return null
  }
}

export function clearRecommendationCache(userId) {
  try {
    sessionStorage.removeItem(keyFor(userId))
  } catch {
    /* storage unavailable */
  }
}

// status: 'loading' | 'ready' | 'empty' | 'error'
export function useRecommendations(userId) {
  const [state, setState] = useState(() => {
    const cached = readCache(userId)
    return cached
      ? { status: cached.status === 'no-data' ? 'empty' : 'ready', data: cached, error: null }
      : { status: 'loading', data: null, error: null }
  })

  const load = useCallback(
    async (refresh = false) => {
      if (!userId) return
      if (!refresh) {
        const cached = readCache(userId)
        if (cached) {
          setState({ status: cached.status === 'no-data' ? 'empty' : 'ready', data: cached, error: null })
          return
        }
      }
      setState((s) => ({ ...s, status: 'loading', error: null }))
      try {
        const data = await api.get(`/students/${userId}/recommendations${refresh ? '?refresh=true' : ''}`)
        try {
          sessionStorage.setItem(keyFor(userId), JSON.stringify({ at: Date.now(), data }))
        } catch {
          /* storage unavailable */
        }
        setState({ status: data.status === 'no-data' ? 'empty' : 'ready', data, error: null })
      } catch (err) {
        setState({ status: 'error', data: null, error: err.message })
      }
    },
    [userId],
  )

  useEffect(() => {
    load()
  }, [load])

  return { ...state, reload: () => load(false), regenerate: () => load(true) }
}
