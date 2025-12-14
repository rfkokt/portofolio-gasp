"use server";

import { fetch, Agent } from 'undici';
import JSON5 from 'json5';

const Z_AI_API_KEY = process.env.Z_AI_API_KEY;
const ANTHROPIC_ENDPOINT = 'https://api.z.ai/api/anthropic/v1/messages';

const dispatcher = new Agent({
  bodyTimeout: 300000,
  headersTimeout: 300000,
});

export async function generateBlogPost(topic?: string) {
  if (!Z_AI_API_KEY) {
    return { success: false, error: "AI API key not configured" };
  }

  const prompt = `
  You are a professional tech blog writer.
  
  ${topic ? `Generate a blog post about: "${topic}"` : "Generate a blog post about a trending topic in web development, React, or JavaScript."}
  
  The post should be:
  - Written in Bahasa Indonesia
  - Technical but accessible
  - Include code examples where relevant
  - Have a catchy title
  - Be well-structured with H2 and H3 headings
  
  OUTPUT JSON FORMAT (Strict, no markdown fencing):
  {
    "title": "Indonesian Title",
    "slug": "kebab-case-slug",
    "excerpt": "Brief 2-sentence summary",
    "content": "Full markdown content with proper formatting. Use \\n for newlines.",
    "tags": ["Tag1", "Tag2", "Tag3"]
  }
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
        max_tokens: 3500,
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

    // Extract JSON
    const firstOpen = content.indexOf('{');
    const lastClose = content.lastIndexOf('}');
    
    if (firstOpen === -1 || lastClose === -1) {
      throw new Error("No valid JSON in response");
    }

    const jsonString = content.substring(firstOpen, lastClose + 1);
    const postData = JSON5.parse(jsonString);

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

  const prompt = `
  You are a professional portfolio writer.
  
  ${topic ? `Generate a project description for: "${topic}"` : "Generate a creative web development project description."}
  
  The project should be:
  - A realistic web/mobile app project
  - Include modern tech stack
  - Have a compelling description
  - Written in Bahasa Indonesia
  
  OUTPUT JSON FORMAT (Strict, no markdown fencing):
  {
    "title": "Project Name",
    "slug": "kebab-case-slug",
    "description": "Brief 2-sentence description",
    "content": "Detailed project description in markdown with features, challenges, and solutions. Use \\n for newlines.",
    "tech_stack": ["React", "Node.js", "PostgreSQL"],
    "demo_url": "",
    "repo_url": ""
  }
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
        max_tokens: 2500,
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

    // Extract JSON
    const firstOpen = content.indexOf('{');
    const lastClose = content.lastIndexOf('}');
    
    if (firstOpen === -1 || lastClose === -1) {
      throw new Error("No valid JSON in response");
    }

    const jsonString = content.substring(firstOpen, lastClose + 1);
    const projectData = JSON5.parse(jsonString);

    return { success: true, data: projectData };
  } catch (error: any) {
    console.error("AI generation error:", error);
    return { success: false, error: error.message };
  }
}
