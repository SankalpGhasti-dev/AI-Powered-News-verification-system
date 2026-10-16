const http = require('http');
const { spawn } = require('child_process');

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9233',
    '--disable-gpu',
    'http://localhost:8080/index.html'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9233/json', res => {
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
        document.documentElement.style.overflowX = 'visible';
        document.body.style.overflowX = 'visible';

        const winW = window.innerWidth;
        const docW = document.documentElement.scrollWidth;
        const bodyW = document.body.scrollWidth;

        const overflowing = [];
        for (const el of document.querySelectorAll('*')) {
          const rect = el.getBoundingClientRect();
          if (rect.right > winW + 1) {
            overflowing.push({
              tag: el.tagName,
              cls: el.className,
              id: el.id,
              text: el.textContent ? el.textContent.slice(0, 30) : '',
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              winW
            });
          }
        }

        return {
          winW,
          docW,
          bodyW,
          hasOverflow: docW > winW || bodyW > winW,
          overflowingCount: overflowing.length,
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
