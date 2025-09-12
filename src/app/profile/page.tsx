import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/mock-data';

export default function ProfilePage() {
  const user = getCurrentUser();
  redirect(`/profile/${user.id}`);
}
