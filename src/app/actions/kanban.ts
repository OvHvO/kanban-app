"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import type { Task, TaskStatus } from "@/types/kanban";

export async function updateTaskAction(
  taskId: string,
  newStatus: TaskStatus,
  extraData: Partial<Task> = {}
) {
  const supabase = await createClient();

  // Create an update payload
  const payload: any = { status: newStatus };

  if (extraData.github_branch_url !== undefined) payload.github_branch_url = extraData.github_branch_url;
  if (extraData.github_pr_url !== undefined) payload.github_pr_url = extraData.github_pr_url;
  if (extraData.is_pending_approval !== undefined) payload.is_pending_approval = extraData.is_pending_approval;
  if (extraData.pending_reviewer_id !== undefined) payload.pending_reviewer_id = extraData.pending_reviewer_id;
  if (extraData.assignee_id !== undefined) payload.assignee_id = extraData.assignee_id;

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", taskId);

  if (error) {
    console.error("Failed to update task:", error);
    return { success: false, error: error.message };
  }

  // Refetch the page to update server data
  revalidatePath("/");
  return { success: true };
}

export async function createProjectAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) return { success: false, error: "Project name is required" };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthenticated" };

  // 1. Create project
  const { data: project, error: pError } = await supabase
    .from("projects")
    .insert({ name, created_by: user.id })
    .select()
    .single();

  if (pError || !project) {
    console.error("Failed to create project:", pError);
    return { success: false, error: pError?.message };
  }

  // 2. Assign user to project as owner
  const { error: mError } = await supabase
    .from("project_members")
    .insert({ project_id: project.id, user_id: user.id, role: 'owner' });

  if (mError) {
    console.error("Failed to assign member:", mError);
    return { success: false, error: mError.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function createTaskAction(
  projectId: string,
  title: string,
  description: string,
  userId: string
) {
  const supabase = await createClient();

  // Create task in To Do column
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id: projectId,
      title,
      description,
      status: "To Do",
      created_by: userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true, task: data };
}

export async function deleteTaskAction(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", taskId);

  if (error) {
    console.error("Failed to delete task:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMemberColorAction(projectId: string, userId: string, color: string) {
  const supabase = await createClient();

  // Try to update. The unique constraint will throw an error if the color is taken.
  const { error } = await supabase
    .from("project_members")
    .update({ color })
    .match({ project_id: projectId, user_id: userId });

  if (error) {
    console.error("Failed to update member color:", error);
    // Specifically check for standard Postgres unique constraint violation
    if (error.code === '23505') {
      return { success: false, error: "This color is already taken by another team member." };
    }
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateRestSeatAction(projectId: string, userId: string, seatIndex: number | null) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("project_members")
    .update({ rest_seat: seatIndex })
    .match({ project_id: projectId, user_id: userId });

  if (error) {
    console.error("Failed to update rest seat:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
