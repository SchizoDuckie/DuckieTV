<title>Changelog</title>
<?php

$changelog = file_get_contents('README.md');
$changes = explode("Changelog:", $changelog)[1];

$changes = explode("\n", $changes);

$lastchange = $changes[2];
die($lastchange);