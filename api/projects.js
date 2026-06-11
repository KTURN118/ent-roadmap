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
      }
      fetch('https://api.linear.app/graphql', {
        method: 'POST',
