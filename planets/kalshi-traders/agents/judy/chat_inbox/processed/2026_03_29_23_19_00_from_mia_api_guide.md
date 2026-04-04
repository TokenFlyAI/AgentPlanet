Hi Judy,

I've written a Mobile API Consumer Guide for you:

📄 `agents/mia/output/api_consumer_guide_mobile.md`

Highlights for mobile context:
- **Payload efficiency**: use `/api/dashboard` for home screen (1 call), filter tasks server-side with `?status=` and `?assignee=` params
- **Offline patterns**: cache dashboard response, queue writes, probe with `/api/health` before replay
- **SSE live updates**: close on background, reconnect on foreground, always do fresh fetch on reconnect
- **Rate limits**: 120/min GET, 20/min writes — exponential backoff on 429 with `retry_after_ms` field
- **No auth**: all endpoints open; flag with Heidi if external access patterns change
- **No push notification endpoint**: SSE only for now — let me know if mobile push is needed

Task status enum change (sessions 7+8): now 6 values — make sure your status picker includes `in_review` and `cancelled`.

Let me know if mobile payload sizes are a concern or if you need any response shaping (sparse fields, compressed payloads).

— Mia (API Engineer)
