import { ListPage } from '@/components/layout/ListPage'

export const metadata = { title: 'Хочу посмотреть — CineList' }

export default function WatchlistPage() {
  return (
    <ListPage
      listType="watchlist"
      title="Хочу посмотреть"
      emptyText="Ваш список пуст. Добавьте фильмы, которые хотите посмотреть."
      accentColor="text-violet-400"
    />
  )
}
