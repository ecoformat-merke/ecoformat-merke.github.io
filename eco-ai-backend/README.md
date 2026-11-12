# Eco AI Teacher Studio — backend

This folder contains an optional Cloudflare Worker backend for **eco-ai-teacher-v2.html**.

## Requirements

- Cloudflare account, deployed Worker and Cloudflare Turnstile widget.
- OpenAI API project key with API billing (ChatGPT Plus is not an API subscription).
- Built-in Cloudflare Worker rate-limit bindings: 12 requests per minute per Cloudflare location globally and 3 per minute per client IP. **These are approximate, not a hard worldwide or monetary cap.** Configure an API project budget/alert, a strict budget gate if necessary, and verified teacher sign-in before making the API public.
- No student personal data should be submitted without the school's approval and a lawful basis.

## Setup

1. Open Cloudflare → Turnstile → Create widget. Add hostname: `ecoformat-merke.github.io`. Copy the **public Site Key** and **secret key**.
2. From `eco-ai-backend/` run `npx wrangler login`.
3. Run `npx wrangler secret put OPENAI_API_KEY` and enter OpenAI API secret.
4. Run `npx wrangler secret put TURNSTILE_SECRET_KEY` and enter Turnstile secret.
5. In `wrangler.jsonc`, ensure `GLOBAL_AI_LIMIT` and `CLIENT_AI_LIMIT` bindings are supported by your Cloudflare plan and Wrangler version (Wrangler 4.36+). Then run `npx wrangler deploy`. Note the exact Worker URL and append `/api/generate`.
6. On https://ecoformat-merke.github.io/eco-ai-teacher-v2.html choose "Серверный ИИ", enter the endpoint and the Turnstile **public Site Key**, click "Подключить защиту от ботов", pass challenge and generate.

In current version endpoint and site key are entered manually in the browser. Future version can preconfigure these once the deployment URLs are known.

## Architecture and protection

Browser → Cloudflare Turnstile → Cloudflare Worker → OpenAI Responses API.

The Worker rejects requests from origins other than `https://ecoformat-merke.github.io`, checks Turnstile tokens **server-side** with hostname, validates form fields, restricts topic lengths and output tokens, and returns only generated content. **CORS does not by itself stop abuse or authenticate end users.** The current approximate per-IP and global limits are best-effort. Teacher sign-in and a strict worldwide quota are still required for a robust public deployment. A Turnstile pass is not a full authentication or cost-control system.

API model defaults to `gpt-4.1-mini` via `OPENAI_MODEL` in `wrangler.jsonc`; change it to a currently supported model available in your API project. All generation is paid by usage at the API account's prevailing rates. The browser never receives `OPENAI_API_KEY`.

The Worker currently creates plain-text educational documents, not HTML. The site renders them as escaped paragraphs, and downloads an editable Word-compatible `.doc` document (not true DOCX). The model output is unverified and may contain errors. Official curriculum alignment is not claimed.

## API contract

POST `/api/generate`

Input JSON:
```json
{"kind":"test","grade":"10","subject":"Биология","topic":"Дыхание","goal":"...","lang":"ru","duration":45,"turnstileToken":"..."}
```

Response:
```json
{"content":"...","model":"gpt-4.1-mini","warning":"AI output must be checked by a teacher before classroom use."}
```

Do not commit a `.env`, `.dev.vars`, OpenAI key or Turnstile secret.
