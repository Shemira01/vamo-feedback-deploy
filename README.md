# 🚀 Vamo Feedback Hub

A high-performance Customer Feedback Dashboard built for Vamo. This application centralizes feedback from emails, manual logs, and mobile screenshots, using AI to categorize, summarize, and generate macro-reports.

## ✨ Core Features

* **🔐 Domain-Locked Auth:** Secured with Supabase Auth, strictly limited to `@vamo.app` email domains.
* **📥 Multi-Channel Ingestion:** * **Email Webhook:** Custom API endpoint (`/api/inbound`) that parses customer emails from subject lines.
    * **Manual Entry:** Quick-log form for direct feedback.
    * **Image Uploads:** Support for screenshots with integrated OCR text extraction.
* **🧠 AI-Powered Intelligence:** * **Automated Tagging:** GPT-4o-mini categorizes feedback into specific categories (UI, Bug, Sequences, etc.).
    * **Sentiment Analysis:** Instant "Positive/Negative/Neutral" labeling.
    * **Macro Summarization:** One-click AI reports that analyze the current filtered view to find trends.
* **🔍 Advanced Filtering:** Dynamic URL-driven filters for customer email, specific tags, and custom date ranges.
* **✏️ Inline Management:** Real-time editing of tags and customer assignments for "Unassigned" feedback.

## 🛠️ Tech Stack

* **Framework:** Next.js 15 (App Router)
* **Database & Auth:** Supabase
* **AI Engine:** OpenAI (GPT-4o-mini)
* **Styling:** Tailwind CSS + Shadcn UI
* **Deployment:** Vercel

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd dashboard
pnpm install
