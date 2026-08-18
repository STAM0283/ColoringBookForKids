import { BookEditPage } from "@/components/admin/book-edit-page";

export default async function EditBookPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BookEditPage bookId={id}/>;
}
