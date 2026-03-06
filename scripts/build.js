const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const root = path.resolve(__dirname, '..')
const dist = path.join(root, 'dist')
const waterAdvisorDir = path.join(root, 'water-advisor')
const expensesDir = path.join(root, 'expenses')

// Clean dist
if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true })
fs.mkdirSync(dist, { recursive: true })

// 1. Copy main site (index.html, styles.css, images, etc.)
const mainSiteFiles = ['index.html', 'styles.css']
const mainSiteCopy = (dir) => {
  const full = path.join(root, dir)
  if (!fs.existsSync(full)) return
  const entries = fs.readdirSync(full, { withFileTypes: true })
  for (const e of entries) {
    const src = path.join(full, e.name)
    const dest = path.join(dist, e.name)
    if (e.isDirectory()) {
      fs.cpSync(src, dest, { recursive: true })
    } else {
      fs.mkdirSync(path.dirname(dest), { recursive: true })
      fs.copyFileSync(src, dest)
    }
  }
}
for (const f of mainSiteFiles) {
  const src = path.join(root, f)
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(dist, f))
}
// Copy images / assets from root (exclude water-advisor and expenses apps)
const rootFiles = fs.readdirSync(root, { withFileTypes: true })
for (const e of rootFiles) {
  if (e.isDirectory() && e.name !== 'water-advisor' && e.name !== 'expenses' && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== 'scripts' && e.name !== '.git') {
    mainSiteCopy(e.name)
  } else if (e.isFile() && /\.(jpg|jpeg|png|gif|avif|webp|ico|svg)$/i.test(e.name)) {
    fs.copyFileSync(path.join(root, e.name), path.join(dist, e.name))
  }
}

// 2. Build Water Advisor React app
process.chdir(waterAdvisorDir)
execSync('npm install', { stdio: 'inherit' })
execSync('npm run build', { stdio: 'inherit', env: { ...process.env, VITE_APP_BASE: '/water-advisor/' } })
const waDist = path.join(waterAdvisorDir, 'dist')
const distWa = path.join(dist, 'water-advisor')
fs.cpSync(waDist, distWa, { recursive: true })

// 3. Build Expenses React app (standalone module at /expenses/)
if (fs.existsSync(expensesDir)) {
  process.chdir(expensesDir)
  execSync('npm install', { stdio: 'inherit' })
  execSync('npm run build', { stdio: 'inherit', env: { ...process.env, VITE_APP_BASE: '/expenses/' } })
  const expDist = path.join(expensesDir, 'dist')
  const distExp = path.join(dist, 'expenses')
  fs.cpSync(expDist, distExp, { recursive: true })
}

console.log('Build done: main site at /, Water Advisor at /water-advisor/, Expenses at /expenses/')
