import type { NextApiRequest, NextApiResponse } from 'next';
import https from 'https';

// ─── GitHub API proxy — reads from shui-official/shui-community ───────────────
// TOKEN is only used server-side; never exposed to the browser.
const REPO  = 'shui-official/shui-community';
const TOKEN = process.env.GITHUB_TOKEN || '';

function ghFetch(path: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `token ${TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'SHUI-Dashboard/1.0',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch { resolve({}); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parallel fetch of all needed data
    const [prs, issues, branches, commits] = await Promise.all([
      ghFetch(`/repos/${REPO}/pulls?state=open&per_page=20`) as Promise<GHPull[]>,
      ghFetch(`/repos/${REPO}/issues?state=open&per_page=20`) as Promise<GHIssue[]>,
      ghFetch(`/repos/${REPO}/branches?per_page=30`) as Promise<GHBranch[]>,
      ghFetch(`/repos/${REPO}/commits?per_page=10`) as Promise<GHCommit[]>,
    ]);

    // Filter PRs by agent branches
    const agentPRs = Array.isArray(prs) ? prs.filter((p) =>
      p.head?.ref?.startsWith('agent/')
    ) : [];

    const allPRs = Array.isArray(prs) ? prs : [];
    const allIssues = Array.isArray(issues) ? issues.filter((i) => !i.pull_request) : [];
    const agentBranches = Array.isArray(branches) ? branches.filter((b) =>
      b.name.startsWith('agent/')
    ) : [];

    // Determine CI status from last commit status (simplified)
    const latestCommit = Array.isArray(commits) && commits[0] ? commits[0] : null;

    // Build per-agent stats from branch names
    const agentStats = {
      dev:       buildAgentStats('agent/dev',       allPRs, agentBranches),
      security:  buildAgentStats('agent/security',  allPRs, agentBranches),
      seo:       buildAgentStats('agent/seo',       allPRs, agentBranches),
      community: buildAgentStats('agent/community', allPRs, agentBranches),
    };

    // Security issues (labelled 'security')
    const securityIssues = allIssues.filter((i) =>
      Array.isArray(i.labels) && i.labels.some((l) => l.name === 'security')
    );

    return res.status(200).json({
      connected: true,
      repo: REPO,
      stats: {
        openPRs:      allPRs.length,
        openIssues:   allIssues.length,
        agentPRs:     agentPRs.length,
        agentBranches: agentBranches.length,
        securityIssues: securityIssues.length,
      },
      prs: allPRs.slice(0, 10).map(formatPR),
      issues: allIssues.slice(0, 10).map(formatIssue),
      agentBranches: agentBranches.map((b) => b.name),
      agentStats,
      latestCommit: latestCommit ? {
        sha:     (latestCommit.sha as string)?.slice(0, 7),
        message: (latestCommit.commit as { message: string })?.message?.split('\n')[0]?.slice(0, 80),
        author:  (latestCommit.commit as { author: { name: string } })?.author?.name,
        date:    (latestCommit.commit as { author: { date: string } })?.author?.date,
        url:     latestCommit.html_url as string,
      } : null,
      securityIssues: securityIssues.map(formatIssue),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ connected: false, error: String(err) });
  }
}

// ─── Helper types ─────────────────────────────────────────────────────────────
interface GHPull {
  number: number;
  title: string;
  state: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  created_at: string;
  updated_at: string;
  user: { login: string };
  labels: Array<{ name: string; color: string }>;
  draft: boolean;
}

interface GHIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
  created_at: string;
  labels: Array<{ name: string; color: string }>;
  user: { login: string };
  pull_request?: unknown;
}

interface GHBranch {
  name: string;
  commit: { sha: string };
}

interface GHCommit {
  sha: string;
  html_url: string;
  commit: { message: string; author: { name: string; date: string } };
}

function formatPR(p: GHPull) {
  return {
    number:     p.number,
    title:      p.title,
    url:        p.html_url,
    branch:     p.head?.ref,
    base:       p.base?.ref,
    author:     p.user?.login,
    createdAt:  p.created_at,
    labels:     p.labels?.map((l) => l.name) ?? [],
    isAgent:    p.head?.ref?.startsWith('agent/'),
    isDraft:    p.draft,
  };
}

function formatIssue(i: GHIssue) {
  return {
    number:    i.number,
    title:     i.title,
    url:       i.html_url,
    author:    i.user?.login,
    createdAt: i.created_at,
    labels:    i.labels?.map((l) => l.name) ?? [],
    isAgent:   i.labels?.some((l) => l.name === 'agent-security' || l.name === 'agent-pr') ?? false,
  };
}

function buildAgentStats(prefix: string, prs: GHPull[], branches: GHBranch[]) {
  const agentPRs     = prs.filter((p) => p.head?.ref?.startsWith(prefix));
  const agentBranches = branches.filter((b) => b.name.startsWith(prefix));
  return {
    openPRs:  agentPRs.length,
    branches: agentBranches.map((b) => b.name),
    lastPR:   agentPRs[0] ? { number: agentPRs[0].number, title: agentPRs[0].title.slice(0, 50), url: agentPRs[0].html_url } : null,
  };
}
