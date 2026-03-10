// netlify/functions/youtube-live.js

const API_KEY = process.env.YT_API_KEY;
const CHANNEL_ID = "UCPtQT6_4aXqaLT8oOHtBkIA";

export async function handler() {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/liveBroadcasts` +
      `?part=snippet` +
      `&broadcastStatus=active` +
      `&broadcastType=all` +
      `&key=${API_KEY}`;

    const r = await fetch(url);
    const data = await r.json();

    const live = data.items?.find(
      item => item.snippet?.channelId === CHANNEL_ID
    );

    if (live) {
      const videoId = live.id;
      return {
        statusCode: 200,
        body: JSON.stringify({
          isLive: true,
          videoId,
          liveUrl: `https://www.youtube.com/watch?v=${videoId}`
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ isLive: false })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to check live status" })
    };
  }
}
