cd /var/www/deploy/xem
git init
git remote add origin git@github.com:DuckieTV/xem-cache.git
git checkout gh-pages
git pull origin gh-pages
git add .
git commit -m "XEM Cache update"
echo "pushing to DuckieTV/xem-cache:gh-pages"
git push origin master:gh-pages -f
