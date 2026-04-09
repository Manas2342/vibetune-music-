# VibeTune — Entity Relationship Diagram

This diagram matches the SQLite schema in `server/services/databaseService.ts`.

## Mermaid (render in GitHub, VS Code with Mermaid extension, or [mermaid.live](https://mermaid.live))

```mermaid
erDiagram
    users {
        text id PK
        text spotify_id UK
        text display_name
        text email
        text country
        text product
        text image_url
        text access_token
        text refresh_token
        int token_expires_at
        datetime created_at
        datetime updated_at
    }

    user_library {
        text id PK
        text user_id FK
        text spotify_id
        text name
        text type
        text data
        datetime synced_at
        boolean is_offline
        text download_path
        int file_size
    }

    listening_analytics {
        text id PK
        text user_id FK
        text track_id
        text track_name
        text artist_name
        text album_name
        datetime played_at
        int duration_ms
        int skip_after_ms
        boolean completed
    }

    user_follows {
        text id PK
        text follower_id FK
        text following_id FK
        datetime followed_at
    }

    activity_feed {
        text id PK
        text user_id FK
        text activity_type
        text track_id
        text playlist_id
        text activity_data
        datetime created_at
    }

    users ||--o{ user_library : "owns"
    users ||--o{ listening_analytics : "generates"
    users ||--o{ activity_feed : "posts"
    users ||--o{ user_follows : "follower"
    users ||--o{ user_follows : "following"
```

## Relationship summary

| From | To | Cardinality | Notes |
|------|-----|----------------|-------|
| `users` | `user_library` | 1 : N | `ON DELETE CASCADE`; unique `(user_id, spotify_id, type)` |
| `users` | `listening_analytics` | 1 : N | `ON DELETE CASCADE` |
| `users` | `activity_feed` | 1 : N | `ON DELETE CASCADE` |
| `users` | `user_follows` | N : M (via junction) | `follower_id` and `following_id` both reference `users.id`; unique pair |

## Crow’s-foot style (text)

```
users (1) ────< (N) user_library
users (1) ────< (N) listening_analytics
users (1) ────< (N) activity_feed
users (1) ────< (N) user_follows [follower_id]
users (1) ────< (N) user_follows [following_id]
```

---

**Tip:** Paste the `mermaid` block into [https://mermaid.live](https://mermaid.live) to export PNG/SVG for reports or slides.
