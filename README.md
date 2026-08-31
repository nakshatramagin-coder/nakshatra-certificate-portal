# Nakshatra Certificate Verification Portal

## What this does
This package deploys a live Cloudflare Worker portal.

Users enter:
- Your Name
- Issue Date

The Worker searches Airtable dynamically and returns:
- Certificate Verified
- Status
- Download Certificate button when a Certificate attachment exists

## Airtable defaults
- Table: Table 1
- Name field: Your Name
- Date field: Date
- Status field: Status
- Certificate field: Certificate

## REQUIRED Cloudflare variables
In Cloudflare Worker:
Settings → Variables and Secrets

Add:
1. AIRTABLE_BASE_ID — Type: Text
2. AIRTABLE_TOKEN — Type: Secret

Do NOT put the Airtable token in GitHub or inside the source code.

## Optional variables
Only if your Airtable column names differ:
- AIRTABLE_TABLE_NAME
- AIRTABLE_NAME_FIELD
- AIRTABLE_DATE_FIELD
- AIRTABLE_STATUS_FIELD
- AIRTABLE_CERTIFICATE_FIELD

## Deploy
Upload this package contents to a GitHub repository, then connect the repository to Cloudflare Workers and deploy.

After deployment, your Cloudflare Worker URL is the live public certificate portal.
