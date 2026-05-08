import { ListPage } from '@/components/layout/ListPage'

export const metadata = { title: 'Избранное — CineList' }

export default function FavoritesPage() {
  return (
    <ListPage
      listType="favorites"
      title="Избранное"
      emptyText="В избранном пока ничего нет."
      accentColor="text-pink-400"
    />
  )
}
