const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\90a13cfd-3463-4a19-829e-5e8fd8bc9995';

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9237',
    '--disable-gpu',
    'http://localhost:8080/index.html'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9237/json', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const tabs = JSON.parse(data);
        resolve(tabs.find(t => t.type === 'page'));
      });
    }).on('error', reject);
  });

  const ws = new WebSocket(pageTab.webSocketDebuggerUrl);
  let id = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const msgId = id++;
      pending.set(msgId, { resolve, reject });
      ws.send(JSON.stringify({ id: msgId, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    }
  };

  await new Promise(r => ws.onopen = r);
  await send('Page.enable');

  const targets = [
    { w: 1440, h: 900, name: 'footer_1440px.png', mobile: false },
    { w: 1920, h: 1080, name: 'footer_1920px.png', mobile: false },
    { w: 390, h: 844, name: 'footer_390px.png', mobile: true },
    { w: 320, h: 568, name: 'footer_320px.png', mobile: true }
  ];

  for (const t of targets) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: t.w,
      height: t.h,
      deviceScaleFactor: 1,
      mobile: t.mobile
    });
    await send('Page.navigate', { url: 'http://localhost:8080/index.html' });
    await new Promise(r => setTimeout(r, 400));

    // Scroll directly to footer
    await send('Runtime.evaluate', {
      expression: `document.querySelector('.site-footer').scrollIntoView({ block: 'end' })`
    });
    await new Promise(r => setTimeout(r, 300));

    const s = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(path.join(ARTIFACT_DIR, t.name), Buffer.from(s.data, 'base64'));
    console.log(`Saved: ${t.name}`);
  }

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
