## 1. Setup dan Persiapan

- [x] 1.1 Install Gemini SDK: `bun add @google/generative-ai`
- [x] 1.2 Extract PDF text ke `worker/knowledge-base.ts`
- [x] 1.3 Add GEMINI_API_KEY ke wrangler.jsonc (template only, actual key from user)
- [x] 1.4 Update .gitignore untuk exclude API keys

## 2. Backend Implementation

- [x] 2.1 Buat endpoint `/api/ai/chat` di `worker/user-routes.ts`
- [x] 2.2 Implement Gemini API client initialization
- [x] 2.3 Implement request/response validation
- [x] 2.4 Implement conversation context management (last 10 messages)
- [x] 2.5 Implement error handling (400, 401, 429, 500, 504)
- [x] 2.6 Implement basic rate limiting (100 requests/day)
- [x] 2.7 Add logging untuk monitoring dan debugging

## 3. Frontend UI Components

- [x] 3.1 Buat `AIFabButton.tsx` - Floating Action Button
- [x] 3.2 Buat `AIChatModal.tsx` - Modal dialog container
- [x] 3.3 Buat `ChatMessageList.tsx` - Scrollable message list
- [x] 3.4 Buat `ChatInput.tsx` - Input form dengan send button
- [x] 3.5 Implement loading state indicator
- [x] 3.6 Implement hover effects dan tooltips
- [x] 3.7 Add markdown rendering untuk AI responses

## 4. Chat Logic Integration

- [x] 4.1 Implement chat state management (React state)
- [x] 4.2 Implement API call ke `/api/ai/chat`
- [x] 4.3 Implement conversation history tracking
- [x] 4.4 Implement auto-scroll ke latest message
- [x] 4.5 Implement disable input saat loading

## 5. LocalStorage Integration

- [x] 5.1 Implement save chat history ke LocalStorage
- [x] 5.2 Implement load chat history dari LocalStorage
- [x] 5.3 Implement auto-save behavior (debounced)
- [x] 5.4 Implement clear chat history feature
- [x] 5.5 Implement session persistence across refresh

## 6. Dashboard Integration

- [x] 6.1 Add AIFabButton ke Dashboard component
- [x] 6.2 Position FAB di bottom-right corner
- [x] 6.3 Test responsive behavior (mobile vs desktop)
- [x] 6.4 Test z-index layering (FAB above other content)

## 7. Testing dan Verification

- [x] 7.1 Test chat flow: user send → API → AI response → display
- [x] 7.2 Test error scenarios (invalid key, network error, timeout)
- [x] 7.3 Test rate limiting functionality
- [x] 7.4 Test LocalStorage persistence (refresh, navigation)
- [x] 7.5 Test conversation context (follow-up questions)
- [x] 7.6 Test UI responsiveness di berbagai screen sizes
- [x] 7.7 Build verification - pastikan tidak ada compile errors

## 8. Documentation

- [x] 8.1 Update README.md dengan setup instructions untuk GEMINI_API_KEY
- [x] 8.2 Document cara mendapatkan Gemini API key
- [x] 8.3 Add usage examples dan best practices
- [x] 8.4 Document troubleshooting guide untuk common issues
