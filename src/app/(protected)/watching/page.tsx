import { ListPage } from '@/components/layout/ListPage'

export const metadata = { title: 'Смотрю — CineList' }

export default function WatchingPage() {
  return (
    <ListPage
      listType="watching"
      title="Смотрю сейчас"
      emptyText="Здесь будут фильмы, которые вы смотрите прямо сейчас."
      accentColor="text-blue-400"
    />
  )
}
