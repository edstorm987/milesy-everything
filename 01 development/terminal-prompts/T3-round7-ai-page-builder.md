/loop

# T3 — Round 7: AI page builder (`@aqua/plugin-ai-builder`)

R6 wired the editor to save into per-client repos (`2db45c0`).
R7 ships the **AI page builder** — eds requirements explicitly lists
this as a v1-future, and now's the time. Operator types a description
("a hero with our brand colours, a 3-column feature grid, a CTA"),
Claude turns it into a `BlockTree[]` using the 58-block library + 18
cross-plugin block ids you already registered.

## Working environment

- **Repo**: https://github.com/edsworld27/ker-v3
- **Local**: `~/Desktop/ker-v3/`
- **Branch**: `main`. `git pull --rebase --autostash && git push` after each commit.

## Messaging

- **Outbox**: `01 development/messages/terminal-3/to-orchestrator.md`
- **Inbox**: `01 development/messages/terminal-3/from-orchestrator.md`

## Mandatory pre-read

1. `01 development/CLAUDE.md` (Mode A)
2. Your R3-R6 chapters (`04-plugin-website-editor-round{2,3,5,6}.md`)
3. `01 development/eds requirments.md` — "AI page builder" line under Future
4. `01 development/context/prior research/04-architecture-extension-per-client-portals.md`
5. **Important**: read the Anthropic API docs surface — use the
   `claude-haiku-4-5-20251001` model id for cost; fall back to Sonnet
   4.6 (`claude-sonnet-4-6`) for harder generations. Prompt caching
   enabled for the system prompt + block-library tool spec.
6. Block registry source: `plugins/website-editor/src/components/blockRegistry.ts`

## Scope — three goals

### Goal A: `@aqua/plugin-ai-builder` plugin

Standalone plugin at `04 the final portal/plugins/ai-builder/`.
`scopePolicy: "either"` (used by both shared editor + per-client
portals), `requires: ["website-editor"]`. Mirror your most recent
plugin shape.

Manifest: 2-3 navItems (Generate · History · Settings), 4-5 admin
pages, ~6 API routes, 0 storefront blocks.

Domain: `Generation { id, prompt, blockTree, modelId, costCents, createdBy, status }`.

### Goal B: Generation pipeline

`POST /api/portal/ai-builder/generate` body `{ prompt, contextHints? }`:
1. Build a system prompt that lists every block type from
   `BLOCK_REGISTRY` + the 18 cross-plugin ids, with their fields
   schema and category.
2. Call Anthropic API with prompt caching enabled on the system
   prompt (it's static + huge — cache hit rate matters).
3. Parse the assistant's response (expects JSON-mode `BlockTree[]`).
4. Validate against block schema; reject invalid blocks with retry.
5. Persist as Generation record + return blockTree.
6. Editor's "Insert" button drops the tree into the active page.

API key comes from per-install config (`install.config.anthropicApiKey`)
— mirror T2's per-install Stripe pattern. NOT env.

### Goal C: GenerateModal + EditorPage integration

In the editor's topbar, add a "✨ Generate" button (next to Save).
Opens a modal where the operator types a prompt. Modal calls Goal B's
endpoint, shows a streaming preview (use Claude streaming SSE), then
inserts the generated tree at the current selection.

## NOT in scope

- Don't rewrite the block registry — read-only consumer.
- Don't build prompt-engineering tools beyond the modal — operator
  prompts go straight to Claude.
- Don't add image-generation (Felicia might want this — future round).
- Don't touch other plugin source.

## Loop discipline

Standard. `<<autonomous-loop-dynamic>>`.

## When done

1. tsc clean inside `plugins/ai-builder/`.
2. Smoke (`src/__smoke__/ai-builder.test.ts`) — at least mock-LLM cases:
   - Generate with mocked API → BlockTree validated + persisted.
   - Invalid block rejected + retry triggered.
   - Caching: identical prompt → cache-hit metric increments.
3. Chapter `04-plugin-ai-builder.md`.
4. MASTER row.
5. tasks.md row done.
6. DONE + COMMIT.
