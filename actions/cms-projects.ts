"use server";

// plain PocketBase import removed
import { logAdminAction } from "./admin-logs";
import { getAdminSession } from "@/lib/admin-auth";

import { createAdminClient } from '@/lib/pb-client';

// Removed global pb
// Removed global pb and authenticateAdmin helper

export interface ProjectData {
  title: string;
  slug: string;
  description: string;
  content?: string;
  tech_stack?: string[];
  demo_url?: string;
  repo_url?: string;
  featured?: boolean;
}

export async function getProjectsForCMS(
  page: number = 1,
  search: string = ""
) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();

    let filterParts: string[] = [];

    // Role-based filter: users can only see their own projects
    if (session && session.role !== 'admin') {
      filterParts.push(`created_by = "${session.username}"`);
    }

    // Search filter
    if (search) {
      filterParts.push(`title ~ "${search}"`);
    }

    const filterQuery = filterParts.join(" && ");

    const result = await pb.collection("projects").getList(page, 10, { 
      filter: filterQuery || undefined,
      sort: '-created_at'
    });

    return { 
      success: true, 
      projects: result.items,
      pagination: {
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      }
    };
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return { 
      success: false, 
      error: error.message, 
      projects: [],
      pagination: {
        page: 1,
        perPage: 10,
        totalItems: 0,
        totalPages: 0
      }
    };
  }
}

export async function getProjectById(id: string) {
  try {
    const pb = await createAdminClient();
    const project = await pb.collection("projects").getOne(id);
    return { success: true, project };
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return { success: false, error: error.message };
  }
}

export async function createProject(data: ProjectData) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();

    const projectData = {
      ...data,
      created_by: session?.username || 'Unknown',
      updated_by: session?.username || 'Unknown',
    };

    const record = await pb.collection("projects").create(projectData);
    await logAdminAction("Create Project", `Created project: ${data.title}`);
    return { success: true, id: record.id };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProject(id: string, data: Partial<ProjectData>) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the project to check ownership
    const project = await pb.collection("projects").getOne(id);
    
    // Role-based validation
    if (session.role !== 'admin') {
      // Users cannot edit AI-created content
      if (project.created_by === 'AI') {
        return { success: false, error: 'Only admins can edit AI-generated content' };
      }
      // Users can only edit their own projects
      if (project.created_by !== session.username) {
        return { success: false, error: 'You can only edit your own projects' };
      }
    }

    await pb.collection("projects").update(id, {
      ...data,
      updated_by: session.username,
    });
    await logAdminAction("Update Project", `Updated project ID: ${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { success: false, error: error.message };
  }
}

// Create project with image file upload support
export async function createProjectWithImage(formData: FormData) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();

    // Extract fields from FormData
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const content = formData.get("content") as string | null;
    const techStackJson = formData.get("tech_stack") as string;
    const demoUrl = formData.get("demo_url") as string | null;
    const repoUrl = formData.get("repo_url") as string | null;
    const featured = formData.get("featured") === "true";
    const imageFile = formData.get("image") as File | null;

    const techStack = techStackJson ? JSON.parse(techStackJson) : [];

    // Prepare data for PocketBase
    const pbFormData = new FormData();
    pbFormData.append("title", title);
    pbFormData.append("slug", slug);
    pbFormData.append("description", description);
    if (content) pbFormData.append("content", content);
    pbFormData.append("tech_stack", JSON.stringify(techStack));
    if (demoUrl) pbFormData.append("demo_url", demoUrl);
    if (repoUrl) pbFormData.append("repo_url", repoUrl);
    pbFormData.append("featured", featured.toString());
    pbFormData.append("created_by", session?.username || "Unknown");
    pbFormData.append("updated_by", session?.username || "Unknown");
    
    // Add image file if present
    if (imageFile && imageFile.size > 0) {
      pbFormData.append("image", imageFile);
    }

    const record = await pb.collection("projects").create(pbFormData);
    await logAdminAction("Create Project", `Created project: ${title}`);
    return { success: true, id: record.id };
  } catch (error: any) {
    console.error("Error creating project with image:", error);
    return { success: false, error: error.message };
  }
}

// Update project with image file upload support
export async function updateProjectWithImage(id: string, formData: FormData) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();

    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // Get the project to check ownership
    const project = await pb.collection("projects").getOne(id);

    // Role-based validation
    if (session.role !== "admin") {
      if (project.created_by === "AI") {
        return { success: false, error: "Only admins can edit AI-generated content" };
      }
      if (project.created_by !== session.username) {
        return { success: false, error: "You can only edit your own projects" };
      }
    }

    // Extract fields from FormData
    const title = formData.get("title") as string;
    const slug = formData.get("slug") as string;
    const description = formData.get("description") as string;
    const content = formData.get("content") as string | null;
    const techStackJson = formData.get("tech_stack") as string;
    const demoUrl = formData.get("demo_url") as string | null;
    const repoUrl = formData.get("repo_url") as string | null;
    const featured = formData.get("featured") === "true";
    const imageFile = formData.get("image") as File | null;
    const removeImage = formData.get("remove_image") === "true";

    const techStack = techStackJson ? JSON.parse(techStackJson) : [];

    // Prepare data for PocketBase
    const pbFormData = new FormData();
    pbFormData.append("title", title);
    pbFormData.append("slug", slug);
    pbFormData.append("description", description);
    if (content) pbFormData.append("content", content);
    pbFormData.append("tech_stack", JSON.stringify(techStack));
    if (demoUrl) pbFormData.append("demo_url", demoUrl);
    if (repoUrl) pbFormData.append("repo_url", repoUrl);
    pbFormData.append("featured", featured.toString());
    pbFormData.append("updated_by", session.username);

    // Handle image: add new, remove existing, or keep existing
    if (imageFile && imageFile.size > 0) {
      pbFormData.append("image", imageFile);
    } else if (removeImage) {
      pbFormData.append("image", ""); // Clear image
    }

    await pb.collection("projects").update(id, pbFormData);
    await logAdminAction("Update Project", `Updated project ID: ${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating project with image:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProject(id: string) {
  try {
    const pb = await createAdminClient();
    const session = await getAdminSession();
    
    if (!session) {
      return { success: false, error: 'Not authenticated' };
    }

    // Get the project to check ownership
    const project = await pb.collection("projects").getOne(id);
    
    // Role-based validation
    if (session.role !== 'admin') {
      // Users cannot delete AI-created content
      if (project.created_by === 'AI') {
        return { success: false, error: 'Only admins can delete AI-generated content' };
      }
      // Users can only delete their own projects
      if (project.created_by !== session.username) {
        return { success: false, error: 'You can only delete your own projects' };
      }
    }

    await pb.collection("projects").delete(id);
    await logAdminAction("Delete Project", `Deleted project ID: ${id}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return { success: false, error: error.message };
  }
}

