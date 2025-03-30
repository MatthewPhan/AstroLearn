# AstroLearn 🌌

AstroLearn is a learning platform that helps users generate flashcards and quizzes from uploaded study materials (PDFs). It uses AI to generate questions and provides insights into user performance.

## Features
- Upload PDF files and generate multiple-choice questions.
- View flashcards and track performance.
- Visualize memory retention and study schedules.
- Backend powered by FastAPI and PyTorch for Q-learning-based study optimization.

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Setup Instructions](#setup-instructions)

---

## Prerequisites
Before you begin, ensure you have the following installed:
- **Node.js** (v16 or later)
- **npm** (v8 or later)
- **Python** (v3.9 or later)
- **pip** (latest version)
- **Expo CLI** (install via `npm install -g expo-cli`)
- **fastAPI_ml** (pip install -r requirements.txt)

---

## Setup Instructions

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/astrolearn.git](https://github.com/MatthewPhan/AstroLearn.git)
cd AstroLearn
npm install
npx expo start
```
On another terminal
```bash
cd Astrolearn/fastAPI_ml
python3 main.py
```

Use ngrok for local testing: replace ngrok URL in StatisticsPage.tsx
