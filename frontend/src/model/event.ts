/** カレンダー UI 上で表示・編集するイベント詳細 */
export type EventDetail = {
  id: string;
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  description: string | null;
  location: string | null;
  category: string | null;
};
