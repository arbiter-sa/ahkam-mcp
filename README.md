<p align="center">
  <img src="assets/ahkam-icon-512.png" alt="Ahkam" width="96" height="96">
</p>

<h1 align="center">Ahkam MCP — Saudi court rulings</h1>

<p align="center">
  <a href="https://ahkam.arbiter.sa/developers/en">Developer guide</a> ·
  <a href="https://ahkam.arbiter.sa/developers/terms/en">Terms</a> ·
  <a href="https://ahkam.arbiter.sa/privacy/en">Privacy</a> ·
  <a href="https://registry.modelcontextprotocol.io/v0/servers/sa.arbiter%2Fahkam/versions/latest">MCP Registry: <code>sa.arbiter/ahkam</code></a> ·
  <a href="#العربية">العربية</a>
</p>

Reference page for the public **Ahkam** ([أحكام](https://ahkam.arbiter.sa)) Model Context Protocol server. This repository holds documentation, client configuration examples and the registry metadata (`server.json`) only. It contains no server code.

> **Not legal advice.** Every result is an automated research aid. Human review by a qualified professional is required before relying on it.

## What Ahkam is

Ahkam is a search engine for published Saudi court rulings: more than **110,000** rulings from the Ministry of Justice, the Board of Grievances, and the tax, customs, securities, telecom and other dispute committees. The MCP server lets an AI agent search these rulings, read a ruling, and get an analysis of **redacted** facts that is limited to the rulings retrieved.

| | |
|---|---|
| Server URL | `https://mcp.ahkam.arbiter.sa/mcp` |
| Transport | Streamable HTTP, stateless (each request is independent; no session) |
| Authentication | OAuth 2.1 with your Ahkam account (claude.ai, ChatGPT, Claude Code), or an API key: `Authorization: Bearer <consumer>.<k1\|k2>.<secret>` |
| Sandbox | `https://mcp.ahkam.arbiter.sa/sandbox/mcp` — deterministic responses without a model, for sandbox keys only |
| Server card | `GET https://mcp.ahkam.arbiter.sa/` — tools and paths, no key needed |
| Registry | [`sa.arbiter/ahkam`](https://registry.modelcontextprotocol.io/v0/servers/sa.arbiter%2Fahkam/versions/latest) in the official MCP Registry |

## Tools

| Tool | What it does | Main parameters | Type |
|---|---|---|---|
| `search_rulings` | Hybrid search (keyword and semantic), in Arabic or English | `query` (up to 500 characters), `filters?` {`authority`, `court`, `yearFrom`, `yearTo`} (Hijri years), `limit?` (1–20) | Read-only |
| `get_ruling` | One ruling: title, link, date, court, and the summary or a short excerpt, plus the full text for an account signed in via OAuth | `id`, `offset?` (start of the slice, default 0) | Read-only |
| `analyze_facts` | Retrieves the rulings closest to redacted facts and analyzes the facts in their light only | `facts` (200–8000 characters, redacted), `kind` (`consultation`, `memo`, `lawsuit` or `case_study`), `question?`, `matterType?`, `court?`, `lang?`, `limit?` (1–10) | Read-only |
| `rate_result` | Rates a ruling that appeared in an earlier response | `requestId`, `id`, `useful`, `reason?` (`irrelevant`, `outdated`, `duplicate` or `wrong_court`) | Write (non-destructive) |
| `report_issue` | Reports a data problem in a ruling | `id`, `kind` (`garbled_text`, `wrong_date`, `wrong_metadata` or `duplicate`) | Write (non-destructive) |

`rate_result` and `report_issue` accept no free text — only IDs and values from closed lists. No tool modifies or deletes anything.

### What each account gets (OAuth connector)

| Membership | Tools | Limits per member |
|---|---|---|
| **Free** | `search_rulings` and `get_ruling` with the full text | Search 2 per second and 2,000 per month; full text of 30 distinct rulings per day |
| **Paid** | All five tools (adds `analyze_facts`, `rate_result`, `report_issue`) | Search 5 per second and 20,000 per month; analysis 5 per minute and 300 per month; full text of 200 distinct rulings per day |

The plan is read on every call. When a paid plan ends, the three paid tools return `plan_required`. The day for the full-text limit is the UTC day; continuing the same ruling with `offset`, or reading it again, is not counted. Over the limit returns `429 fulltext_daily_limit` with `retryAfter`.

API keys (for servers and agents that do not sign in with OAuth) have their own default limits: `analyze_facts` 10 per minute and 2,000 per month; `search_rulings` and `get_ruling` 5 per second and 50,000 per month; shared between REST and MCP for the same key. Consumer keys get no full text unless their policy explicitly allows it. Other limits: parameters up to 64 KB, envelope up to 128 KB, response up to 256 KB; the model is cut off at 15 seconds (`analysis: null`, `reason: "model_timeout"`).

### Attribution: every ruling links to its Ahkam page

The only link for each ruling returned by `search_rulings`, `analyze_facts` and `get_ruling` is its page on Ahkam (`url`, `https://ahkam.arbiter.sa/j/<id>`), and that page shows the official source link at its end. Each ruling also carries `sourceName`, the issuing authority. No tool response carries a link on any host other than `ahkam.arbiter.sa` (except links inside a ruling's own text). Show the `url` with every ruling you display.

## Add Ahkam to your client

### claude.ai (also Claude Desktop and mobile — the connector follows your account)
1. **Customize → Connectors → + Add → Add custom connector.**
2. Name `Ahkam`, URL `https://mcp.ahkam.arbiter.sa/mcp`. Leave the OAuth Client ID and Secret empty (Claude registers itself).
3. **Connect**: the Ahkam page opens. Sign in with your Ahkam account (Google, an email code, or Apple), then choose **Allow** (السماح بالربط).

### ChatGPT
1. **Settings → Apps & Connectors →** enable **Developer mode** under advanced settings if needed **→ Create**.
2. URL `https://mcp.ahkam.arbiter.sa/mcp`, authentication **OAuth**.
3. Sign in with your Ahkam account and choose **Allow**.

Disconnect any app at any time from [My account](https://ahkam.arbiter.sa/me) → **Connected apps** (التطبيقات المتّصلة). It takes effect immediately.

### Claude Code
With your Ahkam account (OAuth, browser sign-in on a local loopback address):
```bash
claude mcp add --transport http ahkam https://mcp.ahkam.arbiter.sa/mcp
# then, inside Claude Code: /mcp  →  ahkam  →  Authenticate
```
Or with an API key kept in an environment variable:
```bash
claude mcp add --transport http ahkam https://mcp.ahkam.arbiter.sa/mcp --header "Authorization: Bearer $AHKAM_MCP_KEY"
```
Project-scoped file: [`examples/claude-code.mcp.json`](examples/claude-code.mcp.json).

### Cursor (API key)
`~/.cursor/mcp.json`, or `.cursor/mcp.json` in the project — see [`examples/cursor.mcp.json`](examples/cursor.mcp.json):
```json
{ "mcpServers": { "ahkam": {
  "url": "https://mcp.ahkam.arbiter.sa/mcp",
  "headers": { "Authorization": "Bearer ${env:AHKAM_MCP_KEY}" } } } }
```

### Claude Desktop with a key (via `mcp-remote`)
In `claude_desktop_config.json` — see [`examples/claude_desktop_config.json`](examples/claude_desktop_config.json). The key goes in `env`, not in the arguments, with no space after the colon in `--header` to avoid a quoting issue on Windows. (If you use the claude.ai connector above, Claude Desktop already has it — no key needed.)

### Programmatic client
Any MCP SDK works. [`examples/client/`](examples/client/) uses `@modelcontextprotocol/sdk` with `StreamableHTTPClientTransport` and reads the key from `AHKAM_MCP_KEY`:
```bash
cd examples/client && npm install && AHKAM_MCP_KEY="<consumer>.k1.<secret>" npm start
```

### Getting an API key
Ahkam issues keys per consumer after reviewing a request (no key is issued automatically); the secret is shown once. Request one with the form on the [developer page](https://ahkam.arbiter.sa/developers#request) or by email to support. The MCP channel must be enabled in the key policy (otherwise `channel_not_allowed`). Never commit a key: every example here uses the placeholder `KEY` or an environment variable.

## Rules stated in the tool descriptions
1. **Redact facts before sending them.** Replace names and IDs with roles such as `[the employee]` and `[the employer]`. Ahkam masks as a second layer, but your redaction is the first.
2. **The result is a research aid, not a legal opinion**, and human review is required. Every result carries a `disclaimer`.
3. **Cite only the links in `items`.**

## Privacy in brief
- Facts and query text are **not stored**.
- For each request a usage log **without content** is kept (time, account or consumer, operation, result code, a SHA-256 hash of the facts, IDs of rulings returned) and deleted after **30 days**. The analysis response alone is kept encrypted for 10 minutes so a repeated `requestId` is not counted twice.
- Fact analysis is processed by **DeepSeek in China**; every analysis response declares the model and its region (`model.provider`, `model.region: "CN"`). Search alone is not sent to DeepSeek.
- The OAuth app does not get your email or password.

Full policy: <https://ahkam.arbiter.sa/privacy/en>.

## Terms and license
- Use of the service and its data is governed by the [Ahkam knowledge service terms](https://ahkam.arbiter.sa/developers/terms/en) (Arabic text prevails: [/developers/terms](https://ahkam.arbiter.sa/developers/terms)) — including no bulk copying, no parallel database, and attribution to the source.
- The [MIT license](LICENSE) in this repository covers **only the documentation and examples here**. It grants no rights to the Ahkam service, its rulings or its data.

## Links and support
- Developer guide: [English](https://ahkam.arbiter.sa/developers/en) · [العربية](https://ahkam.arbiter.sa/developers) · [REST API](https://ahkam.arbiter.sa/developers/rest)
- Terms: [English](https://ahkam.arbiter.sa/developers/terms/en) · [العربية](https://ahkam.arbiter.sa/developers/terms)
- Privacy: [English](https://ahkam.arbiter.sa/privacy/en) · [العربية](https://ahkam.arbiter.sa/privacy)
- Support: **mamualmutairi@gmail.com** — include the `requestId` and your consumer ID; never send facts or keys. Report an error in a ruling with the `report_issue` tool or by the same email.
- Operated by [Arbiter](https://www.arbiter.sa), Madinah, Saudi Arabia.

## For maintainers: publishing to the MCP Registry
[`.github/workflows/publish-registry.yml`](.github/workflows/publish-registry.yml) publishes `server.json` to the official registry when a tag `v*` is pushed (e.g. `v1.1.1`, after bumping `version` in `server.json`). It authenticates with DNS for `arbiter.sa` (`mcp-publisher login dns`).

- **The owner sets the repository secret `MCP_PRIVATE_KEY`** (Settings → Secrets and variables → Actions): the Ed25519 private key seed, 64 hex characters, matching the `v=MCPv1` TXT record on `arbiter.sa`. The key is never committed.
- Without that secret the workflow **skips publishing** with a clear notice and does not fail.
- The tag must match `server.json` `version` (`v` + version), otherwise the job stops.

---

<div dir="rtl" lang="ar">

<h2 id="العربية">العربية</h2>

صفحة مرجعية لخادم **«أحكام»** العامّ ببروتوكول سياق النموذج (MCP). يحوي هذا المستودع التوثيق وأمثلة إعداد العملاء وبيانات السجلّ (`server.json`) وحدها، ولا شيفرة للخادم فيه.

> **ليس استشارة قانونية.** كلّ نتيجة مساعدة بحثية آلية، والمراجعة البشرية من مختصّ واجبة قبل الاعتماد عليها.

### ما «أحكام»
محرّك بحث في الأحكام القضائية السعودية المنشورة: أكثر من **110,000** حكم من وزارة العدل وديوان المظالم ولجان الفصل الضريبية والجمركية والأوراق المالية والاتصالات وغيرها. ويتيح الخادم لوكيل ذكاء اصطناعيّ أن يبحث فيها، ويقرأ الحكم، ويحصل على تحليل لوقائع **محجوبة** مقيّدٍ بالأحكام المسترجعة وحدها.

| | |
|---|---|
| عنوان الخادم | `https://mcp.ahkam.arbiter.sa/mcp` |
| النقل | Streamable HTTP بلا حالة |
| التوثيق | OAuth 2.1 بحسابك في «أحكام» (claude.ai وChatGPT وClaude Code)، أو مفتاح: `Authorization: Bearer <المستهلك>.<k1 أو k2>.<السرّ>` |
| وضع التجربة | `https://mcp.ahkam.arbiter.sa/sandbox/mcp` لمفاتيح التجربة وحدها |
| السجلّ الرسميّ | [`sa.arbiter/ahkam`](https://registry.modelcontextprotocol.io/v0/servers/sa.arbiter%2Fahkam/versions/latest) |

### الأدوات
| الأداة | تفعل | النوع |
|---|---|---|
| `search_rulings` | بحث هجين نصّيّ ودلاليّ بالعربية أو الإنجليزية | قراءة |
| `get_ruling` | حكمٌ واحد: العنوان والرابط والتاريخ والمحكمة والملخّص أو مقتطف، والنصّ الكامل للحساب المسجّل عبر OAuth | قراءة |
| `analyze_facts` | يسترجع أقرب الأحكام إلى وقائع محجوبة ويحلّلها في ضوئها وحدها | قراءة |
| `rate_result` | تقييم حكمٍ ورد في ردٍّ سابق | كتابة غير هدّامة |
| `report_issue` | إبلاغ عن خلل في بيانات حكم | كتابة غير هدّامة |

`rate_result` و`report_issue` لا تقبلان نصًّا حرًّا، ولا تعدّل أداةٌ شيئًا ولا تحذفه.

| العضوية | الأدوات | الحدود لكلّ عضو |
|---|---|---|
| **المجّانية** | `search_rulings` و`get_ruling` بالنصّ الكامل | البحث 2 في الثانية و2,000 في الشهر، والنصّ الكامل 30 حكمًا مختلفًا في اليوم |
| **المدفوعة** | الأدوات الخمس | البحث 5 في الثانية و20,000 في الشهر، والتحليل 5 في الدقيقة و300 في الشهر، والنصّ الكامل 200 حكم في اليوم |

ولمفاتيح المستهلكين حدودها الافتراضية: `analyze_facts` 10 في الدقيقة و2,000 في الشهر، و`search_rulings` و`get_ruling` 5 في الثانية و50,000 في الشهر.

**الإحالة:** الرابط الوحيد لكلّ حكمٍ في الردود صفحته على `ahkam.arbiter.sa` (`url`)، وتلك الصفحة تعرض في آخرها رابط المصدر الرسميّ. ومع كلّ حكمٍ `sourceName` اسم الجهة المصدرة.

### الإضافة
- **claude.ai** (ومعه Claude Desktop والجوّال): Customize ← Connectors ← + Add ← Add custom connector، والعنوان `https://mcp.ahkam.arbiter.sa/mcp`، واترك حقلي OAuth فارغين، ثمّ Connect وادخل بحسابك في «أحكام» و«السماح بالربط».
- **ChatGPT:** الإعدادات ← Apps & Connectors ← فعّل Developer mode ← Create، والعنوان نفسه والتوثيق OAuth.
- **Claude Code:** `claude mcp add --transport http ahkam https://mcp.ahkam.arbiter.sa/mcp` ثمّ `/mcp` ← ahkam ← Authenticate، أو بمفتاح في الترويسة `Authorization` من متغيّر بيئة.
- **Cursor** و**Claude Desktop** (عبر `mcp-remote`) بمفتاح: انظر مجلّد [`examples/`](examples/).
- إلغاء الربط من «حسابي» ← «التطبيقات المتّصلة»، فوريًّا.
- المفاتيح تُطلب من [صفحة المطوّرين](https://ahkam.arbiter.sa/developers#request) وتُصدَر بعد المراجعة، ولا تُرفع إلى مستودع أبدًا.

### الخصوصية بإيجاز
لا تُخزَّن الوقائع ولا نصّ الاستعلام. يُسجَّل لكلّ طلب استهلاكٌ **بلا محتوى** ويُحذف بعد **30 يومًا**. والتحليل يُعالَج لدى **DeepSeek في الصين**، ومنطقته معلنة في كلّ ردّ تحليل (`model.region`). التفصيل في [سياسة الخصوصية](https://ahkam.arbiter.sa/privacy).

### الشروط والترخيص
استعمال الخدمة وبياناتها خاضعٌ [لشروط خدمة المعرفة في «أحكام»](https://ahkam.arbiter.sa/developers/terms) لا لترخيص MIT. وترخيص [MIT](LICENSE) هنا يشمل التوثيق والأمثلة في هذا المستودع وحدها.

### الدعم
**mamualmutairi@gmail.com** — أرفق `requestId` ومعرّف المستهلك، ولا ترسل الوقائع ولا المفتاح.

### للمشرفين
إجراء [`publish-registry.yml`](.github/workflows/publish-registry.yml) ينشر `server.json` في السجلّ الرسميّ عند وسمٍ `v*` يطابق `version`. **يضبط المالك السرّ `MCP_PRIVATE_KEY` في إعدادات المستودع** (بذرة مفتاح Ed25519 الخاصّ، 64 خانة ست-عشرية، المطابقة لسجلّ TXT على `arbiter.sa`). وإن غاب السرّ تخطّى الإجراء النشر بتنبيه صريح.

</div>
