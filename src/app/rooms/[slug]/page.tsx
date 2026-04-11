import { RoomView } from './room-view';

export async function generateStaticParams() {
  return [];
}

export default async function RoomGateway({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  return (
    <RoomView slug={slug} />
  );
}
