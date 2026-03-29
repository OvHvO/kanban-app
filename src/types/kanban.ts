export type TaskStatus = 'To Do' | 'In Progress' | 'Code Review' | 'Done' | 'Bugs';

export interface Profile {
  id: string;
  display_name: string;
  avatar_url?: string;
  color?: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assignee_id: string | null;
  github_branch_url: string | null;
  github_pr_url: string | null;
  pending_reviewer_id: string | null;
  is_pending_approval: boolean;
  sort_order: number;

  // Joined fields for UI
  assignee?: Profile;
  reviewer?: Profile;
}
