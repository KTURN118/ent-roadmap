# Entelligence PM Roadmap

A live roadmap that reads your Linear projects and organizes them by horizon (Now / Next / Soon / Someday).

## Files

- `index.html` — the roadmap page your stakeholders will see
- `api/projects.js` — a small server function that fetches your Linear projects
- `vercel.json` — tells Vercel how to run the site

## Setup

1. Upload these files to a GitHub repo
2. Connect the repo to Vercel (vercel.com)
3. In Vercel, add an environment variable:
   - Name: `LINEAR_API_KEY`
   - Value: your Linear API key (starts with `lin_api_...`)
4. Deploy — Vercel gives you a URL to share

## Updating the roadmap

The page always shows live data from Linear. Just refresh the page to see the latest.
To change which projects appear or how they're organized, update the labels in Linear.
