<?php
/**
 * A transparent and caching proxy in PHP using CURL.
 * Saves responses to a JSON file in ./fixtures/
 * 
 * Usage: 
 * proxy.php?url=https%3A%2F%2Fapi.trakt.tv%2Fsearch%3Ftype%3Dshow%26extended%3Dfull%2Cimages%26query%3Ddoctor%2520who
 *
 * Cache files are saved as a alphanumeric-versions of the urls (a-zA-Z0-9)
 * E.g.:
 * 
 * https://api.trakt.tv/shows/doctor-who-2005/seasons/2/episodes?extended=full,images
 * becomes
 * fixtures/httpsapitrakttvshowsdoctorwho2005seasons2episodesextendedfullimages.json
 * 
 * Includes the full response headers and url in the file for debugging.
 * The resulting cache files have this structure:
 * 
 * {
 *   url: 'string',
 *   headers: { 
 *      headerName: 'headerValue'
 *   },
 *   content: 'string'
 * }
 *
 * When a fixture is available for the outstanding request it will be automatically served with the correct response headers.
 *
 * Note that for ease-of-use some things are happening:
 *
 * - Content-Transfer-Encoding is stripped so that the output is text by default
 * - Chunked responses are sent at as a whole
 * - Cookies are stripped from requests and responses (change this to your needs)
 * - By default, requests to this file are only allowed from localhost.
 *
 */

set_time_limit(60); // i deal with a slow api
//error_reporting(E_ALL);

if(array_search($_SERVER['REMOTE_ADDR'], array('::1', '127.0.0.1')) === false) {
    header('HTTP/1.0 403 Forbidden');
    die('kthxbye');
}

$cache = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $_GET['url'])).'.json'; 

// if there's a cached version of this request in fixtures, serve it.
if(file_exists(dirname(__FILE__).'/fixtures/'.$cache)) {
    $out = json_decode(file_get_contents(dirname(__FILE__).'/fixtures/'.$cache),true);
    $out['headers']['Content-Length'] = strlen($out['content']);
    unset($out['headers']['Transfer-Encoding']);
    unset($out['headers']['Cookie']);
    foreach($out['headers'] as $key=>$val) {
        header("{$key}: {$val}");
    }
    header('Proxy-Cache-hit: '.$cache);
    die($out['content']);
} else {
    header('Proxy-Cache-miss: '.$cache);
}

// parse the passed url and rebuild it
//parse_str($parsedUrl['query'], $output);
//$targetUrl = $parsedUrl['scheme'].'://'.$parsedUrl['host'].$parsedUrl['path'].'?'.http_build_query($output);

$parsedUrl = parse_url(urldecode($_GET['url']));
// fetch all relevant request headers and forward them to CURL.
$hdrs = apache_request_headers();
$hdrs['Host'] = $parsedUrl['host'];
unset($hdrs['Referer']);
unset($hdrs['Accept-Encoding']);

$curlHeaders = [];
foreach($hdrs as $key=>$val) {
    $curlHeaders[] = "{$key}: {$val}";
}

// init curl (Save cacert.pem from curl.haxx.se/ca/cacert.pem and enable if you need it)
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, urldecode($_GET['url']));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_CAINFO, dirname(__FILE__)."/cacert.pem");
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_USERAGENT, $_SERVER['HTTP_USER_AGENT']);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
curl_setopt($ch, CURLOPT_HTTPHEADER, $curlHeaders);
curl_setopt($ch, CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT ,0); 
curl_setopt($ch, CURLOPT_TIMEOUT,0); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_VERBOSE, 1);
//enable for debugging
//curl_setopt($ch, CURLINFO_HEADER_OUT, true);
//$f = fopen(dirname(__FILE__).'/fixtures/request.txt', 'w');
//curl_setopt($ch, CURLOPT_STDERR, $f);
$response = curl_exec($ch);
//fputs($f, print_r(curl_getinfo($ch,CURLINFO_HEADER_OUT),true));
//fputs($f, $response);
//fclose($f);


// proxy post requests
if( sizeof($_POST) > 0 ) { 
    curl_setopt($ch, CURLOPT_POSTFIELDS, $_POST); 
}

$res = curl_exec($ch);
$err = curl_error($ch);

$header_size = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
curl_close($ch);

/* parse response */
$headers = substr($res, 0, $header_size);
$body = substr($res, $header_size);
$headers = explode("\r\n", $headers);
$responseHeaders = array();
foreach($headers as $header) {
    if(strpos($header, ':') !== false) {
        $header = explode(':', $header);
        $responseHeaders[$header[0]] = $header[1];
        if(in_array($header[0], array('Transfer-Encoding', 'Content-Length'))) { // omit headers that make chrome unhappy
            continue; 
        }
        if($header[0] == 'Set-Cookie') {
            header(implode(':', $header), false);
        } else {
            header(implode(':', $header));
        }
    }
}

echo($body);

// cache non-empty responses in fixtures folder (make sure you make it writeable)
if($body != false && $body != "") {
    file_put_contents(dirname(__FILE__).'/fixtures/'.$cache, json_encode(array(
        'url' => $_GET['url'],
        'headers' => $responseHeaders,
        'content' => $body
    ),JSON_PRETTY_PRINT));
}