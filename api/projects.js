export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'LINEAR_API_KEY not configured' });
  }

  const query = `
    query {
      projects(first: 50) {
        nodes {
          id
          name
          description
          url
          startDate
          targetDate
          priority
          teams {
            nodes {
              name
            }
          }
          status {
            name
            type
          }
          labels {
            nodes {
              name
            }
          }
          lead {
            name
            avatarUrl
          }
          members {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({ query })
    });

    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch(e) {
      return res.status(500).json({ error: 'Invalid JSON from Linear', raw: text.slice(0, 300) });
    }

    if (data.errors) {
      return res.status(500).json({ error: data.errors[0].message });
    }

    const allProjects = data.data?.projects?.nodes || [];

    const pmProjects = allProjects.filter(p => {
      const teams = p.teams?.nodes || [];
      return teams.some(t => t.name === 'Product Management');
    }).filter(p => {
      const type = (p.status?.type || '').toLowerCase();
      return type !== 'canceled' && type !== 'completed';
    }).map(p => ({
      id: p.id,
      name: p.name,
      description: p.description || null,
      url: p.url,
      startDate: p.startDate || null,
      targetDate: p.targetDate || null,
      priority: p.priority,
      status: p.status,
      labels: (p.labels?.nodes || []).map(l => l.name),
      lead: p.lead ? { name: p.lead.name, avatarUrl: p.lead.avatarUrl } : null,
      members: (p.members?.nodes || []).map(m => m.name),
    }));

    return res.status(200).json({ projects: pmProjects });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
