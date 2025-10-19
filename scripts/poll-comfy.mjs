// Poll ComfyUI status
const url = 'http://127.0.0.1:8188/system_stats';

async function poll() {
  for (let i = 1; i <= 30; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        console.log(`✓ ComfyUI online: ${data.system.comfyui_version}`);
        return;
      }
      console.log(`${i}: ${res.status}`);
    } catch (err) {
      console.log(`${i}: offline (${err.message})`);
    }
    await new Promise(r => setTimeout(r, 2000));
  }
  console.log('✗ ComfyUI timeout');
}

poll();
