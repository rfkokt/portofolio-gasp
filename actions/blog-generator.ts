"use server";

import { exec } from "child_process";
import { promisify } from "util";
import path from "path";

const execAsync = promisify(exec);

export async function runBlogGenerator(count: number = 3) {
  try {
    const scriptPath = path.join(process.cwd(), "scripts", "ai-blogger.mjs");
    
    // Run the script with the count as environment variable
    const { stdout, stderr } = await execAsync(
      `MAX_BLOGS=${count} node "${scriptPath}"`,
      {
        timeout: 600000, // 10 minute timeout
        env: {
          ...process.env,
          MAX_BLOGS: count.toString(),
        },
      }
    );

    if (stderr && !stderr.includes("ExperimentalWarning")) {
      console.error("Blog generator stderr:", stderr);
    }

    console.log("Blog generator output:", stdout);
    
    return { 
      success: true, 
      message: `Successfully generated blogs`,
      output: stdout 
    };
  } catch (error: any) {
    console.error("Blog generator error:", error);
    return { 
      success: false, 
      error: error.message || "Failed to run blog generator" 
    };
  }
}
