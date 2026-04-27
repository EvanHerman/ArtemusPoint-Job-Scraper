# RecruitCRM Job Scraper

This package runs a Playwright scraper against the Artemus Point RecruitCRM jobs page and updates a tracked `jobs.json` file in the repository root.

## What It Produces

The scraper writes `jobs.json` in this shape:

```json
{
  "generatedAt": "2026-04-27T23:00:00.000Z",
  "source": "https://recruitcrm.io/jobs/ArtemusPoint-Jobs",
  "jobs": [
    {
      "id": "17743713131430121117spL",
      "title": "Senior Millwork Estimator, Long Island, NY - $120k - $165k",
      "city": "Town of Islip (Islip, NY)"
    }
  ]
}
```

## Local Usage

1. Run `npm install`
2. Run `npx playwright install chromium`
3. Run `npm run scrape`

The output file will be written to `jobs.json`.

## GitHub Actions Setup

1. Put this directory in its own GitHub repository.
2. Push the repository to GitHub.
3. Make sure GitHub Actions is enabled for the repository.
4. Make sure the default `GITHUB_TOKEN` has permission to write repository contents.
5. Run the `Scrape RecruitCRM Jobs` workflow once manually.

After that, GitHub Actions will run every 30 minutes, regenerate `jobs.json`, and commit it back into the repository when the content changes.

Your raw JSON URL can then come from the repository itself, for example:

`https://raw.githubusercontent.com/YOUR-ORG/YOUR-REPO/main/jobs.json`

## Optional Environment Variables

- `SOURCE_URL`: Override the RecruitCRM jobs page URL.
- `OUTPUT_FILE`: Override the output file path.

## WordPress Integration

Update your WordPress plugin so it fetches the committed `jobs.json` URL every 30 minutes, stores it in a transient, and renders the shortcode from that JSON.