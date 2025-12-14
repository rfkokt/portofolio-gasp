"use server";

import PocketBase from "pocketbase";

const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL || "https://pocketbase.rdev.cloud");

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

    const result = await pb.collection("projects").getList(1, 100);

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
    const record = await pb.collection("projects").create(data);
    return { success: true, id: record.id };
  } catch (error: any) {
    console.error("Error creating project:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProject(id: string, data: Partial<ProjectData>) {
  try {
    await authenticateAdmin();
    await pb.collection("projects").update(id, data);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating project:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteProject(id: string) {
  try {
    await authenticateAdmin();
    await pb.collection("projects").delete(id);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting project:", error);
    return { success: false, error: error.message };
  }
}
