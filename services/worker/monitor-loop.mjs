#!/usr/bin/env node
/**
 * Autonomous Job Monitoring Loop
 * 
 * Requirements:
 * - Polls /api/jobs every 10s
 * - Reports progress automatically without user prompts
 * - Self-diagnoses failures and suggests fixes
 * - Updates MONITOR-LOG.md with status changes
 * 
 * User requirement: "ты блять на автомате должен все делать а не ждать чего то от меня"
 */

import { promises as fs } from 'fs';
import { setTimeout } from 'timers/promises';

const ADMIN_URL = process.env.ADMIN_URL || 'http://localhost:3000';
const POLL_INTERVAL = 10_000; // 10 seconds
const LOG_FILE = new URL('../../docs/MONITOR-LOG.md', import.meta.url).pathname.slice(1); // Remove leading /

let lastKnownJobs = new Map(); // jobId → status

/**
 * Fetch jobs from admin API
 */
async function fetchJobs() {
  try {
    const response = await fetch(`${ADMIN_URL}/api/jobs`);
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    const data = await response.json();
    return data.jobs || [];
  } catch (error) {
    console.error(`[${timestamp()}] ❌ Failed to fetch jobs:`, error.message);
    return null;
  }
}

/**
 * Append status change to MONITOR-LOG.md
 */
async function logStatusChange(job, oldStatus, newStatus) {
  const entry = `
### [${timestamp()}] Job ${job.id.substring(0, 8)} Status Change
**Old Status:** ${oldStatus || 'unknown'}  
**New Status:** ${newStatus}  
**Backend:** ${job.backend}  
**Prompt:** "${job.prompt?.substring(0, 50)}..."  
${newStatus === 'done' ? `**✅ Output:** ${job.result?.file || 'N/A'}` : ''}
${newStatus === 'failed' ? `**❌ Error:** ${job.result?.error || 'N/A'}` : ''}

---
`;

  try {
    await fs.appendFile(LOG_FILE, entry, 'utf8');
  } catch (error) {
    console.error(`[${timestamp()}] Failed to write to MONITOR-LOG.md:`, error.message);
  }
}

/**
 * Diagnose common failures and suggest fixes
 */
function diagnoseFailure(job) {
  const error = job.result?.error || '';
  
  if (error.includes('SafetensorError')) {
    return `🔍 DIAGNOSIS: Corrupted model checkpoint
💡 FIX: Worker should auto-fallback to SD 1.5 (v1-5-pruned-emaonly)
📝 ACTION: Check services/worker/src/index.ts buildComfyWorkflow() logic`;
  }
  
  if (error.includes('ECONNREFUSED') || error.includes('fetch failed')) {
    return `🔍 DIAGNOSIS: ComfyUI server not responding
💡 FIX: Restart ComfyUI service
📝 ACTION: nssm restart OrchestratorComfyUI`;
  }
  
  if (error.includes('timeout')) {
    return `🔍 DIAGNOSIS: Generation timeout (>5min)
💡 FIX: Check ComfyUI queue, may be stuck
📝 ACTION: Visit http://localhost:8188 and check queue`;
  }
  
  if (error.includes('ENOENT') || error.includes('file not found')) {
    return `🔍 DIAGNOSIS: Path configuration issue
💡 FIX: Verify paths.json correctness
📝 ACTION: Check dropOut path in C:\\Work\\Orchestrator\\paths.json`;
  }
  
  return `🔍 DIAGNOSIS: Unknown error
💡 FIX: Check worker logs for details
📝 ACTION: Receive-Job -Id <worker-job-id> -Keep`;
}

/**
 * Format timestamp
 */
function timestamp() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

/**
 * Main monitoring loop
 */
async function monitorLoop() {
  console.log(`[${timestamp()}] 🤖 Autonomous monitoring started`);
  console.log(`[${timestamp()}] 📊 Polling ${ADMIN_URL}/api/jobs every ${POLL_INTERVAL / 1000}s`);
  console.log(`[${timestamp()}] 📝 Logging to ${LOG_FILE}`);
  console.log('');

  let iteration = 0;

  while (true) {
    iteration++;
    const jobs = await fetchJobs();

    if (jobs === null) {
      // API error, wait and retry
      await setTimeout(POLL_INTERVAL);
      continue;
    }

    // Track status changes
    let hasChanges = false;

    for (const job of jobs) {
      const jobId = job.id;
      const currentStatus = job.status;
      const previousStatus = lastKnownJobs.get(jobId);

      if (previousStatus !== currentStatus) {
        hasChanges = true;

        // First time seeing this job
        if (!previousStatus) {
          console.log(`[${timestamp()}] 🆕 New job detected: ${jobId.substring(0, 8)} (${job.backend})`);
          console.log(`                   Status: ${currentStatus}`);
          console.log(`                   Prompt: "${job.prompt?.substring(0, 60)}..."`);
        } else {
          // Status changed
          console.log(`[${timestamp()}] 🔄 Job ${jobId.substring(0, 8)}: ${previousStatus} → ${currentStatus}`);

          if (currentStatus === 'done') {
            console.log(`                   ✅ SUCCESS: ${job.result?.file || 'No file path'}`);
            console.log(`                   📦 Size: ${job.result?.size || 'unknown'} bytes`);
          } else if (currentStatus === 'failed') {
            console.log(`                   ❌ FAILED: ${job.result?.error || 'Unknown error'}`);
            console.log('');
            console.log(diagnoseFailure(job));
            console.log('');
          } else if (currentStatus === 'running') {
            console.log(`                   ⏳ Generation in progress...`);
          }
        }

        // Log to MONITOR-LOG.md
        await logStatusChange(job, previousStatus, currentStatus);

        // Update tracking
        lastKnownJobs.set(jobId, currentStatus);
      }
    }

    // Heartbeat every 6 iterations (1 minute)
    if (iteration % 6 === 0 && !hasChanges) {
      const activeCount = jobs.filter(j => j.status === 'running').length;
      const doneCount = jobs.filter(j => j.status === 'done').length;
      const failedCount = jobs.filter(j => j.status === 'failed').length;
      
      console.log(`[${timestamp()}] 💓 Heartbeat: ${jobs.length} jobs (${activeCount} running, ${doneCount} done, ${failedCount} failed)`);
    }

    // Wait before next poll
    await setTimeout(POLL_INTERVAL);
  }
}

// Start monitoring
monitorLoop().catch(error => {
  console.error(`[${timestamp()}] 💥 Monitor loop crashed:`, error);
  process.exit(1);
});
