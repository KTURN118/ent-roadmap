export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'LINEAR_API_KEY not configured' });
  }

  const projectsQuery = `
    query {
      projects(first: 50) {
        nodes {
          id
          name
          description
          url
          startDate
          targetDate
          updatedAt
          priority
          teams { nodes { name } }
          status { name type }
          labels { nodes { name } }
          lead { name }
          members { nodes { name } }
        }
      }
    }
  `;

  const issuesQuery = `
    query {
      issues(
        filter: { team: { name: { eq: "Product Management" } } }
        first: 250
      ) {
        nodes {
          project { id }
          state { type }
        }
      }
    }
  `;

  try {
    const [projectsRes, issuesRes] = await Promise.all([
      fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
        body: JSON.stringify({ query: projectsQuery })
      }),
      fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': apiKey },
        body: JSON.stringify({ query: issuesQuery })
      })
    ]);

    const [projectsData, issuesData] = await Promise.all([
      projectsRes.json(),
      issuesRes.json()
    ]);

    if (projectsData.errors) {
      return res.status(500).json({ error: projectsData.errors[0].message });
    }

    const totalMap = {};
    const completedMap = {};
    for (const issue of (issuesData.data?.issues?.nodes || [])) {
      const pid = issue.project?.id;
      if (!pid) continue;
      totalMap[pid] = (totalMap[pid] || 0) + 1;
      if ((issue.state?.type || '').toLowerCase() === 'completed') {
        completedMap[pid] = (completedMap[pid] || 0) + 1;
      }
    }

    const allProjects = projectsData.data?.projects?.nodes || [];

    const pmProjects = allProjects
      .filter(p => (p.teams?.nodes || []).some(t => t.name === 'Product Management'))
      .filter(p => {
        const type = (p.status?.type || '').toLowerCase();
        return type !== 'canceled' && type !== 'completed';
      })
      .map(p => ({
        id: p.id,
        name: p.name,
        description: p.description || null,
        url: p.url,
        startDate: p.startDate || null,
        targetDate: p.targetDate || null,
        updatedAt: p.updatedAt || null,
        priority: p.priority,
        status: p.status,
        labels: (p.labels?.nodes || []).map(l => l.name),
        lead: p.lead ? { name: p.lead.name } : null,
        members: (p.members?.nodes || []).map(m => m.name),
        issueCount: totalMap[p.id] || 0,
        completedIssueCount: completedMap[p.id] || 0,
      }));

    return res.status(200).json({ projects: pmProjects });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
