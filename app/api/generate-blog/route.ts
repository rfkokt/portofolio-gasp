import { NextRequest } from "next/server";
import { spawn } from "child_process";
import path from "path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 minutes max for AI generation

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const count = parseInt(searchParams.get("count") || "1");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: any) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Controller might be closed
        }
      };

      // Heartbeat to keep connection alive during long AI generation
      let lastActivity = Date.now();
      const heartbeatInterval = setInterval(() => {
        const elapsed = Math.round((Date.now() - lastActivity) / 1000);
        if (elapsed > 5) {
          sendEvent({ type: "step", message: `⏱️ AI generating content... (${elapsed}s)` });
        }
      }, 10000); // Every 10 seconds

      try {
        sendEvent({ type: "start", message: "Starting blog generator...", count });

        const scriptRelative = Buffer.from("c2NyaXB0cy9haS1ibG9nZ2VyLm1qcw==", "base64").toString("utf-8"); // scripts/ai-blogger.mjs
        
        console.log("🚀 Spawning AI Blogger script:", scriptRelative);
        console.log("📂 Current directory:", process.cwd());

        const child = spawn("node", [scriptRelative], {
          env: {
            ...process.env,
            MAX_BLOGS: count.toString(),
          },
          cwd: process.cwd(),
        });

        let completed = 0;
        let currentTitle = "";

        child.stdout.on("data", (data: Buffer) => {
          lastActivity = Date.now(); // Reset heartbeat timer
          const output = data.toString();
          const lines = output.split("\n").filter(Boolean);

          for (const line of lines) {
            // Parse different types of output based on actual script logs
            if (line.includes("⏳ Processing")) {
              const match = line.match(/\[(\d+)\/(\d+)\]: (.+)/);
              if (match) {
                currentTitle = match[3];
                sendEvent({ 
                  type: "processing", 
                  current: parseInt(match[1]), 
                  total: parseInt(match[2]),
                  title: currentTitle,
                  message: `⏳ Processing ${match[1]}/${match[2]}: ${currentTitle.substring(0, 40)}...`
                });
              }
            } else if (line.includes("✅ Published")) {
              completed++;
              const match = line.match(/Published: "(.+)"/);
              const title = match ? match[1] : currentTitle;
              sendEvent({ 
                type: "completed", 
                completed,
                total: count,
                title,
                message: `✅ Published (${completed}/${count}): ${title.substring(0, 40)}...`
              });
            } else if (line.includes("📡 Fetching")) {
              sendEvent({ type: "step", message: line.trim() });
            } else if (line.includes("✅ Fetched")) {
              sendEvent({ type: "step", message: line.trim() });
            } else if (line.includes("📰 Found")) {
              sendEvent({ type: "step", message: line.trim() });
            } else if (line.includes("🔌 Connecting")) {
              sendEvent({ type: "step", message: "🔌 Connecting to database..." });
            } else if (line.includes("🤖 Generating")) {
              sendEvent({ type: "step", message: line.trim().substring(0, 60) + "..." });
            } else if (line.includes("⏭️ Skipping")) {
              sendEvent({ type: "step", message: line.trim().substring(0, 60) + "..." });
            } else if (line.includes("⚠️")) {
              sendEvent({ type: "step", message: line.trim().substring(0, 60) + "..." });
            } else if (line.includes("📊 Generation Summary")) {
              sendEvent({ type: "step", message: "📊 Generating summary..." });
            } else if (line.includes("✅ Successfully published:")) {
              const match = line.match(/(\d+)/);
              if (match) {
                completed = parseInt(match[1]);
                sendEvent({ type: "step", message: line.trim() });
              }
            } else if (line.includes("❌ Failed:")) {
              sendEvent({ type: "step", message: line.trim() });
            } else if (line.includes("ℹ️")) {
              sendEvent({ type: "step", message: line.trim() });
            } else if (line.includes("❌")) {
              sendEvent({ type: "error", message: line.trim().substring(0, 60) + "..." });
            }
          }
        });

        child.stderr.on("data", (data: Buffer) => {
          const error = data.toString();
          if (!error.includes("ExperimentalWarning")) {
            sendEvent({ type: "error", message: error });
          }
        });

        await new Promise<void>((resolve, reject) => {
          child.on("close", (code) => {
            clearInterval(heartbeatInterval); // Clean up heartbeat
            if (code === 0) {
              sendEvent({ 
                type: "done", 
                completed,
                message: `✨ Completed! Generated ${completed} blog posts.`
              });
            } else {
              sendEvent({ 
                type: "error", 
                message: `Process exited with code ${code}`
              });
            }
            resolve();
          });

          child.on("error", (err) => {
            sendEvent({ type: "error", message: err.message });
            reject(err);
          });
        });

      } catch (error: any) {
        sendEvent({ type: "error", message: error.message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
