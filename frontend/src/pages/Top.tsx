import { Text } from "@/ui/common/Text";

export function Top() {
  return (
    <div className="min-h-svh p-6">
      <Text size="lg" weight="bold" color="primary">
        タイトル
      </Text>
      <Text size="md" weight="medium" color="muted">
        適当に打ったら AI が予定を振り分けてくれる
      </Text>
      <Text size="sm" weight="normal" color="base">
        明日18時から新宿で友達とご飯
      </Text>
    </div>
  );
}
