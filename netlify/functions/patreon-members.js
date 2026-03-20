// /.netlify/functions/patreon-members.js
import fetch from 'node-fetch';

export async function handler() {
  const url = `https://www.patreon.com/api/oauth2/v2/campaigns/${process.env.PATREON_CAMPAIGN}/members?include=user&fields[user]=full_name,created`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.PATREON_TOKEN}`
    }
  });

  const data = await res.json();

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const members = data.included
    .filter(i => i.type === "user")
    .filter(i => new Date(i.attributes.created).getTime() >= oneWeekAgo)
    .map(i => ({
      name: i.attributes.full_name,
      timestamp: i.attributes.created,
      source: "Patreon"
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(members)
  };
}
