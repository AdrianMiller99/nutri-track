import { execSync } from 'child_process'
import { existsSync, writeFileSync } from 'fs'
import { join } from 'path'

const distDir = 'dist'

try {
  if (!existsSync(distDir)) {
    console.error('❌ dist folder not found. Run "npm run build" first.')
    process.exit(1)
  }

  console.log('📦 Deploying to GitHub Pages...')

  execSync(`git init`, { cwd: distDir })
  execSync(`git add -A`, { cwd: distDir })
  execSync(`git commit -m "deploy"`, { cwd: distDir })
  execSync(`git push -f git@github.com:AdrianMiller99/nutri-track.git master:gh-pages`, { cwd: distDir })

  console.log('✅ Successfully deployed to GitHub Pages!')
  console.log('🌐 Your site will be available at: https://adrianmiller99.github.io/nutri-track/')
} catch (error) {
  console.error('❌ Deployment failed:', error.message)
  process.exit(1)
}

