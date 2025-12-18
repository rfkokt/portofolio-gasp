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
    };
    error?: string;
}

export async function optimizeSeoFields(title: string, excerpt: string, content: string, instruction?: string): Promise<SeoOptimizationResult> {
    // Sanitize instruction: Next.js sometimes serializes undefined as "$undefined"
    if (instruction === "$undefined" || instruction === "undefined") {
        instruction = undefined;
    }
    if (!Z_AI_API_KEY) {
        return { success: false, error: "AI API key not configured" };
    }

    const prompt = `
    You are an Expert SEO Specialist and Copywriter for a Tech Blog.
    
    Your task is to OPTIMIZE the metadata for a blog post.

    INPUT DATA:
    - Current Title: "${title}"
    - Current Excerpt: "${excerpt}"
    - Content: "${content}"
    
    USER INSTRUCTION: ${instruction ? `"${instruction}"` : "Optimize for maximum CTR and Search Visibility."}

    GUIDELINES (STRICT):
    1. **Title**:
       - MUST be between **50 and 60 characters** (including spaces).
       - Catchy, clear, and includes main keywords.
       - Use Indonesian (Bahasa Indonesia).
    
    2. **Excerpt**:
       - MUST be between **140 and 160 characters**.
       - Summarize the value prop + CTA.
       - Use Indonesian (Bahasa Indonesia).

    3. **Slug**:
       - Lowercase, alphanumeric, hyphen-separated.
       - MUST be under **70 characters**.
       - Remove stop words.

    4. **Content (OPTIONAL - BUT MANDATORY IF REQUESTED)**:
       - IF the User Instruction asks for "headings", "structure", "h2", "h3", or "content", OR if the instruction looks like a pasted error message (e.g., "Use H3 headings to maintain hierarchy"):
         - You **MUST** return the \`content\` field.
         - You **MUST** rewrite the content to include both **H2** AND **H3** headings.
         - If necessary, **SPLIT** long H2 sections into subsections with H3 to satisfy this requirement.
         - **EXPAND** the content slightly if needed to make the structure natural.
       - Ensure proper hierarchies (H2 -> H3).
       - Examples of H3 usage: "## Impact\n### Economic Impact\n### Social Impact".
       - KEEP the original meaning.
       - Preserve all code blocks.
       - If no structure request is made, you may omit this field.

    OUTPUT JSON (Strict Minified JSON Only):
    {
      "title": "Title exactly 50-60 chars",
      "excerpt": "Excerpt exactly 140-160 chars",
      "slug": "short-optimized-slug",
      "content": "Full updated markdown content (REQUIRED if requested)"
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

                 optimizedData = {
                     title: titleMatch ? titleMatch[1] : title,
                     excerpt: excerptMatch ? excerptMatch[1] : excerpt,
                     slug: slugMatch ? slugMatch[1] : undefined,
                     content: rawContent ? rawContent.replace(/\\n/g, '\n').replace(/\\"/g, '"') : undefined
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

        return {
            success: true,
            data: resultData
        };

    } catch (error: any) {
        console.error("SEO Optimization Error:", error);
        return { success: false, error: error.message };
    }
}
