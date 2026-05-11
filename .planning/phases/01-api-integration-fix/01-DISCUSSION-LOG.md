# Phase 1: API Integration Fix - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-11
**Phase:** 01-api-integration-fix
**Areas discussed:** Credenciais Shipoffers

---

## Credenciais Shipoffers

### Round 1: Area Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Credenciais Shipoffers | Como resolver a falta de API key/store_id | ✓ |
| Estrategia sem API key | Começar com 17track real, mock Shipoffers | |
| Template de email | Revisar template de atraso | |
| Sync e dados | Multi-shipment, typo no schema, retry | |

**User's choice:** Credenciais Shipoffers
**Notes:** User explained Ben only provided etracker login/password and Swagger link, no API credentials.

### Round 2: Resolving Credentials

| Option | Description | Selected |
|--------|-------------|----------|
| Tentar login/senha como API key | Test etracker creds on REST API | ✓ |
| Mensagem pronta pro Ben | Prepare message asking for api_key + store_id | |
| Scraping do painel como plano B | Extract data via web scraping | |
| Avançar sem Shipoffers por agora | Mock Shipoffers, real 17track | |

**User's choice:** Tentar login/senha como API key
**Notes:** User wanted to try before asking Ben again.

### Investigation Results

**Swagger analysis:** Fetched `api.shipoffers.com/api/swagger_doc/stores.json` — confirmed full endpoint structure with orders, shipments, items, products, returns, inventory.

**Auth discovery:** API returns `www-authenticate: Basic realm="API Authorization"` header. Tested:
- Password as api_key query param → 401
- Email as api_key query param → 401
- Basic Auth with etracker credentials → 401 (store_ids 1-20)
- Various combinations (empty user, empty pass) → 401

**Conclusion:** API uses HTTP Basic Auth with separate credentials from etracker. Etracker login/password do not work for API access.

### Round 3: Next Steps After Failed Test

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, prepara a mensagem | Message for Ben requesting API credentials | ✓ |
| Avançar sem Shipoffers | Mock Shipoffers + real 17track | |

**User's choice:** Sim, prepara a mensagem
**Notes:** Message prepared in English referencing Swagger docs, requesting Basic Auth credentials + store_id.

### Round 4: Continue or Wait

| Option | Description | Selected |
|--------|-------------|----------|
| Sim, atualiza e avança | Update CONTEXT.md + start executing with mock Shipoffers | ✓ |
| Só atualiza o CONTEXT | Update CONTEXT.md and stop | |
| Não, esperar o Ben | Wait for credentials | |

**User's choice:** Sim, atualiza e avança

---

## Claude's Discretion

- Field mapping from Shipoffers API response to Prisma Order model
- Error handling strategy for sync cron
- Whether to keep USE_MOCK toggle
- Multi-shipment order handling
- `shipofffersId` typo fix

## Deferred Ideas

- Scraping etracker as fallback if API credentials never arrive
- SMTP credentials — Phase 3/4
- Production env vars — Phase 4
