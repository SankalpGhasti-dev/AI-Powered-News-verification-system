const http = require('http');
const { spawn } = require('child_process');

const PAGES = ['index.html', 'verify.html', 'how-it-works.html', 'samples.html', 'ledger.html', 'methodology.html'];
const WIDTHS = [1440, 768, 390, 320];

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9234',
    '--disable-gpu',
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9234/json', res => {
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

  for (const page of PAGES) {
    await send('Page.navigate', { url: `http://localhost:8080/${page}` });
    await new Promise(r => setTimeout(r, 400));

    for (const w of WIDTHS) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: w,
        height: 900,
        deviceScaleFactor: 1,
        mobile: w < 768
      });
      await new Promise(r => setTimeout(r, 200));

      const evalRes = await send('Runtime.evaluate', {
        expression: `(() => {
          document.documentElement.style.overflowX = 'visible';
          document.body.style.overflowX = 'visible';

          const winW = window.innerWidth;
          const docW = document.documentElement.scrollWidth;
          const bodyW = document.body.scrollWidth;

          const overflowing = [];
          for (const el of document.querySelectorAll('*')) {
            const rect = el.getBoundingClientRect();
            // check if an element causes page scrollbar (excludes elements inside an overflow container)
            if (rect.right > winW + 1) {
              // check if it's inside an overflow container
              let parent = el.parentElement;
              let insideScroll = false;
              while (parent && parent !== document.body && parent !== document.documentElement) {
                const s = window.getComputedStyle(parent);
                if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowX === 'hidden') {
                  insideScroll = true;
                  break;
                }
                parent = parent.parentElement;
              }
              if (!insideScroll) {
                overflowing.push({
                  tag: el.tagName,
                  cls: el.className,
                  id: el.id,
                  right: Math.round(rect.right),
                  width: Math.round(rect.width)
                });
              }
            }
          }

          return {
            page: location.pathname,
            w,
            docW,
            hasDocOverflow: docW > winW,
            uncontainedOverflowing: overflowing
          };
        })()`,
        returnByValue: true
      });

      if (evalRes.result.value.hasDocOverflow || evalRes.result.value.uncontainedOverflowing.length > 0) {
        console.log(`PAGE: ${page} at ${w}px -> OVERFLOW!`, JSON.stringify(evalRes.result.value));
      } else {
        console.log(`PAGE: ${page} at ${w}px -> OK`);
      }
    }
  }

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
