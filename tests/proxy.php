<?php

/**
 * A transparent caching proxy to work around trakt.tv's slow and erroring responses 
 * Caches trakt.tv reponses that are used for testing and serves them locally from then on.
 * Requires PHP_CURL to be enabled.
 *
 * Only works from allowed hosts, but be warned: Proxies *everything* you ask it to!
 */

set_time_limit(0);

// whitelist
if(array_search($_SERVER['REMOTE_ADDR'], array('::1', '127.0.0.1')) === false) {
    header('HTTP/1.0 403 Forbidden');
    die('kthxbye');
}

// cache hit?
$cache = dirname(__FILE__).'/fixtures/'.sha1($_GET['url']).'.json'; 
if(file_exists($cache)) {
    // if so, decode and serve headers and content.
    $out = json_decode(file_get_contents($cache),true);
    foreach($out['headers'] as $key=>$val) {
        header("{$key}: {$val}");
    }
    die($out['content']);
}

// otherwise, fetch fresh.
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, urldecode($_GET['url']));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
// curl certificates checked in for ease.
curl_setopt($ch, CURLOPT_CAINFO, dirname(__FILE__)."/cacert.pem");
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt($ch, CURLOPT_HTTPHEADER, apache_request_headers());
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_0);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT ,0); 
curl_setopt($ch, CURLOPT_TIMEOUT ,0); 

// should also work for POST request.
if( sizeof($_POST) > 0 ) { 
    curl_setopt($ch, CURLOPT_POSTFIELDS, $_POST); 
}

$res = curl_exec($ch);
$err = curl_error($ch);
curl_close($ch);

if($err != '') {
    header('HTTP 1.1/500 Internal Server Error');
    die($err);
}

// parse response body and headers.
list($headers, $body) = explode("\r\n\r\n", $res, 2);

$headers = explode("\r\n", $headers);
$hs = array();

foreach($headers as $header) {
    if(strpos($header, ':') !== false) {
        list($h, $v) = explode(':', $header);
        $hs[$h] = trim($v);
    } else {
        $header1  = $header;
    }
}


// spew out headers
list($proto, $code, $text) = explode(' ', $header1);
header($_SERVER['SERVER_PROTOCOL'] . ' ' . $code . ' ' . $text);

foreach($hs as $hname=> $v) {
    if($hname === 'Set-Cookie') {
        header($hname.": " . $v, false);
    } else {
        header($hname.": " . $v);
    }
}
 
// cache good responses.
$body = trim($body);
if(strlen($body) > 0) {
    file_put_contents(dirname(__FILE__).'/fixtures/'.sha1($_GET['url']).'.json', json_encode(array(
        'url' => urldecode($_GET['url']),
        'headers' => $hs,
        'content' => $body
    ), JSON_PRETTY_PRINT));
}

// serve proxied response
die($body);