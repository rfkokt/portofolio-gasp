export interface SeoAnalysisResult {
    score: number;
    metrics: {
        titleLength: { score: number; message: string; status: 'good' | 'warning' | 'bad' };
        excerptLength: { score: number; message: string; status: 'good' | 'warning' | 'bad' };
        slugStructure: { score: number; message: string; status: 'good' | 'warning' | 'bad' };
        contentLength: { score: number; message: string; status: 'good' | 'warning' | 'bad' };
        headings: { score: number; message: string; status: 'good' | 'warning' | 'bad' };
    };
    tips: string[];
}

/**
 * SEO Analysis Logic
 * Based on Google Search Essentials and standard SEO best practices.
 * 
 * References:
 * - Title Links: https://developers.google.com/search/docs/appearance/title-link (Ideal: 50-60 chars)
 * - Snippets/Meta Description: https://developers.google.com/search/docs/appearance/snippet (Ideal: ~160 chars)
 * - URL Structure: https://developers.google.com/search/docs/crawling-indexing/url-structure
 * - Headings: https://developers.google.com/search/docs/crawling-indexing/special-tags
 */
export function analyzeSeo(title: string, excerpt: string, slug: string, content: string): SeoAnalysisResult {
    const metrics: SeoAnalysisResult['metrics'] = {
        titleLength: { score: 0, message: '', status: 'bad' },
        excerptLength: { score: 0, message: '', status: 'bad' },
        slugStructure: { score: 0, message: '', status: 'bad' },
        contentLength: { score: 0, message: '', status: 'bad' },
        headings: { score: 0, message: '', status: 'bad' }
    };

    const tips: string[] = [];

    // 1. Title Analysis (Ideal: 40-60 chars)
    const titleLen = title.length;
    if (titleLen >= 30 && titleLen <= 65) {
        metrics.titleLength = { score: 20, message: 'Perfect length', status: 'good' };
    } else if (titleLen > 10 && titleLen < 30) {
        metrics.titleLength = { score: 10, message: 'Too short (aim for 40-60 chars)', status: 'warning' };
        tips.push("Title is a bit short. Add more keywords.");
    } else if (titleLen > 65) {
        metrics.titleLength = { score: 10, message: 'Too long (likely truncated in SERP)', status: 'warning' };
        tips.push("Title is too long. Keep it under 60 characters.");
    } else {
        metrics.titleLength = { score: 0, message: 'Missing or very short title', status: 'bad' };
        tips.push("Add a descriptive title.");
    }

    // 2. Excerpt Analysis (Ideal: 120-160 chars)
    const excerptLen = excerpt.length;
    if (excerptLen >= 120 && excerptLen <= 160) {
        metrics.excerptLength = { score: 20, message: 'Optimal meta description length', status: 'good' };
    } else if (excerptLen > 50 && excerptLen < 120) {
        metrics.excerptLength = { score: 10, message: 'Too short for meta description', status: 'warning' };
        tips.push("Expand the excerpt to summarize the article better (120-160 chars).");
    } else if (excerptLen > 160) {
        metrics.excerptLength = { score: 10, message: 'Too long, may be truncated', status: 'warning' };
        tips.push("Shorten the excerpt to under 160 characters.");
    } else {
        metrics.excerptLength = { score: 0, message: 'Missing or too short', status: 'bad' };
        tips.push("Write a compelling excerpt/meta description.");
    }

    // 3. Content Length (Ideal: > 300 words for basic posts, > 1000 for authoritative)
    // Strip markdown/html roughly
    const wordCount = content.replace(/[#*`[\]()]/g, '').split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount >= 600) {
        metrics.contentLength = { score: 30, message: `Excellent depth (${wordCount} words)`, status: 'good' };
    } else if (wordCount >= 300) {
        metrics.contentLength = { score: 20, message: `Good length (${wordCount} words)`, status: 'good' };
    } else if (wordCount > 100) {
        metrics.contentLength = { score: 10, message: `Thin content (${wordCount} words)`, status: 'warning' };
        tips.push("Content is thin. Aim for at least 300 words.");
    } else {
        metrics.contentLength = { score: 0, message: 'Very little content', status: 'bad' };
        tips.push("Write more content to provide value.");
    }

    // 4. Slug Analysis
    if (/^[a-z0-9-]+$/.test(slug) && !slug.includes('--')) {
        if (slug.length < 75) {
             metrics.slugStructure = { score: 15, message: 'Clean and concise URL', status: 'good' };
        } else {
             metrics.slugStructure = { score: 10, message: 'URL is a bit long', status: 'warning' };
             tips.push("Shorten the URL slug.");
        }
    } else {
        metrics.slugStructure = { score: 0, message: 'Invalid characters in slug', status: 'bad' };
        tips.push("Slug should only contain lowercase letters, numbers, and hyphens.");
    }

    // 5. Headings Analysis (Check for H2/H3 usage)
    const hasH2 = /^##\s/m.test(content);
    const hasH3 = /^###\s/m.test(content);
    
    if (hasH2 && hasH3) {
        metrics.headings = { score: 15, message: 'Good heading structure', status: 'good' };
    } else if (hasH2) {
        metrics.headings = { score: 10, message: 'Basic structure (H2 only)', status: 'warning' };
        tips.push("Use H3 headings to maintain hierarchy.");
    } else {
        metrics.headings = { score: 0, message: 'No subheadings found', status: 'bad' };
        tips.push("Break up content with H2/H3 headings.");
    }

    const totalScore = 
        metrics.titleLength.score + 
        metrics.excerptLength.score + 
        metrics.contentLength.score + 
        metrics.slugStructure.score + 
        metrics.headings.score;

    return { score: totalScore, metrics, tips };
}
