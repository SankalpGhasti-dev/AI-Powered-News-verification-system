const http = require('http');
const { spawn } = require('child_process');

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9231',
    '--disable-gpu',
    'http://localhost:8080/index.html'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9231/json', res => {
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

  const widths = [1920, 1440, 1024, 768, 640, 390, 320];

  for (const w of widths) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: w,
      height: 900,
      deviceScaleFactor: 1,
      mobile: w < 768
    });
    await new Promise(r => setTimeout(r, 200));

    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        // Find elements wider than window or overflowing
        const docW = document.documentElement.scrollWidth;
        const winW = window.innerWidth;
        const overflowing = [];
        for (const el of document.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.right > winW + 1) {
            overflowing.push({
              tag: el.tagName,
              cls: el.className,
              id: el.id,
              right: Math.round(rect.right),
              width: Math.round(rect.width)
            });
          }
        }
        
        const header = document.querySelector('.site-header');
        const headerBrand = document.querySelector('.header-brand');
        const brandLink = document.querySelector('.brand-link');
        const tagline = document.querySelector('.brand-tagline');
        const nav = document.querySelector('.site-nav');
        const navAnchors = Array.from(document.querySelectorAll('.nav-anchor')).map(a => ({
          text: a.textContent.trim(),
          w: Math.round(a.getBoundingClientRect().width),
          h: Math.round(a.getBoundingClientRect().height)
        }));

        const brandRect = brandLink ? brandLink.getBoundingClientRect() : null;
        const tagRect = tagline ? tagline.getBoundingClientRect() : null;
        const brandWrapped = brandRect && tagRect ? (tagRect.top > brandRect.top + 10) : false;

        const footer = document.querySelector('.site-footer');
        const footerInner = document.querySelector('.footer-inner');
        const footerNav = document.querySelector('.footer-nav');
        const footerLinks = document.querySelector('.footer-links');

        return {
          winW,
          docW,
          hasDocOverflow: docW > winW,
          brandWrapped,
          brandRect: brandRect ? { top: Math.round(brandRect.top), left: Math.round(brandRect.left), w: Math.round(brandRect.width), h: Math.round(brandRect.height) } : null,
          tagRect: tagRect ? { top: Math.round(tagRect.top), left: Math.round(tagRect.left), w: Math.round(tagRect.width), h: Math.round(tagRect.height) } : null,
          navAnchors,
          footerInnerW: footerInner ? Math.round(footerInner.getBoundingClientRect().width) : null,
          overflowing: overflowing.slice(0, 10)
        };
      })()`,
      returnByValue: true
    });

    console.log(`=== Viewport: ${w}px ===`);
    console.log(JSON.stringify(evalRes.result.value, null, 2));
  }

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
