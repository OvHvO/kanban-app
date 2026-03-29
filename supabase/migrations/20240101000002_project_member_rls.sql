-- Allow users to update their own project_members row (to pick a color)
CREATE POLICY "Users can update their own project member row" 
ON public.project_members 
FOR UPDATE 
USING (user_id = auth.uid());
