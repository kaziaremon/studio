import { execSync } from 'child_process';

console.log('1. Building production bundle...');
execSync('npm run build', { stdio: 'inherit' });

console.log('2. Preparing gh-pages branch...');
try {
  execSync('git branch -D gh-pages-temp', { stdio: 'ignore' });
} catch (e) {}

execSync('git checkout --orphan gh-pages-temp', { stdio: 'inherit' });
execSync('git reset', { stdio: 'inherit' });
execSync('git --work-tree=dist add --all', { stdio: 'inherit' });
execSync('git --work-tree=dist commit -m "deploy: live site build on gh-pages"', { stdio: 'inherit' });

console.log('3. Pushing to GitHub gh-pages branch...');
execSync('git push origin gh-pages-temp:gh-pages --force', { stdio: 'inherit' });

console.log('4. Switching back to main branch...');
execSync('git checkout -f main', { stdio: 'inherit' });
execSync('git branch -D gh-pages-temp', { stdio: 'inherit' });

console.log('🎉 DEPLOYMENT COMPLETE! Site is live on GitHub Pages.');
