# Code Tutor

**Code Tutor** is an AI-powered coding practice platform designed to help students improve their programming and problem-solving skills through guided practice rather than simply providing complete solutions.

The platform combines an interactive coding environment with AI-based assistance, progressive hints, code evaluation, personalized recommendations, and performance tracking to provide a structured learning experience.

---

## Overview

Traditional coding platforms mainly tell users whether their solution is **correct or incorrect**, while general-purpose AI assistants may directly provide the complete solution.

**Code Tutor** bridges this gap by acting as an intelligent coding tutor.

Instead of immediately revealing the answer, it helps learners understand the problem, identify mistakes, receive progressive hints, improve their code, and strengthen weak concepts.

---

## Features

* **Coding Problems**
  Practice programming problems covering different concepts and difficulty levels.

* **In-Browser Code Editor**
  Write and edit code directly inside the application using an interactive coding environment.

* **Code Execution**
  Run programs and test solutions against predefined test cases.

* **Code Submission and Evaluation**
  Submit solutions and receive structured feedback based on correctness and test results.

* **Progressive AI Hints**
  Receive hints gradually instead of immediately getting the complete solution.

* **AI Code Review**
  Analyze submitted code and provide useful feedback on mistakes, logic, and possible improvements.

* **Personalized Problem Recommendations**
  Suggest coding problems based on the learner's performance and weak areas.

* **Performance Analytics**
  Track solved problems, attempts, success rate, and overall learning progress.

* **Learner Profile Analysis**
  Identify strengths and weaknesses based on previous coding activity.

* **Personalized Learning Roadmap**
  Recommend concepts and problems that the learner should practice next.

* **Leaderboard**
  Compare progress and performance with other learners.

* **AI Supervisor**
  Coordinates different AI actions and determines the most appropriate assistance based on the learner's current activity.

---

## System Architecture

The basic workflow of Code Tutor is:

```text
                    ┌───────────────────┐
                    │       User        │
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │     Frontend      │
                    │ React + TypeScript│
                    └─────────┬─────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │    Backend API    │
                    │ Node.js + Express │
                    └───────┬───┬───────┘
                            │   │
                ┌───────────┘   └────────────┐
                ▼                            ▼
       ┌─────────────────┐          ┌─────────────────┐
       │   PostgreSQL    │          │    AI Layer     │
       │    Database     │          │ Supervisor/LLM  │
       └─────────────────┘          └────────┬────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │ AI Assistance   │
                                   │ Hints / Review  │
                                   │ Recommendations │
                                   └─────────────────┘
```

For code execution, submitted programs can be executed inside an isolated environment to improve security and prevent user code from directly interacting with the main application server.

---

## Tech Stack

### Frontend

* React
* TypeScript
* Vite
* Tailwind CSS
* Monaco Editor
* shadcn/ui

### Backend

* Node.js
* Express.js
* TypeScript
* REST APIs

### AI

* Large Language Models (LLMs)
* LangChain
* LangGraph
* AI Supervisor workflow

### Database

* PostgreSQL
* Prisma ORM

### Code Execution

* Docker-based isolated execution environment

### Deployment

* Vercel — Frontend
* Cloud-hosted backend
* PostgreSQL database service

---

## AI Workflow

The AI layer of Code Tutor provides contextual assistance depending on what the learner is doing.

```text
User Activity
     │
     ▼
AI Supervisor
     │
     ├── Problem Request
     │       └── Recommend Problem
     │
     ├── Hint Request
     │       └── Generate Progressive Hint
     │
     ├── Code Submission
     │       └── Review and Evaluate Code
     │
     ├── Repeated Failed Attempts
     │       └── Provide Additional Guidance
     │
     └── Profile Update
             └── Analyze Skills and Weak Areas
```

This approach allows the platform to provide different forms of assistance without giving the learner unnecessary information.

---

## Project Structure

```text
code-tutor/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── features/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   │
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── ai/
│   │   ├── middleware/
│   │   └── utils/
│   │
│   ├── prisma/
│   └── package.json
│
├── docker/
│
├── docs/
│
├── README.md
└── .gitignore
```

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/code-tutor.git
cd code-tutor
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

or, if using pnpm:

```bash
pnpm install
```

### 3. Install Backend Dependencies

```bash
cd ../backend
npm install
```

or:

```bash
pnpm install
```

---

## Environment Variables

Create a `.env` file inside the backend directory.

Example:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_jwt_secret
AI_API_KEY=your_ai_api_key
PORT=5000
```

For the frontend:

```env
VITE_API_BASE_URL=http://localhost:5000
```

> Never commit API keys, database credentials, or other sensitive information to GitHub.

---

## Database Setup

If Prisma is being used:

```bash
npx prisma generate
```

Run database migrations:

```bash
npx prisma migrate dev
```

Optional database viewer:

```bash
npx prisma studio
```

---

## Running the Application

### Start Backend

```bash
cd backend
npm run dev
```

### Start Frontend

Open another terminal:

```bash
cd frontend
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

The backend may run at:

```text
http://localhost:5000
```

---

## Typical User Flow

```text
Sign Up / Login
       │
       ▼
Dashboard
       │
       ▼
Select Coding Problem
       │
       ▼
Write Code
       │
       ├───────────────┐
       │               │
       ▼               ▼
    Run Code       Request Hint
       │               │
       ▼               ▼
Check Output       AI Guidance
       │               │
       └───────┬───────┘
               ▼
          Submit Code
               │
               ▼
          AI Evaluation
               │
               ▼
        Update Progress
               │
               ▼
  Recommend Next Problem
```

---

## Objective

The objective of **Code Tutor** is not to replace the learner's problem-solving process.

Instead, the system aims to:

* Encourage independent problem solving
* Provide guidance when learners are stuck
* Identify recurring weaknesses
* Give meaningful feedback
* Personalize future practice
* Help learners progressively improve their programming skills

---

## Secure Code Execution

Running user-submitted code directly on the main application server can introduce security risks.

Code Tutor can therefore use isolated execution environments where:

1. User code is received by the backend.
2. The required programming environment is selected.
3. Code is executed inside an isolated container.
4. Execution time and resources are restricted.
5. Output and errors are captured.
6. Results are returned to the application.

```text
User Code
    │
    ▼
Backend
    │
    ▼
Isolated Execution Environment
    │
    ├── Compile
    ├── Execute
    ├── Apply Limits
    └── Capture Output
    │
    ▼
Execution Result
    │
    ▼
Frontend
```

---

## Future Enhancements

Possible future improvements include:

* Multi-turn AI tutoring sessions
* Adaptive problem difficulty
* AI-generated practice problems
* Detailed skill graphs
* Advanced plagiarism detection
* Real-time collaborative coding
* Contest mode
* Gamification and achievements
* Voice-based AI tutoring
* More programming languages
* Advanced execution analytics
* Personalized study plans

---

## Screenshots

Screenshots of the application can be added here.

```text
docs/screenshots/
├── landing-page.png
├── dashboard.png
├── code-editor.png
├── ai-hint.png
└── progress-dashboard.png
```

Example:

```markdown
![Code Tutor Dashboard](docs/screenshots/dashboard.png)
```

---

## Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a new branch.

```bash
git checkout -b feature/your-feature
```

3. Make your changes.
4. Commit the changes.

```bash
git commit -m "Add new feature"
```

5. Push the branch.

```bash
git push origin feature/your-feature
```

6. Open a Pull Request.

---

## License

This project is intended for educational and development purposes.

A suitable open-source license such as the **MIT License** can be added if the project is made publicly available.

---

## Code Tutor

**Learn. Code. Improve. Repeat.**

Code Tutor aims to transform coding practice from simple correct/incorrect evaluation into an interactive and personalized learning experience powered by AI.
