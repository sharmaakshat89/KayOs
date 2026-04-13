# Deployment Checklist

## Environment Variables

### Server (.env)
```
PORT=5000
MONGO_URI=your_mongodb_uri
OPENROUTER_API_KEY=your_openrouter_key
```
- NEVER commit .env to git
- Keep secrets on server side only

### Client (.env)
```
VITE_API_URL=https://your-backend-url.onrender.com
```
- Only set for production deployment
- Leave empty for local development (uses proxy)

## CORS Configuration
- Server already configured with `origin: '*'`
- Works for all deployment platforms

## Health Check
- GET `/health` returns `{ status: 'OK', timestamp: ... }`
- Use for Render cold start prevention

## Production Checklist

### Render
- [ ] Set environment variables in Render dashboard
- [ ] Add health check: GET `/health`
- [ ] Build command: `npm install && npm start`
- [ ] Start command: `npm start`

### Vercel
- [ ] Set VITE_API_URL in Vercel env vars
- [ ] API will route through configured URL

## Testing Checklist
- [ ] Start debate → verify agents load
- [ ] Run 5+ rounds → verify context trimming works
- [ ] Interrupt multiple times → verify 300 char limit
- [ ] Test invalid inputs → verify error handling
- [ ] Reload page → verify session persistence
- [ ] Test connection → verify health check works
