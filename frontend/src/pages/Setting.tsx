import { Link } from 'react-router-dom'
import { Text } from '@/ui/common/Text.tsx'

export function Setting() {
  return (
    <div className="mx-20 mt-6 flex flex-col justify-center gap-4">
      <Link
        to="/setting/account"
        className="flex items-center justify-center rounded-lg bg-secondary py-1"
        aria-label="アカウント設定"
      >
        <Text size="xl">アカウント設定</Text>
      </Link>
      <Link
        to="/setting/theme"
        className="flex items-center justify-center rounded-lg bg-secondary py-1"
        aria-label="画面のテーマ"
      >
        <Text size="xl">画面のテーマ</Text>
      </Link>
    </div>
  )
}
