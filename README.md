# React + Vite

### Setup .env
- generate your own GEMINI_API_KEY and JWT_SECRET
```
DB_URI=mongodb://127.0.0.1:27017/
DB_NAME=nexusDB
SERVER_PORT=3000
JWT_SECRET=
GEMINI_API_KEY=
```

### Run

```
cd backend
npm i
npm start
```

`USE_STUB=1 npm start` could be used to disable gemini usage for demo

```
cd ../frontend
npm i
npm run dev
```
