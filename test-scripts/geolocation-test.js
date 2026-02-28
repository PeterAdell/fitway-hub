const puppeteer = require('puppeteer');

const URL = process.argv[2] || 'http://localhost:3000/app/steps';

(async () => {
  const logs = [];
  const errors = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const context = browser.defaultBrowserContext();
    const origin = new URL(URL).origin;
    await context.overridePermissions(origin, ['geolocation']);

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    page.on('console', msg => {
      const text = `[console:${msg.type()}] ${msg.text()}`;
      logs.push(text);
      console.log(text);
    });

    page.on('pageerror', err => {
      const text = `[pageerror] ${err.message}`;
      errors.push(text);
      console.error(text);
    });

    // initial geolocation (center somewhere)
    await page.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });

    console.log('Navigating to', URL);
    await page.goto(URL, { waitUntil: 'networkidle2', timeout: 60000 });

    // Click the Live Tracking tab/button
    const [liveBtn] = await page.$x("//button[contains(., 'Live Tracking')]");
    if (!liveBtn) {
      console.error('Could not find Live Tracking button');
    } else {
      await liveBtn.click();
      console.log('Clicked Live Tracking');
    }

    // Wait for MapTracker container (map div)
    await page.waitForSelector('div.h-80, .leaflet-container', { timeout: 20000 }).catch(() => {});

    // Wait briefly for leaflet to load (watch console for its logs)
    await page.waitForTimeout(2000);

    // Click 'Start Live Tracking'
    const [startBtn] = await page.$x("//button[contains(., 'Start Live Tracking')]");
    if (!startBtn) {
      console.error('Start Live Tracking button not found');
    } else {
      await startBtn.click();
      console.log('Clicked Start Live Tracking');
    }

    // After starting, simulate movement by updating geolocation several times
    const positions = [
      { lat: 37.7749, lng: -122.4194 },
      { lat: 37.7755, lng: -122.4185 },
      { lat: 37.7762, lng: -122.4176 }
    ];

    for (let i = 0; i < positions.length; i++) {
      const p = positions[i];
      await page.setGeolocation({ latitude: p.lat, longitude: p.lng });
      console.log(`Set geolocation to ${p.lat}, ${p.lng}`);
      await page.waitForTimeout(1000);
    }

    // Capture DOM state for leaflet markers and container
    const result = await page.evaluate(() => {
      const markers = Array.from(document.querySelectorAll('.leaflet-marker-icon')).map((el) => ({ src: (el.getAttribute('src') || ''), class: el.className }));
      const leafletContainer = !!document.querySelector('.leaflet-container');
      const mapDiv = Array.from(document.querySelectorAll('div')).find(d => d.className && d.className.includes('h-80')) !== undefined;
      const lastSpeed = (window).lastSpeedKmh || null;
      return { markerCount: markers.length, markers, leafletContainer, mapDiv, lastSpeed };
    });

    console.log('Result:', JSON.stringify(result, null, 2));

    // Also capture any geolocation errors printed to console by the app
    const geoErrors = logs.filter(l => l.toLowerCase().includes('geolocation') || l.toLowerCase().includes('maptracker'));

    // Final report
    console.log('--- TEST SUMMARY ---');
    console.log('Console logs captured:', logs.length);
    console.log('Console errors captured:', errors.length);
    console.log('Geolocation-related logs:', geoErrors.length);
    console.log('Markers found:', result.markerCount);
    if (!result.leafletContainer) console.log('Leaflet container not present');

    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Test failed:', err);
    try { await browser.close(); } catch (e) {}
    process.exit(2);
  }
})();
