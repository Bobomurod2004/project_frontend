# Frontend — Hisobot tizimi (oddiy)

React + Vite. AI siz, faqat CRUD va hisobotlar.

## Backendga ulash

API manzili build vaqtida `VITE_API_URL` orqali beriladi.

```bash
cp .env.example .env.production
# .env.production ni tahrirlang:
#   VITE_API_URL=https://api.example.com/api
```

> Dev rejimda bo'sh qoldiriladi — `vite.config.js` dagi proxy `/api` ni
> `127.0.0.1:8001` ga yo'naltiradi.

## Lokal ishga tushirish

```bash
npm install
npm run dev      # http://localhost:5173
```

## Production build

```bash
npm install
npm run build    # dist/ papkasi hosil bo'ladi
```

`dist/` ni nginx orqali xizmat qiling (SPA fallback kerak — qarang `nginx.conf`).

## Docker bilan

```bash
docker build -t hisobot-frontend \
  --build-arg VITE_API_URL=https://api.example.com/api .
docker run -d -p 8080:80 hisobot-frontend
```
