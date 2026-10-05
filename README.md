# HPMS Portal (Phase 1)

## Setup

1. Copy `.env.example` to `.env` in the root (for reference, though backend uses its own and frontend uses `.env.local` or similar, you can split them).

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
