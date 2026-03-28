# 🎨 Excalidraw-Style Kanban Board

A feature-rich, drag-and-drop project management application built with Next.js and Supabase. It features a unique, sketchy, hand-drawn UI aesthetic, inspired by Excalidraw.

## ✨ Core Features

- **Dynamic Drag & Drop**: Built with `@dnd-kit/core` for fluid, accessible task movement across 5 functional columns (To Do, In Progress, Code Review, Done, Bugs).
- **Strict Workflow Modals**: 
  - Dragging to *In Progress* prompts for a GitHub Branch URL.
  - Dragging to *Code Review* prompts for a GitHub PR URL.
  - Dragging to *Done* triggers an approval workflow requiring team reviewer selection before the task enters a visually-pending state.
- **Supabase Authentication**: Integrated via `@supabase/ssr` Next.js Middleware handling hard route protection for dashboards.
- **Database-Level Constraints**: Complex business logic natively enforced via PostgreSQL Triggers:
  - Max 3 active projects per user.
  - Max 5 team members per project.
  - Registration strictly gated by an Email Allow-list table.
- **Hand-Drawn UI Architecture**: Zero heavy canvas renders. Pure Tailwind CSS tricks (`border-radius` hacks) mixed with the Google *Kalam* font for incredibly performant server-side rendering (SSR).

## 🚀 Tech Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend & Auth**: Supabase (PostgreSQL, Row Level Security)
- **Interactions**: `@dnd-kit`

## 🛠️ Local Development

### 1. Database Setup (Supabase)
1. Create a new [Supabase](https://supabase.com/) project.
2. Navigate to the SQL Editor and run the raw SQL file located at:
   `supabase/migrations/20240101000000_schema.sql`
3. **Crucial**: Enter the `allowlisted_emails` table in your Supabase Interface and insert the email address you plan to register with. *(If you do not do this, the database trigger will strictly reject your signup request!)*

### 2. Environment Variables
Create a `.env.local` file in the root of the project:
```env
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Running the App
Install dependencies and spin up the dev server:
```bash
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## 📦 Deployment

This repository is optimized for one-click deployment to [Vercel](https://vercel.com/new). 
When importing your repository, ensure you expand the **Environment Variables** tab and provide the exact same Supabase variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) prior to hitting deploy.
