export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.LINEAR_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'LINEAR_API_KEY not configured' });
  }

  const { projectId, projectName, question, askedBy } = req.body;

  if (!question || !projectId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Create a Linear issue as an "Ask" under the PM team
  const mutation = `
    mutation CreateIssue($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue {
          id
          identifier
          url
        }
      }
    }
  `;

  // First get the PM team ID
  const teamQuery = `
    query {
      teams(filter: { name: { eq: "Product Management" } }) {
        nodes {
          id
          name
        }
      }
    }
  `;

  try {
    // Get team ID
    const teamRes = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({ query: teamQuery })
    });

    const teamData = await teamRes.json();
    const teamId = teamData.data?.teams?.nodes?.[0]?.id;

    if (!teamId) {
      return res.status(500).json({ error: 'Could not find Product Management team' });
    }

    // Create the issue
    const issueRes = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': apiKey
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            teamId,
            title: `Question about "${projectName}" from ${askedBy}`,
            description: `**Question from:** ${askedBy}\n\n**Project:** ${projectName}\n\n**Question:**\n${question}`,
            labelIds: []
          }
        }
      })
    });

    const issueData = await issueRes.json();

    if (issueData.errors) {
      return res.status(500).json({ error: issueData.errors[0].message });
    }

    return res.status(200).json({
      success: true,
      issue: issueData.data?.issueCreate?.issue
    });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
