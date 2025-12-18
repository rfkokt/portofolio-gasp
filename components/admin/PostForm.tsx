"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createPost, updatePost, PostData } from "@/actions/cms-posts";
import { uploadContentImage } from "@/actions/upload-image";
import { generateBlogPost } from "@/actions/ai-generate";
import { Loader2, Sparkles, Save, Send, ArrowLeft, Eye, X } from "lucide-react";
import Link from "next/link";
import { useConfirm } from "./ConfirmModal";
import { NovelEditor } from "./NovelEditor";
import { SeoScoreCard } from "./SeoScoreCard";

interface PostFormProps {
  initialData?: any;
  mode: "create" | "edit";
}

export function PostForm({ initialData, mode }: PostFormProps) {
  const router = useRouter();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // AI Generation Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiMode, setAiMode] = useState<"auto" | "custom">("auto");

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [editorKey, setEditorKey] = useState(0);
  const [coverImage, setCoverImage] = useState(initialData?.cover_image || "");
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState("");

  // Use ref for beforeunload to allow immediate disable
  const hasUnsavedChangesRef = useRef(hasUnsavedChanges);
  hasUnsavedChangesRef.current = hasUnsavedChanges;

  // Warn user before leaving if there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = "Kamu memiliki perubahan yang belum disimpan. Yakin ingin keluar?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

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

  const handleGenerate = async (topic?: string) => {
    setShowAIModal(false);
    setGenerating(true);
    setError("");

    try {
      const result = await generateBlogPost(topic);
      if (result.success && result.data) {
        setTitle(result.data.title);
        setSlug(result.data.slug || generateSlug(result.data.title));
        setExcerpt(result.data.excerpt);
        setContent(result.data.content);
        setEditorKey(prev => prev + 1); // Force editor remount
        setTags(result.data.tags || []);
        setCoverImage(result.data.cover_image || "");
        setHasUnsavedChanges(true); // Mark as unsaved
      } else {
        setError(result.error || "Failed to generate content");
      }
    } catch {
      setError("An error occurred during generation");
    } finally {
      setGenerating(false);
      setAiTopic("");
      setAiMode("auto");
    }
  };

  const handleOpenAIModal = () => {
    setAiTopic("");
    setAiMode("auto");
    setShowAIModal(true);
  };

  const handleConfirmGenerate = () => {
    if (aiMode === "custom" && aiTopic.trim()) {
      handleGenerate(aiTopic.trim());
    } else {
      handleGenerate();
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
        setHasUnsavedChanges(false); // Clear unsaved flag
        window.location.href = "/cms/posts";
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
    <>
      {/* Full Page Loading Overlay during AI Generation */}
      {generating && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-8">
            {/* Animated Icon */}
            <div className="relative">
              <div className="w-16 h-16 border-2 border-border rounded-full" />
              <div className="absolute inset-0 w-16 h-16 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
              <Sparkles className="w-6 h-6 text-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            
            {/* Text */}
            <div className="text-center">
              <h3 className="text-2xl font-bold text-foreground mb-3 tracking-tight">
                AI sedang menulis...
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                Mohon tunggu sebentar, AI sedang membuat konten berkualitas untuk blog kamu.
              </p>
            </div>
            
            {/* Progress dots */}
            <div className="flex gap-2">
              <span className="w-2 h-2 bg-foreground rounded-full animate-pulse" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-foreground rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 bg-foreground rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        </div>
      )}

      <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={async () => {
            if (hasUnsavedChanges) {
              const confirmed = await confirm({
                title: "Perubahan Belum Disimpan",
                message: "Kamu memiliki konten yang belum disimpan. Yakin ingin keluar? Perubahan akan hilang.",
                confirmText: "Keluar",
                cancelText: "Tetap di Sini",
                type: "warning",
              });
              if (confirmed) {
                router.push("/cms/posts");
              }
            } else {
              router.push("/cms/posts");
            }
          }}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
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
            onClick={handleOpenAIModal}
            disabled={generating}
            className="px-4 py-2 border border-foreground text-foreground font-medium text-sm uppercase tracking-wider hover:bg-foreground hover:text-background disabled:opacity-50 transition-colors inline-flex items-center gap-2"
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
            Content
          </label>
          <NovelEditor
            key={editorKey}
            value={content}
            onChange={(val: string) => {
              setContent(val);
              setHasUnsavedChanges(true);
            }}
            onImageUpload={async (file: File) => {
              const formData = new FormData();
              formData.append("file", file);
              const result = await uploadContentImage(formData);
              if (result.success && result.url) {
                return result.url;
              }
              throw new Error(result.error || "Failed to upload image");
            }}
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

      <div className="lg:col-span-1 space-y-6">
          <SeoScoreCard 
            title={title} 
            excerpt={excerpt} 
            slug={slug} 
            content={content}
            onOptimize={(optimized) => {
                setTitle(optimized.title);
                setExcerpt(optimized.excerpt);
                setSlug(optimized.slug);
                if (optimized.content && optimized.content !== "$undefined") {
                    setContent(optimized.content);
                    setEditorKey(prev => prev + 1); // Force re-render to reflect content changes
                }
                setHasUnsavedChanges(true);
            }} 
          />
          
           {/* Tags moved here for better layout, or keep them there? Let's duplication check logic later. For now just add sidebar */}
      </div>
    </div>

      {/* AI Generate Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border w-full max-w-lg">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-neutral-800" />
                <h2 className="text-lg font-bold text-foreground">Generate with AI</h2>
              </div>
              <button
                onClick={() => setShowAIModal(false)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              <p className="text-muted-foreground text-sm">
                Pilih bagaimana AI akan membuat konten blog untuk Anda.
              </p>

              {/* Option: Auto Generate */}
              <label className="flex items-start gap-4 p-4 border border-border cursor-pointer hover:border-neutral-800/50 transition-colors group">
                <input
                  type="radio"
                  name="aiMode"
                  value="auto"
                  checked={aiMode === "auto"}
                  onChange={() => setAiMode("auto")}
                  className="mt-1 accent-neutral-800"
                />
                <div className="flex-1">
                  <span className="font-medium text-foreground group-hover:text-neutral-800 transition-colors">
                    Auto Generate
                  </span>
                  <p className="text-muted-foreground text-sm mt-1">
                    Biarkan AI memilih topik trending dari dunia web development, React, atau JavaScript.
                  </p>
                </div>
              </label>

              {/* Option: Custom Topic */}
              <label className="flex items-start gap-4 p-4 border border-border cursor-pointer hover:border-neutral-800/50 transition-colors group">
                <input
                  type="radio"
                  name="aiMode"
                  value="custom"
                  checked={aiMode === "custom"}
                  onChange={() => setAiMode("custom")}
                  className="mt-1 accent-neutral-800"
                />
                <div className="flex-1">
                  <span className="font-medium text-foreground group-hover:text-neutral-800 transition-colors">
                    Custom Topic / Reference
                  </span>
                  <p className="text-muted-foreground text-sm mt-1">
                    Masukkan topik atau referensi spesifik yang ingin dibahas.
                  </p>
                </div>
              </label>

              {/* Custom Topic Input */}
              {aiMode === "custom" && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Topic / Reference
                  </label>
                  <textarea
                    value={aiTopic}
                    onChange={(e) => setAiTopic(e.target.value)}
                    placeholder="Contoh: Next.js 15 Server Actions, atau link artikel yang ingin dibahas..."
                    rows={3}
                    className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-neutral-800 transition-all resize-none text-sm"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
              <button
                type="button"
                onClick={() => setShowAIModal(false)}
                className="px-4 py-2 text-muted-foreground font-medium text-sm uppercase tracking-wider hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerate}
                disabled={aiMode === "custom" && !aiTopic.trim()}
                className="px-6 py-2 bg-neutral-800 text-white font-bold text-sm uppercase tracking-wider hover:bg-neutral-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  );
}
