import Parser from 'rss-parser';

const parser = new Parser();

const FEEDS = [
    { name: 'Node.js Security', url: 'https://nodejs.org/en/feed/vulnerability.xml', type: ['security', 'node'] },
    { name: 'React Blog', url: 'https://react.dev/feed.xml', type: ['frontend', 'react'] },
    { name: 'Vercel Blog', url: 'https://vercel.com/atom', type: ['infrastructure', 'frontend', 'vercel'] },
    { name: 'OpenAI Blog', url: 'https://openai.com/news/rss.xml', type: ['ai'] },
    { name: 'GitHub Blog', url: 'https://github.blog/feed/', type: ['tech', 'devops', 'github'] },
    { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', type: ['tech', 'news'] },
    { name: 'Web.dev', url: 'https://web.dev/feed.xml', type: ['frontend', 'security', 'performance'] },
    { name: 'Mozilla Hacks', url: 'https://hacks.mozilla.org/feed/', type: ['frontend', 'browser'] }
];

async function checkFeeds() {
    console.log("Checking feeds for dates...");
    for (const feed of FEEDS) {
        try {
            console.log(`\n--- ${feed.name} ---`);
            const feedData = await parser.parseURL(feed.url);
            const items = feedData.items.slice(0, 3); // Check top 3
            
            items.forEach(item => {
                const date = new Date(item.pubDate || item.isoDate || new Date());
                console.log(`[${date.toISOString()}] ${item.title}`);
            });
        } catch (e) {
            console.error(`Failed to fetch ${feed.name}: ${e.message}`);
        }
    }
}

checkFeeds();
