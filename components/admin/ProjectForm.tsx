"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createProjectWithImage, updateProjectWithImage } from "@/actions/cms-projects";
import { uploadContentImage } from "@/actions/upload-image";
import { generateProject } from "@/actions/ai-generate";
import { Loader2, Sparkles, Save, ArrowLeft, Star, Eye, X, Upload, Trash2 } from "lucide-react";
import { useConfirm } from "./ConfirmModal";
import { getPbImage } from "@/lib/pocketbase";
import Image from "next/image";
import { NovelEditor } from "./NovelEditor";

interface ProjectFormProps {
  initialData?: any;
  mode: "create" | "edit";
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
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
  const [description, setDescription] = useState(initialData?.description || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [editorKey, setEditorKey] = useState(0);
  const [demoUrl, setDemoUrl] = useState(initialData?.demo_url || "");
  const [repoUrl, setRepoUrl] = useState(initialData?.repo_url || "");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [techStack, setTechStack] = useState<string[]>(initialData?.tech_stack || []);
  const [techInput, setTechInput] = useState("");
  
  // Image upload state
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [existingImage, setExistingImage] = useState<string>(initialData?.image || "");
  const [removeImage, setRemoveImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Initialize existing image preview
  useEffect(() => {
    if (initialData?.image && initialData?.collectionId && initialData?.id) {
      setImagePreview(getPbImage(initialData.collectionId, initialData.id, initialData.image));
    }
  }, [initialData]);

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

  const handleAddTech = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && techInput.trim()) {
      e.preventDefault();
      if (!techStack.includes(techInput.trim())) {
        setTechStack([...techStack, techInput.trim()]);
      }
      setTechInput("");
    }
  };

  const handleRemoveTech = (techToRemove: string) => {
    setTechStack(techStack.filter((t) => t !== techToRemove));
  };
  
  // Image resize utility - resize to Full HD (1920x1080) maintaining aspect ratio
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      img.onload = () => {
        const targetWidth = 1920;
        const targetHeight = 1080;
        
        // Calculate dimensions maintaining aspect ratio with cover behavior
        const srcRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;
        
        let drawWidth = targetWidth;
        let drawHeight = targetHeight;
        let offsetX = 0;
        let offsetY = 0;
        
        if (srcRatio > targetRatio) {
          // Image is wider - fit height, crop width
          drawWidth = img.height * targetRatio;
          offsetX = (img.width - drawWidth) / 2;
          drawWidth = img.width;
          drawHeight = img.width / targetRatio;
          offsetY = (img.height - drawHeight) / 2;
        } else {
          // Image is taller - fit width, crop height  
          drawHeight = img.width / targetRatio;
          offsetY = (img.height - drawHeight) / 2;
          drawHeight = img.height;
          drawWidth = img.height * targetRatio;
          offsetX = (img.width - drawWidth) / 2;
        }
        
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        
        if (!ctx) {
          resolve(file);
          return;
        }
        
        // Draw resized image
        ctx.drawImage(
          img,
          Math.max(0, offsetX), Math.max(0, offsetY),
          Math.min(img.width, drawWidth), Math.min(img.height, drawHeight),
          0, 0,
          targetWidth, targetHeight
        );
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.9);
      };
      
      img.onerror = () => resolve(file);
      img.src = URL.createObjectURL(file);
    });
  };

  // Image upload handlers
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const resizedFile = await resizeImage(file);
      setImageFile(resizedFile);
      setRemoveImage(false);
      const previewUrl = URL.createObjectURL(resizedFile);
      setImagePreview(previewUrl);
      setHasUnsavedChanges(true);
    }
  };
  
  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview("");
    setRemoveImage(true);
    setExistingImage("");
    setHasUnsavedChanges(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleImagePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;
        
        // Validate file size (5MB before resize)
        if (file.size > 5 * 1024 * 1024) {
          alert("Image must be less than 5MB");
          return;
        }
        
        const resizedFile = await resizeImage(file);
        setImageFile(resizedFile);
        setRemoveImage(false);
        const previewUrl = URL.createObjectURL(resizedFile);
        setImagePreview(previewUrl);
        setHasUnsavedChanges(true);
        return;
      }
    }
  };

  const handleGenerate = async (topic?: string) => {
    setShowAIModal(false);
    setGenerating(true);
    setError("");

    try {
      const result = await generateProject(topic);
      if (result.success && result.data) {
        setTitle(result.data.title);
        setSlug(result.data.slug || generateSlug(result.data.title));
        setDescription(result.data.description);
        setContent(result.data.content);
        setEditorKey(prev => prev + 1); // Force editor remount
        setTechStack(result.data.tech_stack || []);
        setDemoUrl(result.data.demo_url || "");
        setRepoUrl(result.data.repo_url || "");
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
    if (aiMode === "auto") {
      handleGenerate();
    } else {
      handleGenerate(aiTopic || undefined);
    }
  };

  const handlePreview = () => {
    const previewData = {
      title,
      slug: slug || generateSlug(title),
      description,
      content,
      tech_stack: techStack,
      demo_url: demoUrl,
      repo_url: repoUrl,
    };
    localStorage.setItem("project_preview", JSON.stringify(previewData));
    window.open("/preview/projects", "_blank");
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    // Build FormData for image upload
    const formData = new FormData();
    formData.append("title", title);
    formData.append("slug", slug || generateSlug(title));
    formData.append("description", description);
    if (content) formData.append("content", content);
    formData.append("tech_stack", JSON.stringify(techStack));
    if (demoUrl) formData.append("demo_url", demoUrl);
    if (repoUrl) formData.append("repo_url", repoUrl);
    formData.append("featured", featured.toString());
    
    // Add image file if selected
    if (imageFile) {
      formData.append("image", imageFile);
    }
    formData.append("remove_image", removeImage.toString());

    try {
      let result;
      if (mode === "create") {
        result = await createProjectWithImage(formData);
      } else {
        result = await updateProjectWithImage(initialData.id, formData);
      }

      if (result.success) {
        setHasUnsavedChanges(false);
        window.location.href = "/cms/projects";
      } else {
        setError(result.error || "Failed to save project");
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
                AI sedang membuat project...
              </h3>
              <p className="text-muted-foreground text-sm max-w-sm leading-relaxed">
                Mohon tunggu sebentar, AI sedang membuat konten berkualitas untuk project kamu.
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
                router.push("/cms/projects");
              }
            } else {
              router.push("/cms/projects");
            }
          }}
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            {mode === "create" ? "New Project" : "Edit Project"}
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
            disabled={!title || !description}
            className="px-4 py-2 border border-border text-muted-foreground font-medium text-sm uppercase tracking-wider hover:text-foreground hover:border-foreground disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            type="button"
            onClick={handleOpenAIModal}
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
            placeholder="Project name"
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
            placeholder="project-url-slug"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-none"
            placeholder="Brief project description"
            required
          />
        </div>

        {/* Project Image */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Project Image
          </label>
          
          {/* Image Preview */}
          {imagePreview ? (
            <div className="relative mb-4 w-full max-w-md aspect-video border border-border overflow-hidden group">
              <Image
                src={imagePreview}
                alt="Project preview"
                fill
                className="object-cover"
                unoptimized
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div 
              onClick={() => fileInputRef.current?.click()}
              onPaste={handleImagePaste}
              tabIndex={0}
              className="w-full max-w-md aspect-video border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-foreground focus:border-foreground focus:outline-none transition-colors mb-4"
            >
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <span className="text-sm text-muted-foreground">Click to upload or paste image</span>
              <span className="text-xs text-muted-foreground mt-1">PNG, JPG, WebP (max 5MB)</span>
            </div>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          {imagePreview && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-muted-foreground hover:text-foreground underline"
            >
              Change image
            </button>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Detailed Content (optional)
          </label>
          <NovelEditor
            key={editorKey}
            value={content}
            onChange={(val) => {
              setContent(val);
              setHasUnsavedChanges(true);
            }}
            onImageUpload={async (file) => {
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

        {/* Tech Stack */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Tech Stack
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {techStack.map((tech) => (
              <span
                key={tech}
                className="px-3 py-1 bg-foreground/10 text-foreground text-sm inline-flex items-center gap-2"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => handleRemoveTech(tech)}
                  className="text-muted-foreground hover:text-red-500"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={techInput}
            onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={handleAddTech}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
            placeholder="Type technology and press Enter"
          />
        </div>

        {/* URLs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Demo URL
            </label>
            <input
              type="url"
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
              placeholder="https://demo.example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
              Repository URL
            </label>
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
              placeholder="https://github.com/..."
            />
          </div>
        </div>

        {/* Featured */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setFeatured(!featured)}
            className={`p-2 border transition-colors ${
              featured
                ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Star className={`w-5 h-5 ${featured ? "fill-yellow-500" : ""}`} />
          </button>
          <span className="text-sm text-muted-foreground">
            Mark as featured project
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 pt-6 border-t border-border">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !title || !description}
            className="px-6 py-3 bg-foreground text-background font-bold text-sm uppercase tracking-wider hover:bg-foreground/90 disabled:opacity-50 transition-colors inline-flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Project
          </button>
        </div>
      </div>
    </div>

    {/* AI Generate Modal */}
    {showAIModal && (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-background border border-border w-full max-w-md">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="text-lg font-bold text-foreground">Generate with AI</h3>
            <button
              onClick={() => setShowAIModal(false)}
              className="p-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAiMode("auto")}
                className={`flex-1 px-4 py-3 text-sm font-medium uppercase tracking-wider transition-colors ${
                  aiMode === "auto"
                    ? "bg-purple-500 text-white"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Auto Generate
              </button>
              <button
                type="button"
                onClick={() => setAiMode("custom")}
                className={`flex-1 px-4 py-3 text-sm font-medium uppercase tracking-wider transition-colors ${
                  aiMode === "custom"
                    ? "bg-purple-500 text-white"
                    : "border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Custom Topic / URL
              </button>
            </div>
            
            {aiMode === "custom" && (
              <textarea
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                rows={3}
                className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                placeholder="Masukkan topik project atau URL referensi...

Contoh:
- E-commerce platform untuk UMKM
- https://github.com/user/project-name"
              />
            )}
            
            <button
              type="button"
              onClick={handleConfirmGenerate}
              className="w-full px-4 py-3 bg-purple-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-purple-600 transition-colors inline-flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Generate
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
