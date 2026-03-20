// /.netlify/functions/youtube-subs.js
import fetch from 'node-fetch';

export async function handler() {
  const url = `https://www.googleapis.com/youtube/v3/activities?part=snippet&channelId=${process.env.YT_CHANNEL_ID}&maxResults=25&key=${process.env.YT_API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  const subs = data.items
    .filter(i => i.snippet.type === "subscription")
    .filter(i => new Date(i.snippet.publishedAt).getTime() >= oneWeekAgo)
    .map(i => ({
      name: i.snippet.title,
      timestamp: i.snippet.publishedAt,
      source: "YouTube"
    }));

  return {
    statusCode: 200,
    body: JSON.stringify(subs)
  };
}
