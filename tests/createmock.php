<?php


$url = 'https://api-v2launch.trakt.tv/shows/doctor-who-2005/seasons/%d/episodes?extended=full,images';

//$url = 'https://api-v2launch.trakt.tv/search?type=show&extended=full,images&query=doctor%20who';

for($i=0; $i<10;$i++) {

$localurl = sprintf($url, $i);
$staticcontent = file_get_contents("./fixtures/dwseason{$i}.json");

file_put_contents('./fixtures/'.sha1($localurl).'.json', json_encode(array( 
	'url' => $localurl,
	'headers' => array(
        "Server" => "cloudflare-nginx",
        "Content-Type" => "application/json; charset=utf-8",
        "Connection" => "close",
        "Cache-Control" => "public, max-age=86400",
        "Status"=> "200 OK",
        "Vary" => "Accept-Encoding",
        "X-Content-Type-Options" => "nosniff",
        "X-Frame-Options" => "SAMEORIGIN",
        "X-Powered-By" => "Phusion Passenger 4.0.57",
        "X-XSS-Protection" => "1; mode=block",
        "CF-Cache-Status" => "HIT"
    ),
	'content' => $staticcontent
	), JSON_PRETTY_PRINT));
}


die("Saved.");

