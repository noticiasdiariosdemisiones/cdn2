<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

function checkUrl($url) {
    $start = microtime(true);
    
    $ch = curl_init();
    curl_setopt_array($ch, [
        CURLOPT_URL => $url,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HEADER => true,
        CURLOPT_NOBODY => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 5,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false
    ]);
    
    $response = curl_exec($ch);
    $responseTime = round((microtime(true) - $start) * 1000);
    
    if (curl_errno($ch)) {
        curl_close($ch);
        return [
            'error' => curl_error($ch),
            'responseTime' => $responseTime
        ];
    }
    
    $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
    $headers = [];
    
    foreach (explode("\r\n", substr($response, 0, $headerSize)) as $line) {
        if (strpos($line, ':') !== false) {
            list($key, $value) = explode(':', $line, 2);
            $headers[strtolower(trim($key))] = trim($value);
        }
    }
    
    curl_close($ch);
    
    return [
        'headers' => $headers,
        'responseTime' => $responseTime
    ];
}

if (!isset($_GET['url'])) {
    http_response_code(400);
    echo json_encode(['error' => 'URL parameter is required']);
    exit;
}

$url = $_GET['url'];
if (!filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid URL']);
    exit;
}

$result = checkUrl($url);
echo json_encode($result);