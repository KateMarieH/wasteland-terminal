// netlify/functions/youtube-live.js
import fetch from "node-fetch";

const API_KEY = process.env.YT_API_KEY; // store in Netlify env vars
const CHANNEL_ID = "UCPtQT6_4aXqaLT8oOHtBkIA"; // your real channel ID

export async function handler() {
  try {
    const url =
      `https://www.googleapis.com/youtube/v3/search` +
      `?part=snippet&channelId=${CHANNEL_ID}` +
      `&eventType=live&type=video&key=${API_KEY}`;

    const r = await fetch(url);
    const data = await r.json();

    const liveVideo = data.items?.[0];

    if (liveVideo) {
      const videoId = liveVideo.id.videoId;
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
