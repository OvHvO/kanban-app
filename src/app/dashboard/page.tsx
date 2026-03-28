import { KanbanBoard } from "@/components/board/KanbanBoard";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import type { Task, Profile } from "@/types/kanban";

export default async function Dashboard() {
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

  // Pick their first project out of their max of 3 allowed
  const { data: memberOf } = await supabase
    .from("project_members")
    .select("project_id, projects(name)")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!memberOf) {
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

  const projectId = memberOf.project_id;
  const projectName = (memberOf.projects as any)?.name || "Unknown Project";

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
    
  const projectMembers: Profile[] = projectMembersAll?.map((pm: any) => pm.profile).filter(Boolean) || [];

  return (
    <main className="flex h-screen w-screen flex-col bg-slate-50 font-sans">
      <header className="flex h-16 shrink-0 items-center justify-between border-b-2 border-slate-200 border-sketchy px-8 bg-white m-4">
        <h1 className="text-2xl font-bold tracking-tight">ʕง•ᴥ•ʔง ʕ•ᴥ•ʔ ʕ ᵔᴥᵔ ʔ</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold text-slate-500 border-sketchy px-4 py-1 bg-slate-100 shadow-[2px_2px_0_#cbd5e1]">Project: {projectName}</span>
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
          initialTasks={(rawTasks || []) as unknown as Task[]} 
          currentUserId={user.id} 
          projectMembers={projectMembers} 
        />
      </div>
    </main>
  );
}
