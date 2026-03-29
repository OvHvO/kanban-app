import { KanbanBoard } from "@/components/board/KanbanBoard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { Task, Profile } from "@/types/kanban";

import { ProjectSelector } from "@/components/board/ProjectSelector";
import { GitTreeButton } from "@/components/board/GitTreeButton";

export default async function Dashboard(props: {
  searchParams?: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch the logged in profile
  const { data: myProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Fetch ALL projects they are a member of
  const { data: memberOfAll } = await supabase
    .from("project_members")
    .select("project_id, projects(name, github_repo_url)")
    .eq("user_id", user.id);

  if (!memberOfAll || memberOfAll.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center p-8 text-center gap-6 bg-slate-50">
        <h1 className="text-4xl font-bold font-sans">No Projects Found</h1>
        <p className="text-lg text-slate-600">You are securely signed in, but you haven't been assigned to any Kanban boards yet.</p>
        
        <div className="bg-white p-6 border-sketchy shadow-[4px_4px_0_#cbd5e1] max-w-md w-full mt-4 flex flex-col gap-4 text-left">
          <h2 className="text-xl font-bold border-b-2 border-sketchy pb-2">Admin Notice 👑</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Project creation is restricted to database administrators. 
            To get started, the Admin needs to open the <b>Supabase SQL Editor</b> and assign this user account to a project.
          </p>
          <div className="bg-slate-100 p-3 rounded-md border border-slate-200">
            <p className="text-xs font-mono text-slate-500 break-all text-center">Your User ID:</p>
            <p className="text-xs font-mono font-bold break-all text-center text-indigo-700 mt-1">{user.id}</p>
          </div>
        </div>
      </div>
    );
  }

  // Determine active project
  let projectId = memberOfAll[0].project_id;
  
  const requestedProjectId = searchParams.project_id;
  if (requestedProjectId) {
    const found = memberOfAll.find((m: any) => m.project_id === requestedProjectId);
    if (found) {
      projectId = found.project_id;
    }
  }

  // Format all projects for dropdown
  const allProjects = memberOfAll.map((m: any) => ({
    id: m.project_id,
    name: m.projects?.name || "Unknown Project",
    github_repo_url: m.projects?.github_repo_url || undefined
  }));

  const activeProj = allProjects.find(p => p.id === projectId);
  const activeGithubUrl = activeProj?.github_repo_url;

  // Fetch all live tasks and their linked Profile relationships!
  const { data: rawTasks } = await supabase
    .from("tasks")
    .select(`
      *,
      assignee:profiles!tasks_assignee_id_fkey(*),
      reviewer:profiles!tasks_pending_reviewer_id_fkey(*)
    `)
    .eq("project_id", projectId)
    .order("sort_order", { ascending: true });

  // Fetch team members list for the specific reviewer dropdown limit
  const { data: projectMembersAll } = await supabase
    .from("project_members")
    .select("*, profile:profiles(*)")
    .eq("project_id", projectId);
    
  const projectMembers: Profile[] = projectMembersAll?.map((pm: any) => {
    if (!pm.profile) return null;
    return { ...pm.profile, color: pm.color };
  }).filter(Boolean) || [];

  // Inject colors into the assignees of tasks directly from project members list
  const initialTasks = rawTasks?.map((t: any) => {
    if (t.assignee) {
      const pm = projectMembers.find(m => m.id === t.assignee.id);
      if (pm && pm.color) {
        t.assignee.color = pm.color;
      }
    }
    return t;
  }) || [];

  return (
    <main className="flex h-screen w-screen flex-col bg-slate-50 font-sans">
      <header className="relative z-50 flex h-16 shrink-0 items-center justify-between border-b-2 border-slate-200 border-sketchy px-8 bg-white m-4">
        <h1 className="text-2xl font-bold tracking-tight">PMAP</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <ProjectSelector projects={allProjects} activeProjectId={projectId} />
            {activeGithubUrl ? (
              <div className="flex items-center gap-2">
                <a href={activeGithubUrl} target="_blank" rel="noreferrer" className="text-slate-600 hover:text-indigo-600 transition-colors bg-white rounded-full p-1 border-2 border-sketchy hover:-translate-y-1 shadow-sm hover:shadow-[2px_2px_0_#cbd5e1]" title="View GitHub Repository">
                  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                  </svg>
                </a>
                <GitTreeButton repoUrl={activeGithubUrl} />
              </div>
            ) : null}
          </div>
          <div className="h-10 w-10 border-2 rounded-full border-sketchy overflow-hidden shadow-[2px_2px_0_#cbd5e1]">
            <img 
               src={myProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${myProfile?.display_name || user.id}`} 
               alt="You" 
               className="w-full h-full object-cover bg-indigo-100" 
            />
          </div>
        </div>
      </header>
      
      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          projectId={projectId}
          initialTasks={initialTasks as unknown as Task[]} 
          currentUserId={user.id} 
          projectMembers={projectMembers} 
        />
      </div>
    </main>
  );
}
