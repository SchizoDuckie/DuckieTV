<?php
set_time_limit(0);
error_reporting(E_ALL);
if(array_search($_SERVER['REMOTE_ADDR'], array('::1', '127.0.0.1')) === false) {
    header('HTTP/1.0 403 Forbidden');
    die('kthxbye');
}



// if there's a cached version of this request in fixtures, serve it.
$cache = dirname(__FILE__).'/fixtures/'.sha1($_GET['url']).'.json'; 
if(file_exists($cache)) {
    $out = json_decode(file_get_contents($cache),true);
    foreach($out['headers'] as $key=>$val) {
        if($key =='Cookie') { continue; }
        header("{$key}: {$val}");
    }
    header('DuckieTV-Cache-hit: '.sha1($_GET['url']).'.json');
    die($out['content']);
}


// preparse and format headers for 

$hdrs = apache_request_headers();
unset($hdrs['Cookie']);
unset($hdrs['Referer']);
unset($hdrs['Accept-Encoding']);
$parsedUrl = parse_url(urldecode($_GET['url']));
$hdrs['Host'] = $parsedUrl['host'];

$curlHeaders = [];
foreach($hdrs as $key=>$val) {
    $curlHeaders[] = "{$key}: {$val}";
}

parse_str($parsedUrl['query'], $output);

$targetUrl = $parsedUrl['scheme'].'://'.$parsedUrl['host'].$parsedUrl['path'].'?'.http_build_query($output);
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $targetUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CAINFO, dirname(__FILE__)."/cacert.pem");
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT ,0); 
curl_setopt($ch, CURLOPT_TIMEOUT ,0); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_VERBOSE, true);


if( sizeof($_POST) > 0 ) { 
    curl_setopt($ch, CURLOPT_POSTFIELDS, $_POST); 
}

$res = curl_exec($ch);
$err = curl_error($ch);

//die(print_r($res));

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

if($err != '') {
    header('HTTP 1.1/500 Internal Server Error');
    die($err);

}

/* parse response */
$headers = substr($res, 0, $header_size);
$body = substr($res, $header_size);
$headers = explode("\r\n", $headers);
$hs = array();

foreach($headers as $header) {
    if(false !== strpos($header, ':')) {
        list($h, $v) = explode(':', $header);
        $hs[$h] = $v;
    }
}

/* forward headers to client */

foreach($hs as $hname=> $v) {
    if($hname == 'Transfer-Encoding') {
        continue;
    } elseif($hname == 'Content-Length') {
        continue;
    } elseif($hname === 'Set-Cookie') {
        header($hname.": " . $v, false);
    } else {
        header($hname.": " . $v);
    }
}

echo($body);

if($body != false && $body != "") {
// create cache
file_put_contents(dirname(__FILE__).'/fixtures/'.sha1($_GET['url']).'.json', json_encode(array(
    'url' => $_GET['url'],
    'headers' => $hs,
    'content' => $body
),JSON_PRETTY_PRINT));

}
die();