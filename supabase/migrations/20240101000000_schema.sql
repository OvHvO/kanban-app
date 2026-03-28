-- 1. Tables and Base Schema

-- Allowlisted emails
CREATE TABLE public.allowlisted_emails (
  email text PRIMARY KEY,
  created_at timestamptz DEFAULT now()
);

-- Profiles (extends auth.users)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Projects
CREATE TABLE public.projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Project Members
CREATE TABLE public.project_members (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'member')),
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (project_id, user_id)
);

-- Tasks
CREATE TABLE public.tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL CHECK (status IN ('To Do', 'In Progress', 'Code Review', 'Done', 'Bugs')),
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  github_branch_url text,
  github_pr_url text,
  pending_reviewer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_pending_approval boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. Triggers for Constraints

-- A: Allowlist Trigger on Auth.Users
CREATE OR REPLACE FUNCTION public.check_allowlisted_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.allowlisted_emails WHERE email = NEW.email) THEN
    RAISE EXCEPTION 'Email % is not allowlisted for registration.', NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_allowlist
  BEFORE INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.check_allowlisted_email();

-- Automate Profile Creation on sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'), NEW.raw_user_meta_data->>'avatar_url');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- B: 3 Project Per User Limit
CREATE OR REPLACE FUNCTION public.enforce_user_project_limit()
RETURNS TRIGGER AS $$
DECLARE
  project_count integer;
BEGIN
  SELECT count(*) INTO project_count FROM public.project_members WHERE user_id = NEW.user_id;
  IF project_count >= 3 THEN
    RAISE EXCEPTION 'User cannot be a member of more than 3 projects concurrently.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_user_project_limit
  BEFORE INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_user_project_limit();

-- C: 5 Member Per Project Limit
CREATE OR REPLACE FUNCTION public.enforce_project_member_limit()
RETURNS TRIGGER AS $$
DECLARE
  member_count integer;
BEGIN
  SELECT count(*) INTO member_count FROM public.project_members WHERE project_id = NEW.project_id;
  IF member_count >= 5 THEN
    RAISE EXCEPTION 'Project cannot have more than 5 members.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_project_member_limit
  BEFORE INSERT ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.enforce_project_member_limit();

-- 3. Row Level Security (RLS) Policies

ALTER TABLE public.allowlisted_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allowlisted emails
-- No public policies needed, since the function check_allowlisted_email is SECURITY DEFINER.

-- Profiles: Viewable by everyone. Updateable by self.
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: Viewable by members. Insertable by authed users. Updatable by owner.
CREATE POLICY "Projects viewable by members" ON public.projects FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
);
CREATE POLICY "Auth users can insert projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update projects" ON public.projects FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid() AND role = 'owner')
);

-- Project Members: Viewable by project members. Insertable by owner.
CREATE POLICY "Project members viewable by project members" ON public.project_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Owners can insert members" ON public.project_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid() AND role = 'owner')
  OR user_id = auth.uid() 
);

-- Tasks: Project members can CRUD tasks
CREATE POLICY "Tasks viewable by project members" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Tasks insertable by project members" ON public.tasks FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Tasks updatable by project members" ON public.tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid())
);
CREATE POLICY "Tasks deletable by project members" ON public.tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid())
);
