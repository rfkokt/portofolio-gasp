"use server";

import { fetch, Agent } from 'undici';
import JSON5 from 'json5';

const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

const dispatcher = new Agent({
  bodyTimeout: 300000,
  headersTimeout: 300000,
});

// Helper to generate cover image URL with title text
function generateCoverImageURL(title: string): string {
  const MAX_LINE_LENGTH = 18;
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    if ((currentLine + " " + words[i]).length < MAX_LINE_LENGTH) {
      currentLine += " " + words[i];
    } else {
      lines.push(currentLine);
      currentLine = words[i];
    }
  }
  lines.push(currentLine);

  const encodedText = encodeURIComponent(lines.join('\n'));
  // Using placehold.co with dark background and fixed font size
  return `https://placehold.co/398x498/1a1a1a/FFF.png?text=${encodedText}&font=montserrat&font_size=28`;
}

export async function generateBlogPost(topic?: string) {
  if (!Z_AI_API_KEY) {
    return { success: false, error: "AI API key not configured" };
  }

  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  // Check if topic contains a URL - if so, fetch it first
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urlMatches = topic ? topic.match(urlRegex) : null;
  let referenceContent = "";
  let sourceUrl = "";

  if (urlMatches && urlMatches.length > 0) {
    sourceUrl = urlMatches[0];
    console.log(`🔗 Fetching reference URL: ${sourceUrl}`);
    
    try {
      // Fetch the URL content
      const urlResponse = await fetch(sourceUrl, {
        dispatcher,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)'
        }
      });
      
      if (urlResponse.ok) {
        const html = await urlResponse.text();
        // Extract text content (simple HTML stripping)
        referenceContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000); // Limit to 5000 chars
        console.log(`✅ Fetched ${referenceContent.length} chars from reference`);
      }
    } catch (e: any) {
      console.warn(`⚠️ Could not fetch URL: ${e.message}`);
    }
  }

  // Build prompt based on whether we have a reference URL or just a topic
  let prompt: string;

  if (referenceContent && sourceUrl) {
    // URL-based: EXTREMELY STRICT on facts, but with personality
    prompt = `
    You are a senior Indonesian developer who writes tech blogs with PERSONALITY. Your job is to ACCURATELY REPORT what the source says, but in YOUR OWN VOICE.
    
    LANGUAGE: **Bahasa Indonesia** (Indonesian) - NATURAL, not translated.
    DATE: Today is ${today}.

    SOURCE URL: ${sourceUrl}
    SOURCE CONTENT:
    """
    ${referenceContent.substring(0, 4000)}
    """

    🎨 WRITING STYLE (WAJIB):
    - Tulis seperti developer Indonesia ngobrol sama developer lain, BUKAN seperti translate Google
    - Boleh pakai ekspresi santai: "Nah,", "Jadi gini,", "Yang menarik,", "Wah,", "Oke,", "Tenang,"
    - Boleh pakai bahasa gaul tech: "bug", "patch", "deploy", "production", "nge-push", "ke-trigger"
    - Tambah komentar ringan/humor RINGAN yang relate sama developer Indonesia
    - Struktur kalimat harus NATURAL, bukan "Ini adalah fitur yang..." tapi "Fitur ini..."
    - Hindari bahasa formal berlebihan seperti "sebagaimana", "adapun", "demikian"
    
    📝 KLARIFIKASI TEKNIS (PENTING!):
    - JANGAN tulis kalimat ambigu seperti "tidak menggunakan server" - jelaskan konteksnya!
    - Contoh SALAH: "Jika aplikasi React kamu tidak menggunakan server, kamu tidak terpengaruh."
    - Contoh BENAR: "Jika kamu pakai React client-side biasa (tanpa Server Components), kamu aman."
    - Selalu jelaskan istilah teknis dalam konteks yang jelas bagi developer Indonesia

    ⚠️ CRITICAL RULES - FAKTA HARUS AKURAT:
    
    1. **ONLY REPORT WHAT'S IN THE SOURCE**:
       - Version numbers: COPY EXACTLY from source (jangan ubah!)
       - CVE IDs, dates, affected products: COPY EXACTLY
       - JANGAN interpretasi sendiri versi mana yang kena
    
    2. **NO CODE EXAMPLES UNLESS COPIED**:
       - Kalau source ada code, boleh include
       - Kalau TIDAK ada code di source, JANGAN BIKIN CODE
       - Tulis: "Untuk detail teknis, cek langsung di ${sourceUrl}"
    
    3. **NO MADE-UP SOLUTIONS**:
       - Kalau source kasih solusi, laporin solusi itu
       - Kalau TIDAK ada solusi, tulis jujur: "Sampai artikel ini ditulis, tim [nama] belum kasih patch resmi. Stay tuned!"
       - JANGAN bikin solusi sendiri (rate limiting, CORS, validation, dll)

    📝 STRUKTUR MARKDOWN (WAJIB PAKAI HEADING H2/H3 untuk TOC!):
    
    [Opening paragraph - 1-2 kalimat hook yang bikin penasaran]
    
    ## Apa yang Terjadi
    [Rangkum beritanya FROM SOURCE - 2-3 paragraf]
    
    ## Dampak & Versi yang Terkena
    [Siapa yang kena, versi apa, kenapa penting FROM SOURCE]
    
    ## Solusi & Langkah Mitigasi
    [Apa yang harus dilakukan FROM SOURCE, atau tulis "belum ada patch resmi"]
    
    ## Kesimpulan
    [Saran ringan 1-2 kalimat]
    
    ## Referensi
    - [Nama Source](${sourceUrl})
    - [Link dokumentasi resmi lain jika ada]
    
    ⚠️ SETIAP SECTION HARUS PAKAI HEADING "##" AGAR MUNCUL DI TOC!

    OUTPUT JSON (Strict Minified JSON, no markdown fencing):
    {
      "title": "Judul Catchy Bahasa Indonesia",
      "slug": "kebab-case-slug",
      "excerpt": "2 kalimat rangkuman yang bikin penasaran.",
      "content": "Markdown dengan H2 headings (## Heading). Fakta dari source, gaya natural. Use \\n for newlines.",
      "tags": ["React", "Security", "CVE-2025-XXXXX"]
    }
    
    ⚠️ TAGS HARUS SPESIFIK! Contoh tags yang bagus:
    - Nama teknologi: "React", "Next.js", "Node.js", "JavaScript"
    - Tipe masalah: "Security", "Bug Fix", "Performance", "Breaking Change"  
    - CVE ID jika ada: "CVE-2025-12345"
    - Nama library yang kena: "react-server-dom-webpack"
    JANGAN pakai placeholder seperti "Tag1", "Tag2"!
    `;
  } else {
    // Topic-based or auto-generate
    prompt = `
    You are an expert Senior Developer and Tech Writer.
    
    TASK: Write a comprehensive, solution-oriented technical blog post.
    TARGET AUDIENCE: Developers, specialized in Web Development, React, and Node.js.
    LANGUAGE: **Bahasa Indonesia** (Indonesian).
    DATE: Today is ${today}.

    ${topic ? `TOPIC: "${topic}"` : "TOPIC: Choose a trending topic in web development, React, Next.js, or JavaScript."}
    
    CRITICAL ANTI-HALLUCINATION RULES:
    1. **ONLY USE VERIFIED INFORMATION**: Don't make up library versions, APIs, or features.
    2. **GENERIC CODE ONLY**: Only provide code examples that are standard, well-documented patterns.
    3. **CITE OFFICIAL DOCS**: Always reference official documentation where applicable.
    4. **NO FAKE URLs**: Do not invent documentation URLs. Only use real, verifiable URLs like react.dev, nextjs.org, nodejs.org, developer.mozilla.org.

    STRUCTURE:
    1. **Title**: Catchy, clear title in Indonesian.
    2. **Introduction**: What is this about? Briefly explain the topic.
    3. **Main Content**: (Use H2 and H3 headings)
       - Provide concrete code examples that are VERIFIED patterns.
       - Include practical tips and best practices.
    4. **Conclusion**: Brief wrap up.
    5. **Referensi**: Add relevant REAL official documentation links.

    OUTPUT JSON FORMAT (Strict Minified JSON, no markdown fencing):
    {
      "title": "Indonesian Title",
      "slug": "kebab-case-slug-based-on-title",
      "excerpt": "Brief summary (2 sentences).",
      "content": "Full markdown content with escaped newlines (\\n). Include the References section at the end.",
      "tags": ["Tag1", "Tag2", "Tag3"]
    }
    `;
  }

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
        max_tokens: 3500,
        messages: [{ 
          role: "user", 
          content: `Generate the blog post JSON. REMINDER: Output RAW MINIFIED JSON ONLY. DO NOT HALLUCINATE - only include verified information. \n\n ${prompt}` 
        }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No content generated");
    }

    // Extract JSON
    const firstOpen = content.indexOf('{');
    const lastClose = content.lastIndexOf('}');
    
    if (firstOpen === -1 || lastClose === -1 || lastClose < firstOpen) {
      throw new Error("No valid JSON in response");
    }

    const jsonString = content.substring(firstOpen, lastClose + 1);

    let postData;
    try {
      // First attempt: Direct JSON5 parse
      postData = JSON5.parse(jsonString);
    } catch {
      console.warn("⚠️ JSON5 Parse Failed, running state-machine repair...");
      // Fallback: State-Machine Repair for unescaped newlines
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
                // Skip \r
              } else {
                result += char;
              }
              isEscaped = false;
            }
          } else {
            // Not in string
            if (char === '"') {
              inString = true;
              result += char;
            } else if (/\s/.test(char)) {
              // Skip whitespace outside strings (Minify)
              continue;
            } else {
              result += char;
            }
          }
        }
        
        postData = JSON5.parse(result);
      } catch {
        console.warn("⚠️ State-machine repair failed. Attempting Emergency Regex Extraction...");
        // Emergency Regex Extraction
        const titleMatch = jsonString.match(/"title"\s*:\s*"(.*?)"/);
        const slugMatch = jsonString.match(/"slug"\s*:\s*"(.*?)"/);
        const excerptMatch = jsonString.match(/"excerpt"\s*:\s*"(.*?)"/);
        const contentMatch = jsonString.match(/"content"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|\s*})/);
        
        if (!titleMatch && !contentMatch) {
          throw new Error("Could not extract minimal fields from AI response");
        }

        // Unescape standard JSON escapes in the extracted content
        let rawContent = contentMatch ? contentMatch[1] : "";
        rawContent = rawContent.replace(/\\"/g, '"');
        rawContent = rawContent.replace(/\\n/g, '\n');

        postData = {
          title: titleMatch ? titleMatch[1] : "Untitled Post",
          slug: slugMatch ? slugMatch[1] : `post-${Date.now()}`,
          excerpt: excerptMatch ? excerptMatch[1] : "",
          content: rawContent,
          tags: []
        };
        console.log("✅ Emergency Extraction Successful!");
      }
    }

    // Add cover image based on title
    postData.cover_image = generateCoverImageURL(postData.title);

    // Safety net: Append reference link if missing from content
    if (sourceUrl && !postData.content.includes(sourceUrl)) {
      postData.content += `\n\n## Referensi\n- [Sumber Asli](${sourceUrl})`;
    }

    return { success: true, data: postData };
  } catch (error: any) {
    console.error("AI generation error:", error);
    return { success: false, error: error.message };
  }
}

export async function generateProject(topic?: string) {
  if (!Z_AI_API_KEY) {
    return { success: false, error: "AI API key not configured" };
  }

  const today = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });

  // Check if topic contains a URL - if so, fetch it first
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const urlMatches = topic ? topic.match(urlRegex) : null;
  let referenceContent = "";
  let sourceUrl = "";

  if (urlMatches && urlMatches.length > 0) {
    sourceUrl = urlMatches[0];
    console.log(`🔗 Fetching reference URL for project: ${sourceUrl}`);
    
    try {
      const urlResponse = await fetch(sourceUrl, {
        dispatcher,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ProjectBot/1.0)'
        }
      });
      
      if (urlResponse.ok) {
        const html = await urlResponse.text();
        referenceContent = html
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 5000);
        console.log(`✅ Fetched ${referenceContent.length} chars from reference`);
      }
    } catch (e: any) {
      console.warn(`⚠️ Could not fetch URL: ${e.message}`);
    }
  }

  // Build prompt based on whether we have a reference URL or just a topic
  let prompt: string;

  if (referenceContent && sourceUrl) {
    // URL-based: Generate project based on reference
    prompt = `
    You are a senior Indonesian developer who creates AMAZING project portfolios. Your job is to create a project showcase based on the reference, in YOUR OWN VOICE.
    
    LANGUAGE: **Bahasa Indonesia** (Indonesian) - NATURAL, not translated.
    DATE: Today is ${today}.

    SOURCE URL: ${sourceUrl}
    SOURCE CONTENT:
    """
    ${referenceContent.substring(0, 4000)}
    """

    🎨 WRITING STYLE (WAJIB):
    - Tulis seperti developer Indonesia menjelaskan project keren
    - Boleh pakai ekspresi: "Nah,", "Jadi gini,", "Yang menarik,", "Honestly,"
    - Boleh pakai bahasa tech: "deploy", "production", "scale", "performance"
    - Deskripsi harus catchy dan profesional
    - Hindari bahasa formal berlebihan

    📝 STRUKTUR MARKDOWN CONTENT (WAJIB PAKAI HEADING ##):
    
    ## Overview
    [Brief intro tentang project]
    
    ## Fitur Utama
    - Fitur 1
    - Fitur 2
    
    ## Tech Stack & Arsitektur
    [Penjelasan tech choices]
    
    ## Tantangan & Solusi
    [Problem yang dihadapi dan bagaimana mengatasinya]
    
    ## Hasil & Impact
    [Metrics atau hasil yang dicapai]

    OUTPUT JSON (Strict Minified JSON, no markdown fencing):
    {
      "title": "Nama Project Keren",
      "slug": "kebab-case-slug",
      "description": "2 kalimat deskripsi yang catchy dan profesional.",
      "content": "Markdown dengan H2 headings (## Heading). Use \\n for newlines.",
      "tech_stack": ["React", "Node.js", "PostgreSQL"],
      "demo_url": "${sourceUrl}",
      "repo_url": ""
    }
    `;
  } else {
    // Topic-based or auto-generate
    prompt = `
    You are a senior Indonesian developer who creates AMAZING project portfolios.
    
    ${topic ? `Generate a project description for: "${topic}"` : "Generate a creative, realistic web development project that shows off your skills."}
    
    LANGUAGE: **Bahasa Indonesia** (Indonesian) - NATURAL.
    DATE: Today is ${today}.

    🎨 WRITING STYLE:
    - Tulis seperti developer Indonesia menjelaskan project keren
    - Boleh pakai ekspresi: "Nah,", "Jadi gini,", "Yang menarik,"
    - Deskripsi harus catchy dan profesional
    
    📝 PROJECT REQUIREMENTS:
    - Realistic web/mobile app project
    - Modern tech stack yang make sense
    - Compelling description yang bikin orang tertarik
    
    📝 STRUKTUR MARKDOWN CONTENT (WAJIB PAKAI HEADING ##):
    
    ## Overview
    [Brief intro tentang project]
    
    ## Fitur Utama
    - Fitur 1
    - Fitur 2
    
    ## Tech Stack & Arsitektur
    [Penjelasan tech choices]
    
    ## Tantangan & Solusi
    [Problem yang dihadapi dan bagaimana mengatasinya]

    OUTPUT JSON (Strict Minified JSON, no markdown fencing):
    {
      "title": "Nama Project Keren",
      "slug": "kebab-case-slug",
      "description": "2 kalimat deskripsi yang catchy dan profesional.",
      "content": "Markdown dengan H2 headings (## Heading). Use \\n for newlines.",
      "tech_stack": ["React", "Node.js", "PostgreSQL"],
      "demo_url": "",
      "repo_url": ""
    }
    
    ⚠️ TECH STACK HARUS SPESIFIK! Contoh: "Next.js 14", "TypeScript", "Prisma", "TailwindCSS"
    `;
  }

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
        max_tokens: 3000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    const content = data.content?.[0]?.text;

    if (!content) {
      throw new Error("No content generated");
    }

    // Extract JSON with robust parsing
    const firstOpen = content.indexOf('{');
    const lastClose = content.lastIndexOf('}');
    
    if (firstOpen === -1 || lastClose === -1) {
      throw new Error("No valid JSON in response");
    }

    const jsonString = content.substring(firstOpen, lastClose + 1);
    
    let projectData;
    try {
      projectData = JSON5.parse(jsonString);
    } catch {
      console.warn("⚠️ JSON5 parse failed. Attempting state-machine repair...");
      // State-machine repair for unescaped newlines
      let result = "";
      let inString = false;
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        const prevChar = i > 0 ? jsonString[i - 1] : "";
        
        if (char === '"' && prevChar !== "\\") {
          inString = !inString;
          result += char;
        } else if (inString) {
          if (char === "\n") result += "\\n";
          else if (char === "\r") result += "";
          else if (char === "\t") result += "\\t";
          else result += char;
        } else {
          if (/\s/.test(char)) continue;
          else result += char;
        }
      }
      
      try {
        projectData = JSON5.parse(result);
      } catch {
        // Emergency regex extraction
        const titleMatch = jsonString.match(/"title"\s*:\s*"(.*?)"/);
        const slugMatch = jsonString.match(/"slug"\s*:\s*"(.*?)"/);
        const descMatch = jsonString.match(/"description"\s*:\s*"(.*?)"/);
        const contentMatch = jsonString.match(/"content"\s*:\s*"([\s\S]*?)"(?=\s*,\s*"|)/);
        
        projectData = {
          title: titleMatch ? titleMatch[1] : "Untitled Project",
          slug: slugMatch ? slugMatch[1] : `project-${Date.now()}`,
          description: descMatch ? descMatch[1] : "",
          content: contentMatch ? contentMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : "",
          tech_stack: [],
          demo_url: "",
          repo_url: ""
        };
        console.log("✅ Emergency Extraction Successful!");
      }
    }

    // Safety net: Append reference link if missing from content
    if (sourceUrl && !projectData.content.includes(sourceUrl)) {
      projectData.content += `\n\n## Referensi\n- [Sumber](${sourceUrl})`;
    }

    return { success: true, data: projectData };
  } catch (error: any) {
    console.error("AI generation error:", error);
    return { success: false, error: error.message };
  }
}

export async function improveText(selectedText: string, instructions: string) {
  if (!Z_AI_API_KEY) {
    return { success: false, error: "AI API key not configured" };
  }

  if (!selectedText.trim()) {
    return { success: false, error: "No text selected" };
  }

  const prompt = `
  You are a senior Indonesian developer who edits tech content with PERSONALITY. Your job is to improve this text while keeping the original meaning and style.
  
  LANGUAGE: Keep the SAME language as the original text (if Indonesian, output Indonesian. If English, output English).
  
  ORIGINAL TEXT TO IMPROVE:
  """
  ${selectedText}
  """
  
  USER INSTRUCTIONS:
  ${instructions || "Make it better, clearer, and more engaging while keeping the original meaning."}
  
  🎨 WRITING STYLE (WAJIB):
  - Kalau teks asli Bahasa Indonesia, tulis seperti developer Indonesia ngobrol sama developer lain
  - Boleh pakai ekspresi santai: "Nah,", "Jadi gini,", "Yang menarik,", "Wah,"
  - Struktur kalimat harus NATURAL, bukan formal berlebihan
  - Hindari bahasa terjemahan yang kaku
  
  ⚠️ CRITICAL RULES:
  1. KEEP the original meaning - don't add new information
  2. KEEP the original format (if it's a list, keep it a list; if paragraph, keep paragraph)
  3. If the text has markdown (##, **, -, etc), PRESERVE the markdown formatting
  4. Return ONLY the improved text, NO explanations or meta-commentary
  5. Do NOT wrap in quotes or add "Here's the improved version" or similar
  
  OUTPUT: Return the improved text directly, preserving any markdown formatting.
  `;

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
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json() as any;
    const improvedText = data.content?.[0]?.text?.trim();

    if (!improvedText) {
      throw new Error("No content generated");
    }

    return { success: true, data: improvedText };
  } catch (error: any) {
    console.error("AI improve error:", error);
    return { success: false, error: error.message };
  }
}
