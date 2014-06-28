<title>DuckieTV - Deploying</title>
<h1>DuckieTV Deployment Script</h1>

<?php
flush();
ob_end_flush();
$curDir = getcwd();

if(!is_dir('../deploy')) mkdir('../deploy');
if(!is_dir('../deploy/newtab'))	mkdir('../deploy/newtab');
if(!is_dir('../deploy/browseraction')) mkdir('../deploy/browseraction');
if(!is_dir('../deploy/opera')) mkdir('../deploy/opera');


file_put_contents('exclude.txt', "exclude.txt\r\n.git\r\nmanifest.json\r\nmanifest-app.json\r\ndeploy.php\r\ndeploytowebstoremacro.exe\r\ndeploy-both.mcr\r\ndeploy-newtab.mcr\r\ndeploy-browseraction.mcr\r\nchangelog.php");
echo "Copying to output dir.<pre style='height:150px; overflow-y:scroll'>";
system('xcopy /EXCLUDE:exclude.txt /Y /E . ..\deploy\newtab');
system('xcopy /EXCLUDE:exclude.txt /Y /E . ..\deploy\browseraction');
system('xcopy /EXCLUDE:exclude.txt /Y /E . ..\deploy\opera');

echo("</pre>");
$newTabSettings = json_decode(file_get_contents('manifest.json'),true);
$browserActionSettings = json_decode(file_get_contents('manifest-app.json'),true);
$operaSettings = json_decode(file_get_contents('manifest-opera.json'),true);
$version = trim(file_get_contents('VERSION'));
system("git tag -am \"{$version}\" \"{$version\"");
system("git push --tags");
echo ("<h2>Current version: {$version}</h2>");
$newTabSettings['version'] = $browserActionSettings['version'] = $operaSettings['version'] = $version;
file_put_contents('../deploy/newtab/manifest.json', json_encode($newTabSettings,JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
file_put_contents('../deploy/browseraction/manifest.json', json_encode($browserActionSettings,JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
file_put_contents('../deploy/opera/manifest.json', json_encode($operaSettings,JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

echo "Zipping new tab version<pre style='height:150px; overflow-y:scroll'>";
chdir($curDir.'/../deploy/newtab');
system("zip -R ../newtab-{$version}.zip *.*");
echo "</pre>Zipping browser action version<pre style='height:150px; overflow-y:scroll'>";

chdir($curDir.'/../deploy/browseraction');
system("zip -R ../browseraction-{$version}.zip *.*");
chdir($curDir.'/../deploy');
system("rm -f browseraction-latest.zip");
system("rm -f newtab-latest.zip");
system("cp browseraction-{$version}.zip browseraction-latest.zip");
system("cp newtab-{$version}.zip newtab-latest.zip");

echo "</pre>";

unlink("$curDir/exclude.txt");
echo "<h1>Done</h1>";
?>
<script type='text/javascript'>
document.querySelector('title').innerText = 'DuckieTV - Deployment built.';
</script>