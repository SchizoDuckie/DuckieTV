cd /var/www/deploy/cordova
git init
git remote add origin git@github.com:SchizoDuckie/DuckieTV-Cordova.git
git add .
git commit -m "Cordova deployment."
git push --force origin master