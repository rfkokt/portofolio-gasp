"use client";

import { useState } from "react";
import { Eye, ToggleLeft, ToggleRight, Edit, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DeleteButton } from "./DeleteButton";

interface PostActionsProps {
  post: {
    id: string;
    title: string;
    slug: string;
    excerpt?: string;
    content: string;
    cover_image?: string;
    published: boolean;
    tags?: string[];
  };
  onDelete: (formData: FormData) => Promise<void>;
  onToggleStatus: (id: string, published: boolean) => Promise<{ success: boolean; error?: string }>;
}

export function PostActions({ post, onDelete, onToggleStatus }: PostActionsProps) {
  const router = useRouter();
  const [toggling, setToggling] = useState(false);

  const handlePreview = () => {
    const previewData = {
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || "",
      content: post.content,
      cover_image: post.cover_image || "",
      tags: post.tags || [],
      published_at: new Date().toISOString(),
    };
    localStorage.setItem("blog_preview", JSON.stringify(previewData));
    window.open("/preview/posts", "_blank");
  };

  const handleToggleStatus = async () => {
    setToggling(true);
    try {
      const result = await onToggleStatus(post.id, !post.published);
      if (result.success) {
        router.refresh();
      }
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-1">
      {/* Preview */}
      <button
        type="button"
        onClick={handlePreview}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Preview"
      >
        <Eye className="w-4 h-4" />
      </button>

      {/* Toggle Status */}
      <button
        type="button"
        onClick={handleToggleStatus}
        disabled={toggling}
        className={`p-2 transition-colors ${
          post.published
            ? "text-green-500 hover:text-yellow-500"
            : "text-yellow-500 hover:text-green-500"
        }`}
        title={post.published ? "Ubah ke Draft" : "Publish"}
      >
        {toggling ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : post.published ? (
          <ToggleRight className="w-4 h-4" />
        ) : (
          <ToggleLeft className="w-4 h-4" />
        )}
      </button>

      {/* Edit */}
      <Link
        href={`/cms/posts/${post.id}/edit`}
        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </Link>

      {/* Delete */}
      <DeleteButton id={post.id} onDelete={onDelete} itemName={post.title} />
    </div>
  );
}
