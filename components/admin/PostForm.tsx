"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, PostData } from "@/actions/cms-posts";
import { generateBlogPost } from "@/actions/ai-generate";
import { Loader2, Sparkles, Save, Send, ArrowLeft, Eye } from "lucide-react";
import Link from "next/link";

interface PostFormProps {
  initialData?: any;
  mode: "create" | "edit";
}

export function PostForm({ initialData, mode }: PostFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (mode === "create" && !slug) {
      setSlug(generateSlug(value));
    }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const result = await generateBlogPost();
      if (result.success && result.data) {
        setTitle(result.data.title);
        setSlug(result.data.slug || generateSlug(result.data.title));
        setExcerpt(result.data.excerpt);
        setContent(result.data.content);
        setTags(result.data.tags || []);
      } else {
        setError(result.error || "Failed to generate content");
      }
    } catch {
      setError("An error occurred during generation");
    } finally {
      setGenerating(false);
    }
  };

  const handlePreview = () => {
    const previewData = {
      title,
      slug: slug || generateSlug(title),
      excerpt,
      content,
      cover_image: coverImage,
      tags,
      published_at: new Date().toISOString(),
    };
    localStorage.setItem("blog_preview", JSON.stringify(previewData));
    window.open("/preview/posts", "_blank");
  };

  const handleSubmit = async (publish: boolean) => {
    setLoading(true);
    setError("");

    const postData: PostData = {
      title,
      slug: slug || generateSlug(title),
      content,
      excerpt,
      cover_image: coverImage || undefined,
      published: publish,
      tags,
    };

    try {
      let result;
      if (mode === "create") {
        result = await createPost(postData);
      } else {
        result = await updatePost(initialData.id, postData);
      }

      if (result.success) {
        router.push("/cms/posts");
        router.refresh();
      } else {
        setError(result.error || "Failed to save post");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/cms/posts"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {mode === "create" ? "New Post" : "Edit Post"}
          </h1>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-500">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* AI Generate Button */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handlePreview}
            disabled={!title || !content}
            className="px-4 py-2 border border-border text-muted-foreground font-medium text-sm uppercase tracking-wider hover:text-foreground hover:border-foreground disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 border border-purple-500 text-purple-500 font-medium text-sm uppercase tracking-wider hover:bg-purple-500 hover:text-white disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {generating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate with AI
              </>
            )}
          </button>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="Enter post title"
            required
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Slug
          </label>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all font-mono text-sm"
            placeholder="post-url-slug"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Excerpt
          </label>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={2}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-none"
            placeholder="Brief summary of the post"
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Content (Markdown)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={20}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-y font-mono text-sm"
            placeholder="Write your post content in Markdown..."
            required
          />
        </div>

        {/* Cover Image URL */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Cover Image URL (optional)
          </label>
          <input
            type="url"
            value={coverImage}
            onChange={(e) => setCoverImage(e.target.value)}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Tags
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 bg-foreground/10 text-foreground text-sm inline-flex items-center gap-2"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="Type tag and press Enter"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={loading || !title || !content}
            className="px-6 py-3 border border-foreground text-foreground font-bold text-sm uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(true)}
            disabled={loading || !title || !content}
            className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            Publish
          </button>
        </div>
      </div>
    </div>
  );
}
