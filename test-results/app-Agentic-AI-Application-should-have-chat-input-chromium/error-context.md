# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - complementary [ref=e4]:
      - generic [ref=e5]:
        - heading "Chats" [level=2] [ref=e6]
        - button "New chat" [ref=e7]:
          - img [ref=e8]
          - text: New
      - button "New Chat Delete thread" [ref=e11]:
        - img [ref=e12]
        - generic [ref=e14]: New Chat
        - button "Delete thread" [ref=e15]:
          - img [ref=e16]
      - paragraph [ref=e20]: Agentic Hub v0.1.0
    - main [ref=e21]:
      - generic [ref=e23]:
        - img [ref=e25]
        - heading "Agentic Hub" [level=2] [ref=e28]
        - paragraph [ref=e29]: Select a conversation from the sidebar or start a new chat.
        - generic [ref=e30]:
          - img [ref=e31]
          - generic [ref=e33]: Press New to begin
  - region "Notifications alt+T"
  - generic [ref=e38] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e39]:
      - img [ref=e40]
    - generic [ref=e43]:
      - button "Open issues overlay" [ref=e44]:
        - generic [ref=e45]:
          - generic [ref=e46]: "0"
          - generic [ref=e47]: "1"
        - generic [ref=e48]: Issue
      - button "Collapse issues badge" [ref=e49]:
        - img [ref=e50]
  - alert [ref=e52]
```