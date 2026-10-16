const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\90a13cfd-3463-4a19-829e-5e8fd8bc9995';

const PAGES = [
  { file: 'index.html', name: 'home' },
  { file: 'verify.html', name: 'verify' },
  { file: 'how-it-works.html', name: 'how_it_works' },
  { file: 'samples.html', name: 'samples' },
  { file: 'ledger.html', name: 'ledger' },
  { file: 'methodology.html', name: 'methodology' }
];

async function run() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9230',
    '--disable-gpu',
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9230/json', res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        const tabs = JSON.parse(data);
        resolve(tabs.find(t => t.type === 'page' && t.url.includes('8080')));
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
  await send('Runtime.enable');

  const report = {};

  for (const page of PAGES) {
    const url = `http://localhost:8080/${page.file}`;
    console.log(`Navigating to ${url}...`);
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 800));

    // 1. Desktop Viewport Screenshot (1440x960)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 960,
      deviceScaleFactor: 1,
      mobile: false
    });
    await new Promise(r => setTimeout(r, 200));

    const deskShot = await send('Page.captureScreenshot', { format: 'png' });
    const deskPath = path.join(ARTIFACT_DIR, `desktop_${page.name}.png`);
    fs.writeFileSync(deskPath, Buffer.from(deskShot.data, 'base64'));

    // Check desktop overflow
    const deskCheck = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        title: document.title,
        innerWidth: window.innerWidth,
        scrollWidth: document.body.scrollWidth,
        overflow: document.body.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });

    // 2. Mobile Viewport Screenshot (390x844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true
    });
    await new Promise(r => setTimeout(r, 200));

    const mobShot = await send('Page.captureScreenshot', { format: 'png' });
    const mobPath = path.join(ARTIFACT_DIR, `mobile_${page.name}.png`);
    fs.writeFileSync(mobPath, Buffer.from(mobShot.data, 'base64'));

    // Check mobile overflow
    const mobCheck = await send('Runtime.evaluate', {
      expression: `JSON.stringify({
        innerWidth: window.innerWidth,
        scrollWidth: document.body.scrollWidth,
        overflow: document.body.scrollWidth > window.innerWidth
      })`,
      returnByValue: true
    });

    report[page.name] = {
      desktop: JSON.parse(deskCheck.result.value),
      mobile: JSON.parse(mobCheck.result.value),
      desktopScreenshot: `desktop_${page.name}.png`,
      mobileScreenshot: `mobile_${page.name}.png`
    };
  }

  // 3. Test Cross-Page Navigation: Load case from samples into verify
  console.log('Testing cross-page query param loading...');
  await send('Page.navigate', { url: 'http://localhost:8080/verify.html?case=antimicrobial-approval' });
  await new Promise(r => setTimeout(r, 1000));

  const verifyParamCheck = await send('Runtime.evaluate', {
    expression: `JSON.stringify({
      newsVal: document.querySelector('#news')?.value,
      verdictText: document.querySelector('#verdict')?.textContent,
      resultVisible: !document.querySelector('#result')?.hidden,
      caseId: document.querySelector('#case-id')?.textContent
    })`,
    returnByValue: true
  });
  report.crossPageParamLoad = JSON.parse(verifyParamCheck.result.value);

  console.log('FINAL_REPORT:', JSON.stringify(report, null, 2));

  ws.close();
  chromeProc.kill();
}

run().catch(console.error);
