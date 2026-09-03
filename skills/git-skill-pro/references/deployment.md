# Deployment and Runtime Evidence

Load this reference when work affects a deploy, preview/staging/production environment, hosting provider, domains, bound resources, or runtime health.

## Deploy is a separate evidence domain

Green CI proves only the CI evidence it actually ran. It does not prove that a provider accepted a deployment, that the expected revision is running, that runtime health is good, or that rollback is data/resource compatible.

A provider control-plane `success` response is not runtime health. Require runtime/smoke/log evidence from the provider or application layer.

## Source revision

Where possible, prove the deployed source SHA/revision and compare it to the intended merge/release revision. Missing or mismatched revision evidence blocks claims such as "production has the fix."

## Vercel

Keep project/deployment identity, preview vs production, build evidence, runtime evidence, source revision, URLs/domains and rollback/redeploy evidence separate. Prefer a connected authorized Vercel tool when the host provides it.

## Cloudflare

Distinguish Workers/Pages revision from bound resources. Inventory relevant D1, KV, R2, Queues, Durable Objects and migrations/lifecycle changes. Code rollback can be incompatible with data structures/bindings/resources changed after the older revision, so resource compatibility is a rollback precondition.

## Hostinger

Hostinger Horizons and Hostinger VPS are different product surfaces.

- Horizons evidence cannot prove VPS process/systemd/PM2/Docker/SSH state.
- VPS evidence can include server/process/service/revision/health/log/backup metadata when supplied by an authorized VPS API/CLI/MCP/SSH path.

Never infer Hostinger VPS ownership/access from a generic server, Nginx file or domain.

## Rollback

A deployment rollback must check application revision, provider-resource compatibility and database compatibility. A successful provider rollback action still requires post-rollback runtime verification.
