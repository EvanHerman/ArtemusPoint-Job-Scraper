const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const DEFAULT_SOURCE_URL = 'https://recruitcrm.io/jobs/ArtemusPoint-Jobs';
const DEFAULT_OUTPUT_FILE = path.join(__dirname, 'jobs.json');

async function ensureOutputDirectory(filePath) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

async function scrapeJobs() {
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport: { width: 1440, height: 1200 },
    });

    await page.goto(process.env.SOURCE_URL || DEFAULT_SOURCE_URL, {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await page.waitForSelector('a#sTest-jobDetailFileName', {
      timeout: 60000,
      state: 'visible',
    });

    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);

    // Scroll to the bottom to ensure all jobs are rendered, then wait for the
    // job list to stabilize before reading — RecruitCRM loads jobs asynchronously.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);

    const jobs = await page.$$eval('a#sTest-jobDetailFileName', (links) => {
      const clean = (value) => String(value || '').replace(/\s+/g, ' ').trim();

      return links
        .map((link) => {
          const href = link.getAttribute('href') || '';
          const idMatch = href.match(/\/apply\/([^/?]+)/);
          const container = link.closest('li, div.flex.flex-col.md\\:flex-row') || link.parentElement;
          const cityElement = container ? container.querySelector('span#sTest-JobCity') : null;

          return {
            id: idMatch ? idMatch[1] : '',
            title: clean(link.textContent),
            city: clean(cityElement ? cityElement.textContent : ''),
          };
        })
        .filter((job) => job.id && job.title);
    });

    return jobs;
  } finally {
    await browser.close();
  }
}

async function writeOutput(jobs) {
  const outputFile = process.env.OUTPUT_FILE || DEFAULT_OUTPUT_FILE;
  const payload = {
    generatedAt: new Date().toISOString(),
    source: process.env.SOURCE_URL || DEFAULT_SOURCE_URL,
    jobs: jobs.map((job) => ({
      id: normalizeText(job.id),
      title: normalizeText(job.title),
      city: normalizeText(job.city),
    })),
  };

  await ensureOutputDirectory(outputFile);
  await fs.writeFile(outputFile, JSON.stringify(payload, null, 2) + '\n', 'utf8');

  return outputFile;
}

async function main() {
  const jobs = await scrapeJobs();

  if (!jobs.length) {
    throw new Error('No jobs were found on the RecruitCRM page.');
  }

  const outputFile = await writeOutput(jobs);
  console.log(`Wrote ${jobs.length} jobs to ${outputFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});