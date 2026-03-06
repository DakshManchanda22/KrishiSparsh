# कृषिSparsh

Main site, Water Advisor, and Expense Scanner.

## How to run

### Dev (local)

1. **Main site**  
   Open `index.html` in the browser (e.g. from file or a simple static server at repo root).

2. **Water Advisor**  
   ```bash
   cd water-advisor && npm install && npm run dev
   ```  
   Open the URL shown (e.g. http://localhost:5173). Use `/water-advisor/` when linking from the main site.

3. **Expenses**  
   ```bash
   cd expenses && npm install && npm run dev
   ```  
   For correct base path when testing as if at `/expenses/`:  
   ```bash
   cd expenses && VITE_APP_BASE=/expenses/ npm run dev
   ```  
   Open the URL shown (e.g. http://localhost:5174).

### Production build

From the **repo root**:

```bash
npm run build
```

This builds:

- Main site → `dist/` (index.html, styles.css, images)
- Water Advisor → `dist/water-advisor/`
- Expenses → `dist/expenses/`

Deploy the `dist/` folder (e.g. Vercel with output directory `dist`).

**URLs after deploy**

- Main site: `/`
- Water Advisor: `/water-advisor/`
- Expenses: `/expenses/`

Refreshing the home page scrolls to the top automatically.
