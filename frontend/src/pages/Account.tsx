import { getUserId } from '@/api/userId.ts';
import { Text } from '@/ui/common/Text.tsx';
import { useAuth } from '../contexts/AuthContext';

export function Account() {
	const userId = getUserId();
	const { user } = useAuth();

	return (
		<div className="mx-20 mt-6 flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<p>ユーザー情報</p>
				{/* ユーザー名情報の表示は以下の形式 */}
				<div className="mb-4">
					{/* <p>ユーザー名: {user?.name}</p> */}
					<Text size="sm" color="muted">
						ユーザーID:{' '}
					</Text>
					<Text weight="medium">{user?.id}</Text>
					<Text size="sm" color="muted">
						ユーザーEメール:{' '}
					</Text>
					<Text weight="medium">{user?.email}</Text>
				</div>
			</div>
		</div>
	);
}
