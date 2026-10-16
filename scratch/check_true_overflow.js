const http = require('http');
const { spawn } = require('child_process');

const PAGES = ['index.html', 'verify.html', 'how-it-works.html', 'samples.html', 'ledger.html', 'methodology.html'];

async function main() {
  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9232',
    '--disable-gpu',
    'http://localhost:8080'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  const pageTab = await new Promise((resolve, reject) => {
    http.get('http://127.0.0.1:9232/json', res => {
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

    // Test with and without overflow-x: hidden on body/html
    const evalRes = await send('Runtime.evaluate', {
      expression: `(() => {
        // Temporarily disable overflow-x: hidden on html and body to see true overflow
        const origHtmlOverflow = document.documentElement.style.overflowX;
        const origBodyOverflow = document.body.style.overflowX;
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
              right: Math.round(rect.right),
              width: Math.round(rect.width),
              winW
            });
          }
        }

        // Restore
        document.documentElement.style.overflowX = origHtmlOverflow;
        document.body.style.overflowX = origBodyOverflow;

        return {
          page: location.pathname,
          winW,
          docW,
          bodyW,
          hasOverflow: docW > winW || bodyW > winW,
          overflowing: overflowing.slice(0, 5)
        };
      })()`,
      returnByValue: true
    });

    console.log(JSON.stringify(evalRes.result.value, null, 2));
  }

  ws.close();
  chromeProc.kill();
}

main().catch(console.error);
