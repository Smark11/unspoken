import { useEffect, useState } from 'react'

export type Route =
  | { name: 'home' }
  | { name: 'new' }
  | { name: 'practice'; listId: string }
  | { name: 'review' }

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, '')
  const [head, arg] = path.split('/')
  if (head === 'new') return { name: 'new' }
  if (head === 'practice' && arg) return { name: 'practice', listId: decodeURIComponent(arg) }
  if (head === 'review') return { name: 'review' }
  return { name: 'home' }
}

export function navigate(route: Route) {
  const to =
    route.name === 'home' ? '#/'
    : route.name === 'new' ? '#/new'
    : route.name === 'review' ? '#/review'
    : `#/practice/${encodeURIComponent(route.listId)}`
  if (location.hash === to) return
  location.hash = to
}

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parseHash(location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}
