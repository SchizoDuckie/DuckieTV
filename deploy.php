<h1>SeriesGuide2 Deployment Script</h1>
<?php
$curDir = getcwd();

if(!is_dir('../deploy')) mkdir('../deploy');
if(!is_dir('../deploy/newtab'))	mkdir('../deploy/newtab');
if(!is_dir('../deploy/browseraction')) mkdir('../deploy/browseraction');


file_put_contents('exclude.txt', "exclude.txt\r\n.git\r\nmanifest.json\r\nmanifest-app.json\r\ndeploy.php");
echo "Copying to output dir.<pre style='height:150px; overflow-y:scroll'>";
system('xcopy /EXCLUDE:exclude.txt /Y /E . ..\deploy\newtab');
system('xcopy /EXCLUDE:exclude.txt /Y /E . ..\deploy\browseraction');
echo("</pre>");
$newTabSettings = json_decode(file_get_contents('manifest.json'),true);
$browserActionSettings = json_decode(file_get_contents('manifest-app.json'),true);
$version = trim(file_get_contents('VERSION'));
echo ("<h2>Current version: {$version}</h2>");
$newTabSettings['version'] = $browserActionSettings['version'] = $version;
file_put_contents('../deploy/newtab/manifest.json', json_encode($newTabSettings,JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
file_put_contents('../deploy/browseraction/manifest.json', json_encode($browserActionSettings,JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo "Zipping new tab version<pre style='height:150px; overflow-y:scroll'>";
chdir($curDir.'/../deploy/newtab');
system("zip -R ../newtab-{$version}.zip *.*");
echo "</pre>Zipping browser action version<pre style='height:150px; overflow-y:scroll'>";


chdir($curDir.'/../deploy/newtab');
system("zip -R ../browseraction-{$version}.zip *.*");
echo "</pre>";

unlink("$curDir/exclude.txt");
echo "<h1>Done</h1>";
