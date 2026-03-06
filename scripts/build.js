const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Use script location for dist; use cwd for source files so "npm run build" from repo root finds images
const scriptRoot = path.resolve(__dirname, '..')
const cwd = process.cwd()
const root = fs.existsSync(path.join(cwd, 'package.json')) && fs.existsSync(path.join(cwd, 'scripts', 'build.js'))
  ? cwd
  : scriptRoot
const dist = path.join(scriptRoot, 'dist')
const waterAdvisorDir = path.join(scriptRoot, 'water-advisor')
const expensesDir = path.join(scriptRoot, 'expenses')

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

// Copy images: explicit list so they always end up in dist (root = directory of this script's parent)
const imageAssets = [
  'soyabean.avif',
  'wheat.jpg',
  'tomato.jpg',
  'potato.jpg',
  'onion.jpg',
  'cotton.avif',
  'sugar cane.avif',
  'tractoronfield.jpg',
]
for (const name of imageAssets) {
  const src = path.join(root, name)
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(dist, name))
    if (name.includes(' ')) {
      fs.copyFileSync(src, path.join(dist, name.replace(/\s+/g, '-')))
    }
  }
}

// Copy any other root-level images and non-app directories
const rootFiles = fs.readdirSync(root, { withFileTypes: true })
for (const e of rootFiles) {
  if (e.isDirectory() && e.name !== 'water-advisor' && e.name !== 'expenses' && e.name !== 'node_modules' && e.name !== 'dist' && e.name !== 'scripts' && e.name !== '.git') {
    mainSiteCopy(e.name)
  } else if (e.isFile() && /\.(jpg|jpeg|png|gif|avif|webp|ico|svg)$/i.test(e.name)) {
    const dest = path.join(dist, e.name)
    if (!fs.existsSync(dest)) fs.copyFileSync(path.join(root, e.name), dest)
    if (e.name.includes(' ')) {
      const safeName = e.name.replace(/\s+/g, '-')
      if (!fs.existsSync(path.join(dist, safeName))) {
        fs.copyFileSync(path.join(root, e.name), path.join(dist, safeName))
      }
    }
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
