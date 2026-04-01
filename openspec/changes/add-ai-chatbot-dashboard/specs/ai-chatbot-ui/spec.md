## ADDED Requirements

### Requirement: Floating Action Button (FAB)

Sistem SHALL menampilkan floating action button (FAB) di dashboard dengan ikon chatbot (🤖 atau icon AI).

**Position**: Bottom-right corner dengan spacing yang adequate dari edge dashboard.

**Behavior:**
- Hover effect: Scale up (1.1x) + tooltip "Tanya AI ICOFR"
- Click: Open chat modal
- Always visible di dashboard (tidak scroll away)

#### Scenario: FAB ditampilkan di dashboard
- **WHEN** user membuka dashboard
- **THEN** sistem menampilkan floating button di bottom-right corner

#### Scenario: Hover effect
- **WHEN** user hover mouse di atas FAB
- **THEN** button scale up 1.1x dan tooltip muncul "Tanya AI ICOFR"

#### Scenario: Click membuka modal
- **WHEN** user klik FAB
- **THEN** sistem membuka chat modal dialog

### Requirement: Chat Modal Dialog

Sistem SHALL menampilkan modal dialog dengan chat interface ketika FAB diklik.

**Components:**
- Header: "Asisten AI ICOFR" + close button (X)
- Message list: Scrollable area untuk conversation
- Input area: Text input + send button

**Behavior:**
- Modal dapat ditutup dengan klik X atau klik outside modal
- Modal responsive untuk mobile dan desktop
- Auto-focus ke input field saat modal terbuka

#### Scenario: Modal terbuka
- **WHEN** user klik FAB
- **THEN** sistem menampilkan modal dialog dengan chat interface

#### Scenario: Modal ditutup
- **WHEN** user klik close button (X) atau klik outside modal
- **THEN** sistem menutup modal

### Requirement: Chat Message Display

Sistem SHALL menampilkan chat messages dengan visual differentiation antara user dan AI.

**User messages:**
- Align right
- Background color: primary/blue
- Text color: white

**AI messages:**
- Align left
- Background color: muted/gray
- Text color: foreground
- Support markdown rendering (bold, lists, code blocks)

#### Scenario: User message ditampilkan
- **WHEN** user mengirim pesan
- **THEN** sistem menampilkan message di sebelah kanan dengan background primary

#### Scenario: AI response ditampilkan
- **WHEN** AI mengirim response
- **THEN** sistem menampilkan message di sebelah kiri dengan background muted

### Requirement: Chat Input Form

Sistem SHALL menampilkan input form untuk user mengetik pertanyaan.

**Components:**
- Text input field dengan placeholder "Tanyakan tentang ICOFR..."
- Send button (icon arrow atau text "Kirim")
- Enter key untuk send message
- Disable send button saat loading

#### Scenario: User mengetik pesan
- **WHEN** user mengetik di input field
- **THEN** sistem menampilkan text yang diketik

#### Scenario: Send dengan Enter key
- **WHEN** user tekan Enter setelah mengetik pesan
- **THEN** sistem mengirim pesan (sama seperti klik send button)

#### Scenario: Send button disabled saat loading
- **WHEN** AI sedang memproses response
- **THEN** send button disabled dan user tidak bisa kirim pesan baru

### Requirement: Loading State

Sistem SHALL menampilkan loading indicator saat menunggu response dari AI.

**Loading indicator:**
- Spinner atau typing animation di chat input area
- Disable input field saat loading
- User tidak bisa spam multiple requests

#### Scenario: Loading ditampilkan
- **WHEN** user mengirim pesan dan menunggu response
- **THEN** sistem menampilkan loading indicator dan disable input

#### Scenario: Loading selesai
- **WHEN** AI response diterima
- **THEN** sistem menyembunyikan loading indicator dan enable input
