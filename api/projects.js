export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'LINEAR_API_KEY not configured' });
  }

  const query = `
    query {
      projects(
        filter: { teams: { name: { eq: "Product Management" } } }
        first: 50
      ) {
        nodes {
          id
          name
          description
          url
          status { name type }
          priority { name value }
          labels
          lead { name }
          targetDate
          startDate
        }
      }
    }
  `;

  try {
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ query })
    });

    const data = await response.json();

    if (data.errors) {
      return res.status(500).json({ error: data.errors[0].message });
    }

    const projects = (data.data?.projects?.nodes || []).filter(p => {
      const type = (p.status?.type || '').toLowerCase();
      return type !== 'canceled' && type !== 'completed';
    });

    return res.status(200).json({ projects });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
