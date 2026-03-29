import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const repoUrl = searchParams.get("repoUrl");
    
    if (!repoUrl) {
      return NextResponse.json({ error: "Missing repoUrl parameter" }, { status: 400 });
    }

    // Parse owner and repo from https://github.com/owner/repo
    const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!match) {
      return NextResponse.json({ error: "Invalid GitHub URL" }, { status: 400 });
    }
    
    const owner = match[1];
    const repo = match[2].replace(/\.git$/, "");

    const githubToken = process.env.GITHUB_PAT;
    const headers: Record<string, string> = {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "PMA-Kanban-App"
    };
    
    if (githubToken) {
      headers["Authorization"] = `Bearer ${githubToken}`;
    }

    // Fetch the last 30 commits
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/commits?per_page=30`, {
      headers,
      next: { revalidate: 60 } // Cache for 60 seconds
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: `GitHub API error: ${err.message}` }, { status: res.status });
    }

    const commits = await res.json();

    // Map to a lightweight format for the frontend
    const cleanedCommits = commits.map((c: any) => ({
      sha: c.sha,
      message: c.commit.message.split('\n')[0], // Only first line of commit msg
      author: c.commit.author.name,
      date: c.commit.author.date,
      parents: c.parents.map((p: any) => p.sha)
    }));

    return NextResponse.json({ commits: cleanedCommits });

  } catch (error: any) {
    console.error("Git Tree API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
