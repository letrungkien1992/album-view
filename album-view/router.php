<?php
declare(strict_types=1);

$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = parse_url($requestUri, PHP_URL_PATH);
$path = is_string($path) ? $path : '/';
$decodedPath = rawurldecode($path);
$decodedPath = str_replace("\0", '', $decodedPath);

// Always route app entry/login pages through index.php so auth is enforced.
$forcedPhpRoutes = [
    '/',
    '/index.php',
    '/index.html',
    '/login',
    '/login.html',
    '/resources/album-resource/album-viewer.html',
];
if (in_array($path, $forcedPhpRoutes, true)) {
    require __DIR__ . '/index.php';
    return;
}

if (substr($path, -5) === '.html') {
    require __DIR__ . '/index.php';
    return;
}

$fullPath = __DIR__ . $decodedPath;
if ($decodedPath !== '/' && is_file($fullPath)) {
    return false;
}

require __DIR__ . '/index.php';
