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

const VIEWPORTS = [
  { w: 1920, h: 1080, name: '1920' },
  { w: 1440, h: 960, name: '1440' },
  { w: 390, h: 844, name: '390' },
  { w: 320, h: 568, name: '320' }
];

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9235',
    '--disable-gpu',
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 1600));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9235/json', res => {
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

  const report = {};

  for (const vp of VIEWPORTS) {
    report[vp.name] = {};

    await send('Emulation.setDeviceMetricsOverride', {
      width: vp.w,
      height: vp.h,
      deviceScaleFactor: 1,
      mobile: vp.w < 768
    });

    for (const p of PAGES) {
      await send('Page.navigate', { url: `http://localhost:8080/${p.file}` });
      await new Promise(r => setTimeout(r, 350));

      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;
          const winW = window.innerWidth;

          const header = document.querySelector('.site-header');
          const headerContainer = document.querySelector('.header-container');
          const brandLink = document.querySelector('.brand-link');
          const tagline = document.querySelector('.brand-tagline');
          const navAnchors = Array.from(document.querySelectorAll('.nav-anchor')).map(a => ({
            text: a.textContent.trim(),
            w: Math.round(a.getBoundingClientRect().width),
            h: Math.round(a.getBoundingClientRect().height)
          }));

          const brandRect = brandLink ? brandLink.getBoundingClientRect() : null;
          const tagRect = tagline ? tagline.getBoundingClientRect() : null;
          const isTaglineVisible = tagline ? window.getComputedStyle(tagline).display !== 'none' : false;

          const footer = document.querySelector('.site-footer');
          const footerContainer = document.querySelector('.footer-container');
          const footerLayout = document.querySelector('.footer-layout');

          // Find any element exceeding viewport
          const overflowing = [];
          for (const el of document.querySelectorAll('*')) {
            const rect = el.getBoundingClientRect();
            if (rect.right > winW + 1) {
              overflowing.push(el.tagName + (el.className ? '.' + el.className.split(' ').join('.') : ''));
            }
          }

          return {
            winW,
            docW,
            hasHorizontalScrollbar: docW > winW || bodyW > winW,
            headerH: header ? Math.round(header.getBoundingClientRect().height) : null,
            isTaglineVisible,
            taglineBesideBrand: (brandRect && tagRect && isTaglineVisible) ? Math.abs(tagRect.top - brandRect.top) < 10 : null,
            navAnchors,
            footerContainerW: footerContainer ? Math.round(footerContainer.getBoundingClientRect().width) : null,
            footerH: footer ? Math.round(footer.getBoundingClientRect().height) : null,
            overflowing
          };
        })()`,
        returnByValue: true
      });

      report[vp.name][p.name] = evalRes.result.value;

      // Capture screenshot for key pages
      if (p.name === 'home' || p.name === 'verify') {
        const screenshotData = await send('Page.captureScreenshot', { format: 'png' });
        const filename = `${p.name}_${vp.name}px.png`;
        fs.writeFileSync(path.join(ARTIFACT_DIR, filename), Buffer.from(screenshotData.data, 'base64'));
        console.log(`Saved screenshot: ${filename}`);
      }
    }
  }

  console.log("=== COMPREHENSIVE VERIFICATION REPORT ===");
  console.log(JSON.stringify(report, null, 2));

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
