"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createProject, updateProject, ProjectData } from "@/actions/cms-projects";
import { generateProject } from "@/actions/ai-generate";
import { Loader2, Sparkles, Save, ArrowLeft, Star, Eye } from "lucide-react";
import Link from "next/link";

interface ProjectFormProps {
  initialData?: any;
  mode: "create" | "edit";
}

export function ProjectForm({ initialData, mode }: ProjectFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(initialData?.title || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [content, setContent] = useState(initialData?.content || "");
  const [demoUrl, setDemoUrl] = useState(initialData?.demo_url || "");
  const [repoUrl, setRepoUrl] = useState(initialData?.repo_url || "");
  const [featured, setFeatured] = useState(initialData?.featured || false);
  const [techStack, setTechStack] = useState<string[]>(initialData?.tech_stack || []);
  const [techInput, setTechInput] = useState("");

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

  const handleGenerate = async () => {
    setGenerating(true);
    setError("");

    try {
      const result = await generateProject();
      if (result.success && result.data) {
        setTitle(result.data.title);
        setSlug(result.data.slug || generateSlug(result.data.title));
        setDescription(result.data.description);
        setContent(result.data.content);
        setTechStack(result.data.tech_stack || []);
        setDemoUrl(result.data.demo_url || "");
        setRepoUrl(result.data.repo_url || "");
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

    const projectData: ProjectData = {
      title,
      slug: slug || generateSlug(title),
      description,
      content: content || undefined,
      tech_stack: techStack,
      demo_url: demoUrl || undefined,
      repo_url: repoUrl || undefined,
      featured,
    };

    try {
      let result;
      if (mode === "create") {
        result = await createProject(projectData);
      } else {
        result = await updateProject(initialData.id, projectData);
      }

      if (result.success) {
        router.push("/cms/projects");
        router.refresh();
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
    <div className="w-full">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/cms/projects"
          className="p-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
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

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
            Detailed Content (Markdown, optional)
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={12}
            className="w-full bg-transparent border border-border px-4 py-3 text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-y font-mono text-sm"
            placeholder="Detailed project description in Markdown..."
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
  );
}
