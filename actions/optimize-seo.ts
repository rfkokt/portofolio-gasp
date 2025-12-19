"use server";

import { fetch, Agent } from 'undici';
import JSON5 from 'json5';

const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

const dispatcher = new Agent({
  bodyTimeout: 300000,
  headersTimeout: 300000,
});

export interface SeoOptimizationResult {
    success: boolean;
    data?: {
        title: string;
        excerpt: string;
        slug: string;
        content?: string;
        tags?: string[];
    };
    error?: string;
}

import TurndownService from 'turndown';

// ... (existing imports)

// Helper: Extract valid HTTP/HTTPS URLs from text
function extractUrls(text: string): string[] {
    const urlRegex = /(https?:\/\/[^\s\)]+)/g;
    const matches = text.match(urlRegex);
    return matches ? Array.from(new Set(matches)) : []; // Unique URLs
}

// Helper: Fetch and parse URL content
async function fetchUrlContent(url: string): Promise<string | null> {
    try {
        console.log(`🌐 Fetching reference: ${url}`);
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch(url, {
            dispatcher,
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) return null;

        const html = await response.text();
        
        // Basic cleanup before parsing
        const turndownService = new TurndownService();
        
        // Remove scripts/styles
        turndownService.remove(['script', 'style', 'noscript', 'iframe']);
        
        let markdown = turndownService.turndown(html);
        
        // Cleanup whitespace
        markdown = markdown.replace(/\n\s+\n/g, '\n\n').trim();
        
        // Limit context size (first 1500 chars per reference)
        return `Source: ${url}\n---\n${markdown.substring(0, 1500)}...\n\n`;
    } catch (e) {
        console.warn(`Failed to fetch ${url}:`, e);
        return null;
    }
}

export async function optimizeSeoFields(title: string, excerpt: string, content: string, instruction?: string): Promise<SeoOptimizationResult> {
    // Sanitize instruction
    if (instruction === "$undefined" || instruction === "undefined") {
        instruction = undefined;
    }
    if (!Z_AI_API_KEY) {
        return { success: false, error: "AI API key not configured" };
    }

    // 1. URL Extraction & Fetching (Conditional)
    // Only fetch references if content is thin (< 300 words) or user explicitly asks for expansion
    const wordCount = content.trim().split(/\s+/).length;
    const isThinContent = wordCount < 300;
    const explicitRequest = instruction?.toLowerCase().match(/(expand|referensi|reference|lengkap|more|thin)/);
    
    let referenceContext = "";
    
    if (isThinContent || explicitRequest) {
        const urls = extractUrls(content);
        if (urls.length > 0) {
            console.log(`Found ${urls.length} references. Reading... (Word count: ${wordCount})`);
            // Limit to first 3 URLs to save time/tokens
            const results = await Promise.all(urls.slice(0, 3).map(fetchUrlContent));
            const validResults = results.filter(Boolean);
            if (validResults.length > 0) {
                referenceContext = `
    [ACTUAL CONTENT FROM USER'S REFERENCES]
    The user is referencing these external sources. USE THIS INFORMATION TO EXPAND THE CONTENT.
    
    ${validResults.join('\n')}
                `;
            }
        }
    }

    const prompt = `
    You are an Expert SEO Specialist and Copywriter for a Tech Blog.
    
    Your task is to OPTIMIZE the metadata for a blog post.
    
    INPUT DATA:
    - Current Title: "${title}"
    - Current Excerpt: "${excerpt}"
    - Content: "${content}"
    
    ${referenceContext}

    USER INSTRUCTION: ${instruction ? `"${instruction}"` : "Optimize for maximum CTR and Search Visibility."}

    GUIDELINES (STRICT):
    1. **Title**:
       - MUST be between **50 and 60 characters** (including spaces).
       - Catchy, clear, and includes main keywords.
       - Use Indonesian (Bahasa Indonesia).
    
    2. **Excerpt**:
       - MUST be extremely concise. **Maximum 2 sentences.**
       - **STRICT LIMIT: UNDER 150 CHARACTERS.** (Aim for 130-150 to be safe).
       - Summarize the value prop + CTA.
       - Use Indonesian (Bahasa Indonesia).

    3. **Slug**:
       - Lowercase, alphanumeric, hyphen-separated.
       - MUST be under **70 characters**.
       - Remove stop words.

    4. **Content (CRITICAL INSTRUCTION)**:
       - **CHECK THE USER INSTRUCTION CAREFULLY.**
       - IF the User Instruction mentions "headings", "structure", "h2", "h3", "subheadings", "hierarchy", "content", OR if the instruction looks like a pasted error message (e.g., "Content is thin"):
         - You **MUST** return the \`content\` field in the JSON.
         - You **MUST** REWRITE the content. **DO NOT** just return the original content.
         
         - **CONTENT EXPANSION RULES (IF REFERENCES PROVIDED)**:
           - If [ACTUAL CONTENT FROM USER'S REFERENCES] is present above, YOU MUST READ IT.
           - Use the facts, implementation details, and insights from the references to **EXPAND** the user's content.
           - **GOAL**: Content Depth > 300 words.
           - Add new sections based on the references (e.g., "Cara Implementasi", "Studi Kasus", "Manfaat Mendalam").
           
         - **MANDATORY STRUCTURE**:
           - Use **H2** for main sections.
           - **YOU MUST CREATE H3 SUB-SECTIONS**. If the content doesn't have them, **SPLIT** the H2 sections.
           - **Example**: If there is a section "## Fitur", rewrite it to include "### Fitur A" and "### Fitur B".
         - **NEATNESS**: Use bullet points and lists to make it readable.
       - **IF NO STRUCTURAL INSTRUCTION IS GIVEN**: You may omit the content field.

    **IMPORTANT**: If the instruction asks for "H3 headings", you **FAIL** if you do not return a \`content\` field with H3 headings.

    5. **Tags (NEW)**:
       - Generate **3-5 HIGHLY RELEVANT** tags.
       - **RULES**:
         - SPECIFICITY IS KEY. (e.g., "Next.js", "Server Actions", "Routing") vs ("Coding", "Tech").
         - **FORBIDDEN**: Do NOT use generic tags like "AI", "Bot", "Tulis", "Content" unless the post is explicitly about those topics.
         - If the post is about "Next.js Routing", tags should be: ["Next.js", "Routing", "Frontend", "Web Development"].
         - Use Title Case.

    OUTPUT JSON (Strict Minified JSON Only):
    {
      "title": "Title exactly 50-60 chars",
      "excerpt": "Excerpt exactly 140-160 chars",
      "slug": "short-optimized-slug",
      "content": "Full updated markdown content (REQUIRED if requested)",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
    `;

    console.log(`🤖 Optimization Request. Instruction: "${instruction || 'None'}"`);

    try {
        const response = await fetch(ANTHROPIC_ENDPOINT, {
            dispatcher,
            method: 'POST',
            headers: {
                'x-api-key': Z_AI_API_KEY,
                'anthropic-version': '2023-06-01',
                'content-type': 'application/json',
            },
            body: JSON.stringify({
                model: "glm-4.6v",
                max_tokens: 4000,
                messages: [{ 
                    role: "user", 
                    content: `STRICTLY FOLLOW CHARACTER LIMITS. \n\n${prompt}` 
                }],
            }),
        });

        if (!response.ok) {
            throw new Error(`AI API Error: ${response.status}`);
        }

        const data = await response.json() as any;
        const textWrapper = data.content?.[0]?.text;

        if (!textWrapper) throw new Error("No content generated");

        // Extract JSON
        const jsonMatch = textWrapper.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found in response");

        const jsonString = jsonMatch[0];
        let optimizedData;

        try {
            optimizedData = JSON5.parse(jsonString);
        } catch (e) {
             console.warn("⚠️ JSON5 Parse Failed, checking for unescaped newlines...");
             // Fallback: State-Machine Repair
             try {
                let inString = false;
                let isEscaped = false;
                let result = '';
                
                for (let i = 0; i < jsonString.length; i++) {
                    const char = jsonString[i];
                    
                    if (inString) {
                        if (char === '\\') {
                            isEscaped = !isEscaped;
                            result += char;
                        } else if (char === '"' && !isEscaped) {
                            inString = false;
                            result += char;
                        } else {
                            // If newline inside string, escape it
                            if (char === '\n' || char === '\r') {
                                if (char === '\n') result += '\\n';
                            } else {
                                result += char;
                            }
                            isEscaped = false;
                        }
                    } else {
                        if (char === '"') {
                            inString = true;
                            result += char;
                        } else if (/\s/.test(char)) {
                            continue;
                        } else {
                            result += char;
                        }
                    }
                }
                optimizedData = JSON5.parse(result);
             } catch (e2) {
                 console.warn("⚠️ State-machine repair failed. Trying Emergency Regex...");
                 // Emergency Regex Extraction
                 const titleMatch = jsonString.match(/"title"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                 const slugMatch = jsonString.match(/"slug"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                 const excerptMatch = jsonString.match(/"excerpt"\s*:\s*"((?:[^"\\]|\\.)*)"/);
                 
                 // Content extraction (greedy)
                 let rawContent = "";
                 const contentStartMatch = jsonString.match(/"content"\s*:\s*"/);
                 if (contentStartMatch) {
                     const startIdx = jsonString.indexOf(contentStartMatch[0]) + contentStartMatch[0].length;
                     let endIdx = -1;
                     let inEscape = false;
                     // Simple scan for ending quote followed by comma or brace
                     for (let i = startIdx; i < jsonString.length; i++) {
                         const c = jsonString[i];
                          if (inEscape) { inEscape = false; continue; }
                          if (c === '\\') { inEscape = true; continue; }
                          if (c === '"') {
                              const after = jsonString.substring(i + 1, i + 20).trim();
                              if (after.startsWith(',') || after.startsWith('}')) {
                                  endIdx = i;
                                  break;
                              }
                          }
                     }
                     if (endIdx > startIdx) {
                         rawContent = jsonString.substring(startIdx, endIdx);
                     }
                 }

                 if (!titleMatch) throw new Error("Critical JSON failure");

                 // Tags extraction
                 const tagsMatch = jsonString.match(/"tags"\s*:\s*\[([\s\S]*?)\]/);
                 let extractedTags: string[] = [];
                 if (tagsMatch && tagsMatch[1]) {
                     try {
                         // Try to parse just the array content
                         extractedTags = JSON5.parse(`[${tagsMatch[1]}]`);
                     } catch {
                         // Fallback clean split
                         extractedTags = tagsMatch[1]
                             .split(',')
                             .map((t: string) => t.trim().replace(/^"|"$/g, ''))
                             .filter((t: string) => t.length > 0);
                     }
                 }

                optimizedData = {
                     title: titleMatch ? titleMatch[1] : title,
                     excerpt: excerptMatch ? excerptMatch[1] : excerpt,
                     slug: slugMatch ? slugMatch[1] : undefined,
                     content: rawContent ? rawContent.replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined,
                     tags: extractedTags
                 };
             }
        }

        const resultData: any = {
            title: optimizedData.title || title,
            excerpt: optimizedData.excerpt || excerpt,
            slug: optimizedData.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        };

        // Only add content if it exists and is a valid string
        if (typeof optimizedData.content === 'string' && optimizedData.content.length > 0) {
            resultData.content = optimizedData.content;
        }

        if (Array.isArray(optimizedData.tags) && optimizedData.tags.length > 0) {
            resultData.tags = optimizedData.tags;
        }

        return {
            success: true,
            data: resultData
        };

    } catch (error: any) {
        console.error("SEO Optimization Error:", error);
        return { success: false, error: error.message };
    }
}
