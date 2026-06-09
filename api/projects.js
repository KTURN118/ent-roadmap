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
          url
          teams {
            nodes {
              name
            }
          }
          status {
            name
            type
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

    const data = await response.json();

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
    });

    return res.status(200).json({ projects: pmProjects });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
