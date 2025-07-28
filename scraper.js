import puppeteer from 'puppeteer';
import fs from 'fs';

const KEYWORD = "Robotic Surgery";
const URL = "https://ipsearch.ipaustralia.gov.au/patents/";

(async () => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  const page = await browser.newPage();
  await page.goto(URL, { waitUntil: 'networkidle2' });

  // Type the keyword into the search box
  await page.waitForSelector('#query');
  await page.type('#query', KEYWORD);

  // Wait for the "Show" button and click it using text match
  await page.waitForFunction(() => {
    return [...document.querySelectorAll('button')].some(btn => btn.textContent.includes('Show'));
  });

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Show'));
    if (btn) btn.click();
  });

  // Wait for results table to appear
  await page.waitForSelector('#search-results table thead tr');

  // Get headers
  const headers = await page.$$eval('#search-results table thead th', ths =>
    ths.map(th => th.innerText.trim())
  );

  let allResults = [];
  let pageNumber = 1;

  while (true) {
    console.log(`Scraping page ${pageNumber}...`);

    // Wait for rows to load
    await page.waitForSelector('#search-results table tbody tr');

    // Extract table row data
    const pageResults = await page.$$eval('#search-results table tbody tr', (rows, headers) => {
      return rows.map(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        let result = {};
        cells.forEach((cell, i) => {
          if (headers[i]) {
            result[headers[i]] = cell.innerText.trim();
          }
        });
        return result;
      });
    }, headers);

    allResults.push(...pageResults);

    // Check if "Next" button is disabled
    const nextDisabled = await page.$("button[aria-label='Next'][aria-disabled='true']");
    if (nextDisabled) {
      console.log("Reached the last page.");
      break;
    }

    const nextButton = await page.$("button[aria-label='Next']:not([aria-disabled='true'])");
    if (nextButton) {
      await nextButton.evaluate(btn => btn.scrollIntoView({ block: 'center' }));

      // Wait instead of page.waitForTimeout
      await new Promise(resolve => setTimeout(resolve, 500));
      await nextButton.click();

      pageNumber++;

      await new Promise(resolve => setTimeout(resolve, 2000)); // wait for next page
    } else {
      console.log("No next button found. Ending scrape.");
      break;
    }
  }

  // Save results to a JSON file
  const filename = `results_${KEYWORD.replace(/\s+/g, '_')}.json`;
  fs.writeFileSync(filename, JSON.stringify(allResults, null, 2), 'utf-8');

  await browser.close();
  console.log(`Scraped ${allResults.length} results across ${pageNumber} pages.`);
})();
