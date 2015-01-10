<?php
set_time_limit(0);

if(array_search($_SERVER['REMOTE_ADDR'], array('::1', '127.0.0.1')) === false) {
    header('HTTP/1.0 403 Forbidden');
    die('kthxbye');
}

$cache = dirname(__FILE__).'/tests/fixtures/'.sha1($_GET['url']).'.json'; 
if(file_exists($cache)) {
    $out = json_decode(file_get_contents($cache),true);
    foreach($out['headers'] as $key=>$val) {
        header("{$key}: {$val}");
    }
    die($out['content']);
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, urldecode($_GET['url']));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt ($ch, CURLOPT_CAINFO, dirname(__FILE__)."/tests/cacert.pem");
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt($ch, CURLOPT_HTTPHEADER, apache_request_headers());
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_0);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT ,0); 
curl_setopt($ch, CURLOPT_TIMEOUT ,0); 

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

/* parse response */
list($headers, $body) = explode("\r\n\r\n", $res, 2);

$headers = explode("\r\n", $headers);
$hs = array();

foreach($headers as $header) {
    if(false !== strpos($header, ':')) {
        list($h, $v) = explode(':', $header);
        $hs[$h] = $v;
    } else {
        $header1  = $header;
    }
}

/* set headers */
list($proto, $code, $text) = explode(' ', $header1);
header($_SERVER['SERVER_PROTOCOL'] . ' ' . $code . ' ' . $text);


foreach($hs as $hname=> $v) {
    if($hname === 'Set-Cookie') {
        header($hname.": " . $v, false);
    } else {
        header($hname.": " . $v);
    }
}
 
file_put_contents(dirname(__FILE__).'/tests/fixtures/'.sha1($_GET['url']).'.json', json_encode(array(
    'url' => urldecode($_GET['url']),
    'headers' => apache_request_headers(),
    'content' => $body
),JSON_PRETTY_PRINT));

die($body);