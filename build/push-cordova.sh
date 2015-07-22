cd /var/www/deploy/cordova
rm ./.git -rf
git init
git remote add origin git@github.com:SchizoDuckie/DuckieTV-Cordova.git
git remote add duckietv git@github.com:DuckieTV/DuckieTV.git
git add .
git commit -m "Cordova deployment."
echo "pushing to SchizoDuckie/DuckieTV-Cordova:master"
git push --force origin master
echo "pushing to DuckieTV/DuckieTV:gh-pages"
git push --force duckietv master:gh-pages
