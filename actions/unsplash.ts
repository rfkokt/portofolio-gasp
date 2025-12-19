"use server";

import { fetch, Agent } from 'undici';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const UNSPLASH_API_URL = 'https://api.unsplash.com/search/photos';

const dispatcher = new Agent({
  bodyTimeout: 30000,
  headersTimeout: 30000,
});

export async function searchUnsplashPhoto(query: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) {
    console.warn("⚠️ UNSPLASH_ACCESS_KEY not found in environment variables.");
    return null;
  }

  try {
    const url = new URL(UNSPLASH_API_URL);
    url.searchParams.append('query', query);
    url.searchParams.append('page', '1');
    url.searchParams.append('per_page', '1');
    url.searchParams.append('orientation', 'landscape'); // Using landscape for blog covers usually looks better, or portrait if strictly needed
    url.searchParams.append('client_id', UNSPLASH_ACCESS_KEY);

    const response = await fetch(url.toString(), {
      dispatcher,
      headers: {
        'Accept-Version': 'v1'
      }
    });

    if (!response.ok) {
        if (response.status === 403) {
            console.warn("⚠️ Unsplash API Rate Limit Exceeded or Invalid Key.");
        }
        return null;
    }

    const data = await response.json() as any;
    
    if (data.results && data.results.length > 0) {
        // Return the regular URL (good quality but not raw)
        return data.results[0].urls.regular;
    }
    
    return null;

  } catch (error) {
    console.error("❌ Unsplash Image Search Error:", error);
    return null;
  }
}
