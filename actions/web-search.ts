"use server";

import { fetch, Agent } from 'undici';

const SERPER_API_KEY = process.env.SERPER_API_KEY;

const dispatcher = new Agent({
  bodyTimeout: 300000,
  headersTimeout: 300000,
});

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
}

export async function searchWeb(query: string, limit = 3): Promise<SearchResult[]> {
  if (!SERPER_API_KEY) {
    console.warn("⚠️ SERPER_API_KEY not found. Skipping web search.");
    return [];
  }

  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_API_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        q: query,
        num: limit
      }),
      dispatcher
    });

    if (!response.ok) {
       if (response.status === 403 || response.status === 402 || response.status === 401) {
          console.warn(`🛑 Serper API Quota Exceeded or Invalid Key (Status: ${response.status}). Web search disabled for this request.`);
          return [];
       }
      throw new Error(`Serper API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    
    if (!data.organic) return [];

    return data.organic.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet
    }));

  } catch (error: any) {
    console.error(`❌ Web Search Failed for "${query}":`, error.message);
    return [];
  }
}

export async function fetchUrlContent(url: string): Promise<string | null> {
  console.log(`🔗 Fetching content: ${url}`);
  try {
    const response = await fetch(url, {
      dispatcher,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0; +http://github.com/blogbot)'
      }
    });

    if (!response.ok) return null;

    const html = await response.text();
    
    // Simple HTML cleaning
    const cleanText = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
      .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Increased limit as we might need more context
      
    return cleanText;
  } catch (e: any) {
    console.warn(`⚠️ Failed to fetch ${url}: ${e.message}`);
    return null;
  }
}
