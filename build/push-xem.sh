cd /var/www/deploy/xem
git init
git remote add duckietv git@github.com:DuckieTV/xem-cache.git
git checkout gh-pages
git pull origin gh-pages
git add .
git commit -m "XEM Cache update"
echo "pushing to DuckieTV/xem-cache:gh-pages"
git push duckietv master:gh-pages -f
