import Link from "next/link";
import { getPostsForCMS, deletePost, togglePostStatus } from "@/actions/cms-posts";
import { Plus } from "lucide-react";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PostActions } from "@/components/admin/PostActions";

export default async function PostsListPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const params = await searchParams;
  const filter = (params.filter as "drafts" | "published" | "all") || "all";
  const result = await getPostsForCMS(filter);

  async function handleDelete(formData: FormData) {
    "use server";
    const id = formData.get("id") as string;
    await deletePost(id);
    revalidatePath("/cms/posts");
    redirect("/cms/posts");
  }

  async function handleToggleStatus(id: string, published: boolean) {
    "use server";
    const result = await togglePostStatus(id, published);
    if (result.success) {
      revalidatePath("/cms/posts");
    }
    return result;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Blog Posts
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your blog articles
          </p>
        </div>
        <Link
          href="/cms/posts/new"
          className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Post
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-4 mb-6 border-b border-border">
        {["all", "published", "drafts"].map((f) => (
          <Link
            key={f}
            href={`/cms/posts${f === "all" ? "" : `?filter=${f}`}`}
            className={`px-4 py-2 text-sm font-medium uppercase tracking-wider transition-colors border-b-2 -mb-px ${
              filter === f
                ? "text-foreground border-foreground"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            {f}
          </Link>
        ))}
      </div>

      {/* Posts Table */}
      <div className="border border-border">
        {result.posts.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            No posts found. Create your first post!
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-16">
                  Cover
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {result.posts.map((post: any) => (
                <tr
                  key={post.id}
                  className="border-b border-border last:border-0 hover:bg-foreground/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt=""
                        className="w-12 h-12 object-cover bg-foreground/10"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-foreground/10" />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-foreground">
                      {post.title}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${post.created_by === 'AI' ? 'text-purple-500 font-medium' : 'text-muted-foreground'}`}>
                      {post.created_by || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs font-bold uppercase ${
                        post.published
                          ? "bg-green-500/10 text-green-500"
                          : "bg-yellow-500/10 text-yellow-500"
                      }`}
                    >
                      {post.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {post.created_at || post.published_at
                      ? new Date(post.created_at || post.published_at).toLocaleDateString("id-ID", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-"}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <PostActions 
                      post={post} 
                      onDelete={handleDelete} 
                      onToggleStatus={handleToggleStatus}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

