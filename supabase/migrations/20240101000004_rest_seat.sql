-- Add rest_seat column to project_members
-- null = not resting, 0-4 = seated in that chair
ALTER TABLE public.project_members ADD COLUMN rest_seat integer;

-- Constraint: rest_seat must be 0-4 or null
ALTER TABLE public.project_members ADD CONSTRAINT rest_seat_range 
  CHECK (rest_seat IS NULL OR (rest_seat >= 0 AND rest_seat <= 4));

-- Unique constraint: no two members in same project can have same non-null rest_seat
CREATE UNIQUE INDEX unique_rest_seat_per_project
  ON public.project_members (project_id, rest_seat)
  WHERE rest_seat IS NOT NULL;
