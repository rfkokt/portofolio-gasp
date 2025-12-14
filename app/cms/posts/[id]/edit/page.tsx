import { getPostById } from "@/actions/cms-posts";
import { PostForm } from "@/components/admin/PostForm";
import { notFound } from "next/navigation";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getPostById(id);

  if (!result.success || !result.post) {
    notFound();
  }

  return <PostForm mode="edit" initialData={result.post} />;
}
