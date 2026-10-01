import { navigate, useRoute } from './lib/router'
import { load } from './lib/storage'
import { Home } from './screens/Home'
import { NewList } from './screens/NewList'
import { Practice } from './screens/Practice'
import { Review } from './screens/Review'

export function App() {
  const route = useRoute()
  switch (route.name) {
    case 'new':
      return <NewList />
    case 'review':
      return <Review />
    case 'practice': {
      const list = load().lists.find((l) => l.id === route.listId)
      if (!list) {
        navigate({ name: 'home' })
        return null
      }
      return <Practice key={list.id} words={list.words} mode="practice" listId={list.id} onExit={() => navigate({ name: 'home' })} />
    }
    default:
      return <Home />
  }
}
