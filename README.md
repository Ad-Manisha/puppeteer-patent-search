##  Australian Patent Search Scraper  

---

### JavaScript + Puppeteer Web Scrape Automation

This script automates the extraction of patent search results from [ipaustralia.gov.au](https://ipsearch.ipaustralia.gov.au/patents/) using Puppeteer.

---

###  How to Run

1. Install dependencies
```js
    npm install
```
2. Update the keyword
    
Open `scraper.js` and modify the line below to your desired keyword:
```js
    const KEYWORD = "Robotic Surgery";
```
3. Run the script
```js
    npm run scrape
```

> **_NOTE:_**  The result is an array of json objects, saved in a file named `results_{KEYWORD}.json` .