import { getUserId } from '@/api/userId.ts'
import { Text } from '@/ui/common/Text.tsx'

export function Account() {
  const userId = getUserId()

  return (
    <div className="mx-20 mt-6 flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <Text size="sm" color="muted">
          local用ユーザーID
        </Text>
        <Text weight="medium">{userId}</Text>
      </div>
    </div>
  )
}
