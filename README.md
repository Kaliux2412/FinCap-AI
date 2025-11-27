# Fincap AI 💵
A Personal Finance Dashboard with AI-powered insights

Fincap AI is a modern web application designed to help users manage their personal finances through an intuitive dashboard, transaction tracking, document uploads, and an integrated AI assistant powered by Gemini.  
The project is built with **React**, **TypeScript**, and **Vite**, and includes a simulated authentication and data layer for easy development and testing.

## ✨ Features

### 🧮 Finance Dashboard  
- View financial metrics such as income, expenses, and totals  
- Activity log of all past transactions  
- Calendar visualization for financial events  

### 💬 AI Chat Assistant (Gemini)  
- Ask financial questions  
- Receive budgeting insights  
- Understand your spending patterns  
- AI-powered responses via `geminiService.ts`

### 💵 Transaction Management  
- Add income or expense entries  
- Store basic transaction details (amount, category, date, notes)

### 📁 Document Uploads  
- Upload receipts, invoices, PDFs  
- Future-ready for document analysis via AI

### 🔐 Mock Authentication  
- Simulated login system via `mockFirebaseService.ts`  
- Allows quick prototyping without the need for Firebase setup

### 🧩 Modular Component Architecture  
The project includes reusable components such as:  
- `MetricCard`  
- `ChatInterface`  
- `TransactionForm`  
- `ActivityLog`  
- `CalendarView`  
- `LoadingOverlay`  
- `AuthScreen`

## 🛠️ Tech Stack

| Area              | Technology            |
|------------------|------------------------|
| Frontend         | React + TypeScript    |
| Build Tool       | Vite                  |
| Styling          | CSS / Custom styles   |
| AI Integration   | Google Gemini API     |
| Authentication   | Mock Firebase service |
| Data Storage     | Local JSON + mock DB  |

## 📂 Project Structure

```
fincap-ai/
│
├── App.tsx
├── index.tsx
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── data.json
├── data.ts
├── translations.ts
├── types.ts
├── metadata.json
│
├── components/
│   ├── Dashboard.tsx
│   ├── MetricCard.tsx
│   ├── ChatInterface.tsx
│   ├── TransactionForm.tsx
│   ├── ActivityLog.tsx
│   ├── CalendarView.tsx
│   ├── DocumentUpload.tsx
│   └── AuthScreen.tsx
│
└── services/
    ├── mockFirebaseService.ts
    └── geminiService.ts
```

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-user/fincap-ai.git
cd fincap-ai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables  
Create a `.env.local` file in the project root:

```
VITE_GEMINI_API_KEY=your_api_key_here
```

### 4. Start the development server
```bash
npm run dev
```

The app will be available at:  
👉 http://localhost:5173

## 🧪 Development Notes

### Mock Services  
This project uses simulated services to streamline development:

- `mockFirebaseService.ts` handles login/logout operations without requiring Firebase.
- `data.json` serves as a local data source for financial activity.

### Gemini API Integration  
`geminiService.ts` manages:
- Sending prompts to the Gemini API  
- Formatting requests  
- Returning AI responses  

## 📌 Roadmap

- [ ] Replace mock authentication with real Firebase Auth  
- [ ] Add Firestore database support  
- [ ] Implement analytics charts  
- [ ] Add OCR for uploaded documents  
- [ ] Mobile-responsive redesign  
- [ ] User profiles and multi-account support  

## 🤝 Contributions

Contributions are welcome!  
Feel free to submit issues, pull requests, or suggestions for improvement.

## 📄 License

This project is licensed under the MIT License.  
See the `LICENSE` file for more details.

## 💡 Credits

Developed by Kevin, Karla, Timoteo and Gaby as part of a finance-focused AI project presented to Google and BBVA in Agaveth0n GDL 2025.  
