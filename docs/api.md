# API Routes

All API routes are prefixed with `/api/v1` and require `Authorization: Bearer <token>` unless noted.

## Health

### `GET /health/smoke`

Smoke checks DB connectivity and migration table availability.

Response:

```json
{
  "status": "ok",
  "db": "ok",
  "migrations": 12,
  "ts": 1771250582231
}
```

## Workspace Bootstrap

### `GET /workspaces/:workspaceId/bootstrap`

Returns dashboard/sidebar boot payload for the active workspace.

Response:

```json
{
  "workspace": { "id": "w1", "name": "HypeMind" },
  "areas": [
    {
      "id": "a1",
      "title": "gym",
      "slug": "gym",
      "description": null,
      "projectsCount": 0,
      "projects": []
    }
  ],
  "pinned": [],
  "pinnedItems": [],
  "inboxCount": 1,
  "recentItems": [],
  "settings": { "prefs": {} }
}
```

## Items

### `GET /items/:id`

Returns an item with project/tags/assets metadata.

Response (example):

```json
{
  "id": "itm_abc",
  "workspaceId": "w_1",
  "projectId": null,
  "title": "nothing much how are you",
  "type": "QUICK_NOTE",
  "contentJson": { "blocks": [] },
  "url": null,
  "metadata": {
    "description": "",
    "author": "HypeMind Web",
    "source": null,
    "tags": []
  },
  "isPinned": true,
  "createdAt": "2026-02-16T13:53:42.000Z",
  "updatedAt": "2026-02-16T13:53:42.000Z"
}
```

### `POST /workspaces/:workspaceId/items`

Quick capture and item creation.

Request body:

```json
{
  "type": "QUICK_NOTE",
  "title": "Idea",
  "description": "Draft note",
  "source": "https://example.com",
  "tags": ["x"],
  "projectId": null
}
```

Response:

```json
{
  "id": "itm_abc",
  "workspaceId": "w_1",
  "type": "QUICK_NOTE"
}
```

### `PATCH /items/:id`

Updates title/content/metadata/project assignment.

Request body (partial):

```json
{
  "title": "Updated title",
  "contentJson": { "blocks": [] },
  "metadata": {
    "description": "Updated",
    "author": "HypeMind Web",
    "source": null,
    "tags": ["x"]
  },
  "projectId": null
}
```

### `PATCH /items/:id/pin`

Request:

```json
{ "isPinned": true }
```

Response:

```json
{ "success": true, "isPinned": true }
```

Creates an `InteractionEvent` with action `PIN`.

### `PATCH /items/:id/archive`

Soft-deletes an item by setting `deletedAt`.

## Inbox

### `GET /workspaces/:workspaceId/inbox?limit=25&cursor=<itemId>`

Returns paginated inbox items (`projectId = null`).

Response:

```json
{
  "items": [],
  "nextCursor": null
}
```

## Areas and Projects

### `GET /workspaces/:workspaceId/areas`
### `POST /workspaces/:workspaceId/areas`
### `GET /areas/:areaId`
### `GET /areas/:areaId/projects`
### `POST /areas/:areaId/projects`
### `GET /projects/:projectId`
### `GET /projects/:projectId/items`

`POST /workspaces/:workspaceId/areas` request:

```json
{
  "title": "Health",
  "description": "Long-term focus"
}
```

`POST /areas/:areaId/projects` request:

```json
{
  "title": "Strength block",
  "description": "Q1 training"
}
```

## User

### `GET /users/me`

Returns profile used in the dashboard footer dropdown.

Response:

```json
{
  "id": "usr_1",
  "name": "Alex",
  "email": "alex@example.com",
  "avatarUrl": null
}
```

### `GET /users/me/settings`
### `GET /users/:userId/settings`
### `POST /users/:userId/settings`

## AI Context Chat

### `POST /ai/chat`

Request:

```json
{
  "message": "Summarize this item",
  "workspaceId": "w_1",
  "itemId": "itm_abc"
}
```

Response:

```json
{
  "reply": "Context received. Assistant routing is connected."
}
```

## Error Semantics

- `401` unauthenticated
- `403` authenticated but not allowed in workspace
- `404` entity not found
- `500` server error

Error object shape:

```json
{
  "message": "..."
}
```
