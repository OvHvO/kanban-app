-- Add color column with constraint
ALTER TABLE public.project_members ADD COLUMN color text;

-- Unique constraint ensuring members in a project don't share identical non-null colors
CREATE UNIQUE INDEX unique_active_color_per_project 
ON public.project_members (project_id, color) 
WHERE color IS NOT NULL;
