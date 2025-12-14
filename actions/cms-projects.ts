"use server";

import PocketBase from "pocketbase";
import { logAdminAction } from "./admin-logs";
import { getAdminSession } from "@/lib/admin-auth";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.rdev.cloud");
pb.autoCancellation(false);

async function authenticateAdmin() {
  const email = process.env.PB_ADMIN_EMAIL;
  const pass = process.env.PB_ADMIN_PASS;

  if (!email || !pass) {
    throw new Error("PocketBase admin credentials not configured");
  }

  await pb.admins.authWithPassword(email, pass);
}

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

export async function getProjectsForCMS() {
  try {
    await authenticateAdmin();
    const session = await getAdminSession();

    // Role-based filter: users can only see their own projects
    let filter = undefined;
    if (session && session.role !== 'admin') {
      filter = `created_by = "${session.username}"`;
    }

    const result = await pb.collection("projects").getList(1, 100, { filter });

    return { success: true, projects: result.items };
  } catch (error: any) {
    console.error("Error fetching projects:", error);
    return { success: false, error: error.message, projects: [] };
  }
}

export async function getProjectById(id: string) {
  try {
    await authenticateAdmin();
    const project = await pb.collection("projects").getOne(id);
    return { success: true, project };
  } catch (error: any) {
    console.error("Error fetching project:", error);
    return { success: false, error: error.message };
  }
}

export async function createProject(data: ProjectData) {
  try {
    await authenticateAdmin();
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
    await authenticateAdmin();
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

export async function deleteProject(id: string) {
  try {
    await authenticateAdmin();
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

