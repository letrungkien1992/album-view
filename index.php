<?php

declare(strict_types=1);

$rootDir = __DIR__;
$albumsDir = $rootDir . '/src/albums';
$audioDir = $rootDir . '/src/audio';
$rowDir = $rootDir . '/src/row';
$thumbsDir = $rootDir . '/src/thumbs';
$viewerFile = $rootDir . '/resources/album-resource/album-viewer.html';
$loginFile = $rootDir . '/resources/album-resource/login.html';
$userStoreFile = $rootDir . '/storage/user.json';
$albumTitlesFile = $rootDir . '/storage/album-titles.json';
$albumHiddenFile = $rootDir . '/storage/album-hidden.json';
$albumHiddenImagesFile = $rootDir . '/storage/album-hidden-images.json';
$audioOrderFile = $rootDir . '/storage/audio-order.json';
$buildLockFile = $rootDir . '/storage/build-images.lock';
$buildLogFile = $rootDir . '/storage/build-images.log';
$clientLogFile = $rootDir . '/.server.log';
$clientLogFallbackFile = $rootDir . '/storage/client-errors.log';
$authCookieName = 'album_view_tokken';
$authTtlSeconds = 3 * 24 * 60 * 60;
$authRefreshIntervalSeconds = 300;
$scriptName = isset($_SERVER['SCRIPT_NAME']) ? (string) $_SERVER['SCRIPT_NAME'] : '/index.php';
$scriptDir = str_replace('\\', '/', dirname($scriptName));
$basePath = ($scriptDir === '/' || $scriptDir === '.') ? '' : rtrim($scriptDir, '/');

if (session_status() === PHP_SESSION_NONE) {
    session_name('album_view_session');
    session_start();
}
try_restore_auth_from_tokken($userStoreFile, $authCookieName, $authTtlSeconds, $authRefreshIntervalSeconds, $basePath);
refresh_auth_from_session($userStoreFile, $authCookieName, $authTtlSeconds, $authRefreshIntervalSeconds, $basePath);

function send_status(int $status): void
{
    http_response_code($status);
}

function send_json(array $payload, int $status = 200): void
{
    send_status($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function redirect_to(string $location, int $status = 302): void
{
    send_status($status);
    header('Location: ' . $location);
    exit;
}

function with_base(string $basePath, string $path): string
{
    $base = rtrim($basePath, '/');
    $tail = '/' . ltrim($path, '/');
    return ($base === '' ? '' : $base) . $tail;
}

function send_error_text(int $status, string $message): void
{
    send_status($status);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message;
    exit;
}

function versioned_asset_path(string $assetPath, string $rootDir): string
{
    if (
        $assetPath === ''
        || preg_match('/^(?:[a-z]+:)?\/\//i', $assetPath) === 1
        || str_starts_with($assetPath, 'data:')
        || str_starts_with($assetPath, '#')
    ) {
        return $assetPath;
    }

    $pathPart = parse_url($assetPath, PHP_URL_PATH);
    if (!is_string($pathPart) || $pathPart === '') {
        return $assetPath;
    }

    $assetFile = $rootDir . '/' . ltrim($pathPart, '/');
    if (!is_file($assetFile)) {
        return $assetPath;
    }

    $version = filemtime($assetFile);
    if ($version === false) {
        return $assetPath;
    }

    $separator = str_contains($assetPath, '?') ? '&' : '?';
    return $assetPath . $separator . 'v=' . $version;
}

function render_html_with_versioned_assets(string $htmlFile, string $rootDir): string
{
    $html = @file_get_contents($htmlFile);
    if (!is_string($html)) {
        return '';
    }

    return (string) preg_replace_callback(
        '/\b(href|src)=(["\'])([^"\']+)\2/i',
        static function (array $matches) use ($rootDir): string {
            $attr = $matches[1] ?? '';
            $quote = $matches[2] ?? '"';
            $path = $matches[3] ?? '';
            return $attr . '=' . $quote . versioned_asset_path($path, $rootDir) . $quote;
        },
        $html
    );
}

function send_html_page(string $htmlFile, string $rootDir): void
{
    $html = render_html_with_versioned_assets($htmlFile, $rootDir);
    if ($html === '') {
        send_error_text(500, 'Cannot render HTML page.');
    }

    send_status(200);
    header('Content-Type: text/html; charset=utf-8');
    header('Content-Length: ' . strlen($html));
    echo $html;
    exit;
}

function parse_ini_size(string $value): int
{
    $raw = trim($value);
    if ($raw === '') {
        return 0;
    }
    $last = strtolower($raw[strlen($raw) - 1]);
    $num = (float) $raw;
    switch ($last) {
        case 'g':
            return (int) ($num * 1024 * 1024 * 1024);
        case 'm':
            return (int) ($num * 1024 * 1024);
        case 'k':
            return (int) ($num * 1024);
        default:
            return (int) $num;
    }
}

function append_client_log(string $logFile, string $message): void
{
    $line = '[' . date('Y-m-d H:i:s') . '] ' . $message . PHP_EOL;
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    if (!is_file($logFile)) {
        @touch($logFile);
        @chmod($logFile, 0664);
    }
    @file_put_contents($logFile, $line, FILE_APPEND | LOCK_EX);
}

function resolve_client_log_file(string $primary, string $fallback): string
{
    $primaryDir = dirname($primary);
    if ((!is_dir($primaryDir) && @mkdir($primaryDir, 0775, true)) || is_dir($primaryDir)) {
        if (!is_file($primary) && @touch($primary)) {
            @chmod($primary, 0664);
        }
        if (is_writable($primaryDir) && (!is_file($primary) || is_writable($primary))) {
            return $primary;
        }
    }
    return $fallback;
}

function session_username(): string
{
    $username = $_SESSION['auth_user'] ?? '';
    return is_string($username) ? $username : '';
}

function session_role(): string
{
    $role = $_SESSION['auth_role'] ?? '';
    return is_string($role) ? trim($role) : '';
}

function normalize_role(string $role): string
{
    $value = strtolower(trim($role));
    return $value !== '' ? $value : 'user';
}

function is_admin(): bool
{
    return session_role() === 'admin';
}

function is_authenticated(): bool
{
    return session_username() !== '';
}

function require_auth(string $basePath): void
{
    if (!is_authenticated()) {
        redirect_to(with_base($basePath, '/login'));
    }
}

function read_json_body(): array
{
    $raw = file_get_contents('php://input');
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    return is_array($decoded) ? $decoded : [];
}

function cookie_path_for_base(string $basePath): string
{
    $cookiePath = $basePath !== '' ? $basePath : '/';
    if ($cookiePath[0] !== '/') {
        $cookiePath = '/' . $cookiePath;
    }
    return $cookiePath;
}

function set_auth_cookie(string $cookieName, string $value, int $expiresAt, string $basePath): void
{
    $secure = (
        (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (isset($_SERVER['SERVER_PORT']) && (int) $_SERVER['SERVER_PORT'] === 443)
    );

    setcookie($cookieName, $value, [
        'expires' => $expiresAt,
        'path' => cookie_path_for_base($basePath),
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => $secure,
    ]);
}

function clear_auth_cookie(string $cookieName, string $basePath): void
{
    set_auth_cookie($cookieName, '', time() - 3600, $basePath);
}

function load_user_store(string $userStoreFile): array
{
    $fallback = ['users' => []];
    if (!is_file($userStoreFile)) {
        return $fallback;
    }

    $raw = file_get_contents($userStoreFile);
    if (!is_string($raw) || trim($raw) === '') {
        return $fallback;
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return $fallback;
    }

    $candidates = [];
    if (isset($data['users']) && is_array($data['users'])) {
        $candidates = $data['users'];
    } elseif (array_is_list($data)) {
        $candidates = $data;
    } elseif (isset($data['username'], $data['password'])) {
        $candidates = [$data];
    }

    $users = [];
    foreach ($candidates as $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $username = isset($entry['username']) && is_string($entry['username']) ? trim($entry['username']) : '';
        $password = isset($entry['password']) && is_string($entry['password']) ? $entry['password'] : '';
        if ($username === '' || $password === '') {
            continue;
        }
        $users[] = [
            'username' => $username,
            'password' => $password,
            'role' => normalize_role(isset($entry['role']) && is_string($entry['role']) ? $entry['role'] : 'user'),
            'login_at' => isset($entry['login_at']) && is_string($entry['login_at']) ? trim($entry['login_at']) : '',
            'tokken' => isset($entry['tokken']) && is_string($entry['tokken']) ? trim($entry['tokken']) : '',
        ];
    }

    return ['users' => $users];
}

function save_user_store(string $userStoreFile, array $store): bool
{
    $payload = json_encode($store, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($payload)) {
        return false;
    }
    return @file_put_contents($userStoreFile, $payload . PHP_EOL, LOCK_EX) !== false;
}

function find_user_index_by_credentials(array $users, string $username, string $password): int
{
    foreach ($users as $index => $user) {
        if (!is_array($user)) {
            continue;
        }
        $candidateUsername = isset($user['username']) && is_string($user['username']) ? $user['username'] : '';
        $candidatePassword = isset($user['password']) && is_string($user['password']) ? $user['password'] : '';
        if ($candidateUsername === $username && hash_equals($candidatePassword, $password)) {
            return (int) $index;
        }
    }
    return -1;
}

function find_user_index_by_tokken(array $users, string $tokken): int
{
    if ($tokken === '') {
        return -1;
    }
    foreach ($users as $index => $user) {
        if (!is_array($user)) {
            continue;
        }
        $candidate = isset($user['tokken']) && is_string($user['tokken']) ? trim($user['tokken']) : '';
        if ($candidate !== '' && hash_equals($candidate, $tokken)) {
            return (int) $index;
        }
    }
    return -1;
}

function login_timestamp_valid(string $loginAt, int $ttlSeconds): bool
{
    if ($loginAt === '') {
        return false;
    }
    $loginTs = strtotime($loginAt);
    if ($loginTs === false) {
        return false;
    }
    return (time() - $loginTs) <= $ttlSeconds;
}

function should_refresh_login_at(string $loginAt, int $intervalSeconds): bool
{
    $loginTs = strtotime($loginAt);
    if ($loginTs === false) {
        return true;
    }
    return (time() - $loginTs) >= $intervalSeconds;
}

function touch_user_auth_window(string $userStoreFile, int $index, array $store, string $basePath, string $cookieName, int $ttlSeconds): void
{
    $users = isset($store['users']) && is_array($store['users']) ? $store['users'] : [];
    if (!isset($users[$index]) || !is_array($users[$index])) {
        return;
    }
    $tokken = isset($users[$index]['tokken']) && is_string($users[$index]['tokken']) ? trim($users[$index]['tokken']) : '';
    if ($tokken === '') {
        return;
    }
    $users[$index]['login_at'] = date('c');
    $store['users'] = $users;
    if (save_user_store($userStoreFile, $store)) {
        set_auth_cookie($cookieName, $tokken, time() + $ttlSeconds, $basePath);
    }
}

function try_restore_auth_from_tokken(
    string $userStoreFile,
    string $cookieName,
    int $ttlSeconds,
    int $refreshIntervalSeconds,
    string $basePath
): void {
    if (is_authenticated()) {
        return;
    }

    $tokken = isset($_COOKIE[$cookieName]) && is_string($_COOKIE[$cookieName]) ? trim($_COOKIE[$cookieName]) : '';
    if ($tokken === '') {
        return;
    }

    $store = load_user_store($userStoreFile);
    $users = isset($store['users']) && is_array($store['users']) ? $store['users'] : [];
    $index = find_user_index_by_tokken($users, $tokken);
    if ($index < 0) {
        clear_auth_cookie($cookieName, $basePath);
        return;
    }

    $entry = $users[$index];
    $username = isset($entry['username']) && is_string($entry['username']) ? trim($entry['username']) : '';
    $role = normalize_role(isset($entry['role']) && is_string($entry['role']) ? $entry['role'] : 'user');
    $loginAt = isset($entry['login_at']) && is_string($entry['login_at']) ? trim($entry['login_at']) : '';

    if ($username === '' || !login_timestamp_valid($loginAt, $ttlSeconds)) {
        $users[$index]['tokken'] = '';
        $users[$index]['login_at'] = '';
        $store['users'] = $users;
        save_user_store($userStoreFile, $store);
        clear_auth_cookie($cookieName, $basePath);
        return;
    }

    $_SESSION['auth_user'] = $username;
    $_SESSION['auth_role'] = $role;
    if (should_refresh_login_at($loginAt, $refreshIntervalSeconds)) {
        touch_user_auth_window($userStoreFile, $index, $store, $basePath, $cookieName, $ttlSeconds);
    } else {
        $expiresAt = strtotime($loginAt);
        if ($expiresAt !== false) {
            set_auth_cookie($cookieName, $tokken, ((int) $expiresAt) + $ttlSeconds, $basePath);
        }
    }
}

function refresh_auth_from_session(
    string $userStoreFile,
    string $cookieName,
    int $ttlSeconds,
    int $refreshIntervalSeconds,
    string $basePath
): void {
    $username = session_username();
    if ($username === '') {
        return;
    }

    $store = load_user_store($userStoreFile);
    $users = isset($store['users']) && is_array($store['users']) ? $store['users'] : [];
    foreach ($users as $index => $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $candidate = isset($entry['username']) && is_string($entry['username']) ? trim($entry['username']) : '';
        if ($candidate !== $username) {
            continue;
        }
        $_SESSION['auth_role'] = normalize_role(isset($entry['role']) && is_string($entry['role']) ? $entry['role'] : 'user');

        $tokken = isset($entry['tokken']) && is_string($entry['tokken']) ? trim($entry['tokken']) : '';
        if ($tokken === '') {
            $tokken = bin2hex(random_bytes(24));
            $users[$index]['tokken'] = $tokken;
            $users[$index]['login_at'] = date('c');
            $store['users'] = $users;
            if (save_user_store($userStoreFile, $store)) {
                set_auth_cookie($cookieName, $tokken, time() + $ttlSeconds, $basePath);
            }
            return;
        }

        $loginAt = isset($entry['login_at']) && is_string($entry['login_at']) ? trim($entry['login_at']) : '';
        if (!login_timestamp_valid($loginAt, $ttlSeconds) || should_refresh_login_at($loginAt, $refreshIntervalSeconds)) {
            touch_user_auth_window($userStoreFile, (int) $index, $store, $basePath, $cookieName, $ttlSeconds);
        } else {
            $expiresAt = strtotime($loginAt);
            if ($expiresAt !== false) {
                set_auth_cookie($cookieName, $tokken, ((int) $expiresAt) + $ttlSeconds, $basePath);
            }
        }
        return;
    }
}

function clear_user_tokken_by_username(string $userStoreFile, string $username): void
{
    if ($username === '') {
        return;
    }

    $store = load_user_store($userStoreFile);
    $users = isset($store['users']) && is_array($store['users']) ? $store['users'] : [];
    foreach ($users as $index => $entry) {
        if (!is_array($entry)) {
            continue;
        }
        $candidate = isset($entry['username']) && is_string($entry['username']) ? trim($entry['username']) : '';
        if ($candidate === $username) {
            $users[$index]['tokken'] = '';
            $users[$index]['login_at'] = '';
            $store['users'] = $users;
            save_user_store($userStoreFile, $store);
            return;
        }
    }
}

function clear_user_tokken_by_value(string $userStoreFile, string $tokken): void
{
    if ($tokken === '') {
        return;
    }

    $store = load_user_store($userStoreFile);
    $users = isset($store['users']) && is_array($store['users']) ? $store['users'] : [];
    $index = find_user_index_by_tokken($users, $tokken);
    if ($index < 0) {
        return;
    }
    $users[$index]['tokken'] = '';
    $users[$index]['login_at'] = '';
    $store['users'] = $users;
    save_user_store($userStoreFile, $store);
}

function is_image_name(string $name): bool
{
    return (bool) preg_match('/\.(avif|gif|jpe?g|png|webp|bmp|svg)$/i', $name);
}

function is_audio_name(string $name): bool
{
    return (bool) preg_match('/\.(mp3|wav|m4a|aac|ogg|flac|wma|webm|oga|opus)$/i', $name);
}

function sanitize_album_folder_name(string $name): string
{
    $value = trim(str_replace(['/', '\\'], ' ', $name));
    $value = preg_replace('/\s+/u', ' ', $value);
    $value = preg_replace('/[^\p{L}\p{N}\s._-]+/u', '', (string) $value);
    $value = trim((string) $value, " .\t\n\r\0\x0B");
    return $value;
}

function album_folder_storage_name(string $name): string
{
    $value = sanitize_album_folder_name($name);
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if (is_string($converted) && $converted !== '') {
            $value = $converted;
        }
    }
    $value = strtolower((string) $value);
    $value = preg_replace('/[^a-z0-9._-]+/', '_', (string) $value);
    $value = preg_replace('/_+/u', '_', (string) $value);
    $value = trim((string) $value, "._-\t\n\r\0\x0B");
    return $value !== '' ? $value : 'album';
}

function album_folder_compare_key(string $name): string
{
    return album_folder_storage_name($name);
}

function album_title_from_folder(string $folderName): string
{
    $title = str_replace('_', ' ', $folderName);
    $title = preg_replace('/\s+/u', ' ', (string) $title);
    return trim((string) $title);
}

function sanitize_album_title(string $name): string
{
    $value = sanitize_album_folder_name($name);
    $value = preg_replace('/\s+/u', ' ', (string) $value);
    return trim((string) $value);
}

function load_album_titles(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $raw = @file_get_contents($file);
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    $result = [];
    foreach ($decoded as $folder => $title) {
        if (!is_string($folder) || !is_string($title)) {
            continue;
        }
        $folderKey = trim($folder);
        $titleValue = sanitize_album_title($title);
        if ($folderKey === '' || $titleValue === '') {
            continue;
        }
        $result[$folderKey] = $titleValue;
    }
    return $result;
}

function save_album_titles(string $file, array $titles): bool
{
    $payload = json_encode($titles, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($payload)) {
        return false;
    }
    return @file_put_contents($file, $payload . PHP_EOL, LOCK_EX) !== false;
}

function load_album_hidden(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $raw = @file_get_contents($file);
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    $result = [];
    foreach ($decoded as $key => $value) {
        if (is_int($key) && is_string($value)) {
            $folderKey = trim($value);
        } elseif (is_string($key)) {
            $folderKey = trim($key);
        } else {
            continue;
        }
        $folderKey = sanitize_album_folder_name($folderKey);
        if ($folderKey === '') {
            continue;
        }
        $result[$folderKey] = true;
    }
    return $result;
}

function save_album_hidden(string $file, array $hidden): bool
{
    $payload = json_encode($hidden, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($payload)) {
        return false;
    }
    return @file_put_contents($file, $payload . PHP_EOL, LOCK_EX) !== false;
}

function load_album_hidden_images(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $raw = @file_get_contents($file);
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    $result = [];
    foreach ($decoded as $folder => $stems) {
        if (!is_string($folder)) {
            continue;
        }
        $folderKey = sanitize_album_folder_name($folder);
        if ($folderKey === '') {
            continue;
        }
        if (!is_array($stems)) {
            continue;
        }
        foreach ($stems as $stem) {
            if (!is_string($stem)) {
                continue;
            }
            $stemKey = image_stem_key_from_stem($stem);
            if ($stemKey === '') {
                continue;
            }
            if (!isset($result[$folderKey])) {
                $result[$folderKey] = [];
            }
            $result[$folderKey][$stemKey] = true;
        }
    }
    return $result;
}

function save_album_hidden_images(string $file, array $hidden): bool
{
    $payload = [];
    foreach ($hidden as $folder => $stems) {
        if (!is_string($folder)) {
            continue;
        }
        $folderKey = sanitize_album_folder_name($folder);
        if ($folderKey === '') {
            continue;
        }
        if (!is_array($stems) || count($stems) < 1) {
            continue;
        }
        $payload[$folderKey] = array_values(array_unique(array_filter(array_map('strval', array_keys($stems)))));
    }
    $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($json)) {
        return false;
    }
    return @file_put_contents($file, $json . PHP_EOL, LOCK_EX) !== false;
}

function load_audio_order(string $file): array
{
    if (!is_file($file)) {
        return [];
    }
    $raw = @file_get_contents($file);
    if (!is_string($raw) || trim($raw) === '') {
        return [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        return [];
    }
    $result = [];
    foreach ($decoded as $name) {
        if (is_string($name)) {
            $value = trim($name);
            if ($value !== '') {
                $result[] = $value;
            }
        }
    }
    return $result;
}

function save_audio_order(string $file, array $order): bool
{
    $clean = [];
    foreach ($order as $name) {
        if (!is_string($name)) {
            continue;
        }
        $value = trim($name);
        if ($value === '') {
            continue;
        }
        $clean[] = $value;
    }
    $payload = json_encode(array_values($clean), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
    if (!is_string($payload)) {
        return false;
    }
    return @file_put_contents($file, $payload . PHP_EOL, LOCK_EX) !== false;
}

function detect_folder_title_from_upload(array $filesField): string
{
    $paths = $filesField['full_path'] ?? [];
    if (!is_array($paths)) {
        return '';
    }
    foreach ($paths as $rawPath) {
        if (!is_string($rawPath)) {
            continue;
        }
        $path = trim(str_replace('\\', '/', $rawPath), '/');
        if ($path === '') {
            continue;
        }
        $parts = explode('/', $path);
        $first = isset($parts[0]) ? sanitize_album_title((string) $parts[0]) : '';
        if ($first !== '') {
            return $first;
        }
    }
    return '';
}

function find_existing_album_folder_name(string $albumsDir, string $targetName): string
{
    $targetKey = album_folder_compare_key($targetName);
    if ($targetKey === '') {
        return '';
    }
    foreach (list_subdirs($albumsDir) as $folderName) {
        if (album_folder_compare_key($folderName) === $targetKey) {
            return $folderName;
        }
    }
    return '';
}

function sanitize_file_stem(string $name): string
{
    $value = trim($name);
    $value = preg_replace('/[^\p{L}\p{N}\s._-]+/u', '', (string) $value);
    $value = preg_replace('/\s+/u', ' ', (string) $value);
    $value = trim((string) $value, " .\t\n\r\0\x0B");
    return $value === '' ? 'image' : $value;
}

function extract_uploaded_files(array $filesField): array
{
    $normalized = [];
    $names = $filesField['name'] ?? [];
    $tmpNames = $filesField['tmp_name'] ?? [];
    $errors = $filesField['error'] ?? [];
    $sizes = $filesField['size'] ?? [];
    if (!is_array($names)) {
        return $normalized;
    }
    foreach ($names as $i => $name) {
        $normalized[] = [
            'name' => is_string($name) ? $name : '',
            'tmp_name' => isset($tmpNames[$i]) && is_string($tmpNames[$i]) ? $tmpNames[$i] : '',
            'error' => isset($errors[$i]) ? (int) $errors[$i] : UPLOAD_ERR_NO_FILE,
            'size' => isset($sizes[$i]) ? (int) $sizes[$i] : 0,
        ];
    }
    return $normalized;
}

function unique_destination_path(string $dir, string $baseName, string $extension): string
{
    $ext = strtolower(ltrim($extension, '.'));
    $name = sanitize_file_stem($baseName);
    $candidate = $dir . DIRECTORY_SEPARATOR . $name . ($ext !== '' ? '.' . $ext : '');
    $suffix = 1;
    while (file_exists($candidate)) {
        $candidate = $dir . DIRECTORY_SEPARATOR . $name . '-' . $suffix . ($ext !== '' ? '.' . $ext : '');
        $suffix += 1;
    }
    return $candidate;
}

function unique_destination_path_with_exclude(string $dir, string $baseName, string $extension, string $excludePath = ''): string
{
    $ext = strtolower(ltrim($extension, '.'));
    $name = sanitize_file_stem($baseName);
    $candidate = $dir . DIRECTORY_SEPARATOR . $name . ($ext !== '' ? '.' . $ext : '');
    $suffix = 1;
    while (file_exists($candidate) && realpath($candidate) !== realpath($excludePath)) {
        $candidate = $dir . DIRECTORY_SEPARATOR . $name . '-' . $suffix . ($ext !== '' ? '.' . $ext : '');
        $suffix += 1;
    }
    return $candidate;
}

function rename_sidecar_by_stem(string $dir, string $oldStem, string $newStem): void
{
    if (!is_dir($dir) || $oldStem === '' || $newStem === '' || $oldStem === $newStem) {
        return;
    }
    foreach (list_files_sorted($dir) as $file) {
        $currentStem = pathinfo($file, PATHINFO_FILENAME);
        if ($currentStem !== $oldStem) {
            continue;
        }
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        $oldPath = $dir . DIRECTORY_SEPARATOR . $file;
        $newPath = unique_destination_path_with_exclude($dir, $newStem, $ext, $oldPath);
        if ($newPath !== $oldPath) {
            @rename($oldPath, $newPath);
        }
    }
}

function rename_album_image_files(string $albumsDir, string $rowDir, string $thumbsDir, string $folder, string $oldName, string $newStem): bool
{
    $folder = sanitize_album_folder_name($folder);
    $oldName = basename($oldName);
    $newStem = sanitize_file_stem($newStem);
    if ($folder === '' || $oldName === '' || $newStem === '' || !is_image_name($oldName)) {
        return false;
    }

    $albumDir = $albumsDir . DIRECTORY_SEPARATOR . $folder;
    if (!is_dir($albumDir)) {
        return false;
    }
    $oldPath = $albumDir . DIRECTORY_SEPARATOR . $oldName;
    if (!is_file($oldPath)) {
        return false;
    }

    $oldStem = pathinfo($oldName, PATHINFO_FILENAME);
    if ($oldStem === $newStem) {
        return true;
    }

    $ext = pathinfo($oldName, PATHINFO_EXTENSION);
    $newPath = unique_destination_path_with_exclude($albumDir, $newStem, $ext, $oldPath);
    if (!@rename($oldPath, $newPath)) {
        return false;
    }

    rename_sidecar_by_stem($rowDir . DIRECTORY_SEPARATOR . $folder, $oldStem, $newStem);
    rename_sidecar_by_stem($thumbsDir . DIRECTORY_SEPARATOR . $folder, $oldStem, $newStem);
    return true;
}

function ensure_album_directory(string $albumsDir, string $albumName, bool $mustBeNew = false): array
{
    $sanitized = sanitize_album_folder_name($albumName);
    if ($sanitized === '') {
        return [false, '', 'Invalid album name.'];
    }
    $storageName = album_folder_storage_name($sanitized);
    if ($storageName === '') {
        return [false, '', 'Invalid album name.'];
    }
    if (!is_dir($albumsDir) && !@mkdir($albumsDir, 0775, true)) {
        return [false, '', 'Albums directory is not writable.'];
    }
    $existingName = find_existing_album_folder_name($albumsDir, $storageName);
    $targetName = $existingName !== '' ? $existingName : $storageName;
    $targetDir = $albumsDir . DIRECTORY_SEPARATOR . $targetName;
    if (!is_dir($targetDir) && !@mkdir($targetDir, 0775, true)) {
        return [false, '', 'Cannot create album directory.'];
    }
    $albumsReal = realpath($albumsDir);
    $targetReal = realpath($targetDir);
    if ($albumsReal === false || $targetReal === false || !path_starts_with($targetReal, $albumsReal)) {
        return [false, '', 'Invalid album path.'];
    }
    return [true, $targetReal, $targetName];
}

function save_uploaded_image_file(array $upload, string $targetDir): bool
{
    $error = isset($upload['error']) ? (int) $upload['error'] : UPLOAD_ERR_NO_FILE;
    $tmpName = isset($upload['tmp_name']) && is_string($upload['tmp_name']) ? $upload['tmp_name'] : '';
    $rawName = isset($upload['name']) && is_string($upload['name']) ? basename($upload['name']) : '';
    if ($error !== UPLOAD_ERR_OK || $tmpName === '' || $rawName === '' || !is_uploaded_file($tmpName)) {
        return false;
    }
    if (!is_image_name($rawName)) {
        return false;
    }
    $baseName = pathinfo($rawName, PATHINFO_FILENAME);
    $ext = pathinfo($rawName, PATHINFO_EXTENSION);
    $targetPath = unique_destination_path($targetDir, $baseName, $ext);
    return @move_uploaded_file($tmpName, $targetPath);
}

function save_uploaded_audio_file(array $upload, string $targetDir): bool
{
    $error = isset($upload['error']) ? (int) $upload['error'] : UPLOAD_ERR_NO_FILE;
    $tmpName = isset($upload['tmp_name']) && is_string($upload['tmp_name']) ? $upload['tmp_name'] : '';
    $rawName = isset($upload['name']) && is_string($upload['name']) ? basename($upload['name']) : '';
    if ($error !== UPLOAD_ERR_OK || $tmpName === '' || $rawName === '' || !is_uploaded_file($tmpName)) {
        return false;
    }
    if (!is_audio_name($rawName)) {
        return false;
    }
    $baseName = pathinfo($rawName, PATHINFO_FILENAME);
    $ext = pathinfo($rawName, PATHINFO_EXTENSION);
    $targetPath = unique_destination_path($targetDir, $baseName, $ext);
    return @move_uploaded_file($tmpName, $targetPath);
}

function save_image_from_zip_stream(ZipArchive $zip, int $index, string $targetDir): bool
{
    $entryName = $zip->getNameIndex($index);
    if (!is_string($entryName) || $entryName === '') {
        return false;
    }
    $basename = basename(str_replace('\\', '/', $entryName));
    if ($basename === '' || !is_image_name($basename)) {
        return false;
    }
    $stream = $zip->getStream($entryName);
    if (!is_resource($stream)) {
        return false;
    }
    $data = stream_get_contents($stream);
    fclose($stream);
    if (!is_string($data) || $data === '') {
        return false;
    }
    $baseName = pathinfo($basename, PATHINFO_FILENAME);
    $ext = pathinfo($basename, PATHINFO_EXTENSION);
    $targetPath = unique_destination_path($targetDir, $baseName, $ext);
    return @file_put_contents($targetPath, $data) !== false;
}

function can_execute_shell_command(): bool
{
    if (!function_exists('exec')) {
        return false;
    }
    $disabledRaw = ini_get('disable_functions');
    if (!is_string($disabledRaw) || trim($disabledRaw) === '') {
        return true;
    }
    $disabledList = array_map('trim', explode(',', $disabledRaw));
    return !in_array('exec', $disabledList, true);
}

function has_shell_binary(string $binary): bool
{
    if (!can_execute_shell_command()) {
        return false;
    }
    $output = [];
    $exitCode = 1;
    @exec('command -v ' . escapeshellarg($binary) . ' >/dev/null 2>&1', $output, $exitCode);
    return $exitCode === 0;
}

function read_build_pid(string $lockFile): int
{
    if (!is_file($lockFile)) {
        return 0;
    }
    $raw = @file_get_contents($lockFile);
    if (!is_string($raw)) {
        return 0;
    }
    $pid = (int) trim($raw);
    return $pid > 0 ? $pid : 0;
}

function read_build_lock_raw(string $lockFile): string
{
    if (!is_file($lockFile)) {
        return '';
    }
    $raw = @file_get_contents($lockFile);
    return is_string($raw) ? trim($raw) : '';
}

function is_pid_running(int $pid): bool
{
    if ($pid <= 0) {
        return false;
    }
    if (function_exists('posix_kill')) {
        return @posix_kill($pid, 0);
    }
    if (!can_execute_shell_command()) {
        return false;
    }
    $output = [];
    $exitCode = 1;
    @exec('ps -p ' . (int) $pid . ' > /dev/null 2>&1', $output, $exitCode);
    return $exitCode === 0;
}

function build_status(string $lockFile): array
{
    $raw = read_build_lock_raw($lockFile);
    if ($raw === '') {
        return [
            'running' => false,
            'pid' => 0,
            'code' => null,
        ];
    }

    if (str_starts_with($raw, 'running:')) {
        return [
            'running' => true,
            'pid' => 0,
            'code' => null,
        ];
    }

    if (str_starts_with($raw, 'done:')) {
        $code = (int) trim(substr($raw, strlen('done:')));
        @unlink($lockFile);
        return [
            'running' => false,
            'pid' => 0,
            'code' => $code,
        ];
    }

    // Backward compatibility: old PID-based lock format.
    $pid = (int) $raw;
    $running = is_pid_running($pid);
    if (!$running) {
        @unlink($lockFile);
    }
    return [
        'running' => $running,
        'pid' => $running ? $pid : 0,
        'code' => null,
    ];
}

function log_build_line(string $logFile, string $line): void
{
    $dir = dirname($logFile);
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
    @file_put_contents($logFile, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
}

function rel_path_for_log(string $rootDir, string $path): string
{
    $root = rtrim(str_replace('\\', '/', $rootDir), '/');
    $value = str_replace('\\', '/', $path);
    if (str_starts_with($value, $root . '/')) {
        return substr($value, strlen($root) + 1);
    }
    return $value;
}

function image_from_file(string $file): mixed
{
    $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
    if ($ext === 'jpg' || $ext === 'jpeg') {
        return function_exists('imagecreatefromjpeg') ? @imagecreatefromjpeg($file) : false;
    }
    if ($ext === 'png') {
        return function_exists('imagecreatefrompng') ? @imagecreatefrompng($file) : false;
    }
    if ($ext === 'gif') {
        return function_exists('imagecreatefromgif') ? @imagecreatefromgif($file) : false;
    }
    if ($ext === 'webp') {
        return function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($file) : false;
    }
    if ($ext === 'bmp') {
        return function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($file) : false;
    }
    if ($ext === 'avif') {
        return function_exists('imagecreatefromavif') ? @imagecreatefromavif($file) : false;
    }
    return false;
}

function image_encode_webp_data($image, int $quality): string
{
    ob_start();
    $ok = @imagewebp($image, null, $quality);
    $data = ob_get_clean();
    if (!$ok || !is_string($data) || $data === '') {
        return '';
    }
    return $data;
}

function image_resized_copy($sourceImage, int $srcWidth, int $srcHeight, int $maxWidth)
{
    if ($maxWidth <= 0 || $srcWidth <= $maxWidth) {
        return $sourceImage;
    }
    $ratio = $maxWidth / $srcWidth;
    $targetW = max(1, (int) round($srcWidth * $ratio));
    $targetH = max(1, (int) round($srcHeight * $ratio));
    $canvas = imagecreatetruecolor($targetW, $targetH);
    if ($canvas === false) {
        return false;
    }
    imagealphablending($canvas, false);
    imagesavealpha($canvas, true);
    $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
    imagefill($canvas, 0, 0, $transparent);
    if (!@imagecopyresampled($canvas, $sourceImage, 0, 0, 0, 0, $targetW, $targetH, $srcWidth, $srcHeight)) {
        imagedestroy($canvas);
        return false;
    }
    return $canvas;
}

function convert_image_to_webp_gd(string $srcFile, string $destFile, int $maxBytes, array $widthSteps, array $qualitySteps): array
{
    if (!function_exists('imagewebp')) {
        return ['ok' => false, 'size' => 0];
    }
    $source = image_from_file($srcFile);
    if ($source === false) {
        return ['ok' => false, 'size' => 0];
    }
    $srcW = imagesx($source);
    $srcH = imagesy($source);
    if ($srcW < 1 || $srcH < 1) {
        imagedestroy($source);
        return ['ok' => false, 'size' => 0];
    }

    $bestData = '';
    $bestSize = PHP_INT_MAX;
    foreach ($widthSteps as $maxWidth) {
        $working = image_resized_copy($source, $srcW, $srcH, (int) $maxWidth);
        if ($working === false) {
            continue;
        }
        foreach ($qualitySteps as $quality) {
            $data = image_encode_webp_data($working, (int) $quality);
            if ($data === '') {
                continue;
            }
            $size = strlen($data);
            if ($size < $bestSize) {
                $bestSize = $size;
                $bestData = $data;
            }
            if ($size <= $maxBytes) {
                @file_put_contents($destFile, $data, LOCK_EX);
                if ($working !== $source) {
                    imagedestroy($working);
                }
                imagedestroy($source);
                return ['ok' => true, 'size' => $size];
            }
        }
        if ($working !== $source) {
            imagedestroy($working);
        }
    }
    imagedestroy($source);
    if ($bestData === '') {
        return ['ok' => false, 'size' => 0];
    }
    @file_put_contents($destFile, $bestData, LOCK_EX);
    return ['ok' => true, 'size' => strlen($bestData)];
}

function php_build_row_and_thumbs(string $rootDir, string $logFile, string $albumFilter = ''): array
{
    if (!extension_loaded('gd') || !function_exists('imagewebp')) {
        return ['ok' => false, 'message' => 'GD/WebP is not available for fallback build.', 'code' => -2];
    }

    $albumsDir = $rootDir . '/src/albums';
    $rowDir = $rootDir . '/src/row';
    $thumbsDir = $rootDir . '/src/thumbs';
    if (!is_dir($albumsDir)) {
        return ['ok' => false, 'message' => 'Albums directory not found.', 'code' => -2];
    }
    if (!is_dir($rowDir)) {
        @mkdir($rowDir, 0775, true);
    }
    if (!is_dir($thumbsDir)) {
        @mkdir($thumbsDir, 0775, true);
    }

    $filter = sanitize_album_folder_name($albumFilter);
    $folders = $filter !== '' ? [$filter] : list_subdirs($albumsDir);
    $converted = 0;
    $skipped = 0;
    $failed = 0;

    log_build_line($logFile, '[PHP-FALLBACK] Building row + thumbnail images' . ($filter !== '' ? ' for album: ' . $filter : ' from src/albums'));

    foreach ($folders as $folderName) {
        $albumFolder = $albumsDir . DIRECTORY_SEPARATOR . $folderName;
        if (!is_dir($albumFolder)) {
            continue;
        }
        $rowFolder = $rowDir . DIRECTORY_SEPARATOR . $folderName;
        $thumbFolder = $thumbsDir . DIRECTORY_SEPARATOR . $folderName;
        if (!is_dir($rowFolder)) {
            @mkdir($rowFolder, 0775, true);
        }
        if (!is_dir($thumbFolder)) {
            @mkdir($thumbFolder, 0775, true);
        }

        foreach (list_files_sorted($albumFolder) as $fileName) {
            if (!is_image_name($fileName)) {
                continue;
            }
            $srcFile = $albumFolder . DIRECTORY_SEPARATOR . $fileName;
            $base = pathinfo($fileName, PATHINFO_FILENAME);
            $rowOut = $rowFolder . DIRECTORY_SEPARATOR . $base . '.webp';
            $thumbOut = $thumbFolder . DIRECTORY_SEPARATOR . $base . '.webp';

            if (is_file($rowOut) && is_file($thumbOut) && filemtime($srcFile) <= filemtime($rowOut) && filemtime($srcFile) <= filemtime($thumbOut)) {
                $skipped += 1;
                log_build_line($logFile, 'SKIP ' . rel_path_for_log($rootDir, $srcFile) . ' (up-to-date)');
                continue;
            }

            $rowResult = convert_image_to_webp_gd($srcFile, $rowOut, 500000, [0, 2400, 1920, 1600, 1280], [82, 76, 70, 64, 58, 52]);
            $thumbResult = convert_image_to_webp_gd($srcFile, $thumbOut, 120000, [900, 760, 640, 520], [72, 66, 60, 54, 48]);
            if (!($rowResult['ok'] ?? false) || !($thumbResult['ok'] ?? false)) {
                $failed += 1;
                log_build_line($logFile, 'WARN fallback convert failed: ' . rel_path_for_log($rootDir, $srcFile));
                continue;
            }

            $converted += 1;
            log_build_line(
                $logFile,
                rel_path_for_log($rootDir, $srcFile)
                . ' -> row:' . rel_path_for_log($rootDir, $rowOut) . ' (' . (int) ($rowResult['size'] ?? 0) . ' bytes), '
                . 'thumb:' . rel_path_for_log($rootDir, $thumbOut) . ' (' . (int) ($thumbResult['size'] ?? 0) . ' bytes)'
            );
        }
    }

    log_build_line($logFile, 'Done: generated .webp files in src/row and src/thumbs');
    log_build_line($logFile, 'Converted: ' . $converted . ' | Skipped: ' . $skipped . ' | Failed: ' . $failed);
    return ['ok' => true, 'queued' => false, 'already_running' => false, 'pid' => 0, 'message' => 'Build completed (PHP fallback).', 'code' => 0];
}

function skip_background_build(string $logFile, string $reason, string $albumFilter = ''): array
{
    $suffix = $albumFilter !== '' ? ' album=' . $albumFilter : '';
    log_build_line($logFile, '[DEFERRED] Background build skipped: ' . $reason . $suffix);
    return [
        'ok' => true,
        'queued' => false,
        'already_running' => false,
        'pid' => 0,
        'message' => 'Build deferred. Originals remain available.',
        'code' => 0,
        'deferred' => true,
        'reason' => $reason,
    ];
}

function queue_build_row_and_thumbs(string $rootDir, string $lockFile, string $logFile, string $albumFilter = ''): array
{
    $scriptPath = $rootDir . '/scripts/build-album-images.sh';
    $albumFilter = sanitize_album_folder_name($albumFilter);

    if (!is_file($scriptPath)) {
        return skip_background_build($logFile, 'build script missing', $albumFilter);
    }
    if (!can_execute_shell_command()) {
        return skip_background_build($logFile, 'shell execution unavailable', $albumFilter);
    }
    if (!has_shell_binary('bash')) {
        return skip_background_build($logFile, 'bash not found', $albumFilter);
    }
    if (!has_shell_binary('cwebp')) {
        return skip_background_build($logFile, 'cwebp not found', $albumFilter);
    }

    $status = build_status($lockFile);
    if ($status['running']) {
        return ['ok' => true, 'queued' => true, 'already_running' => true, 'pid' => $status['pid'], 'message' => 'Build is already running.', 'code' => 0];
    }

    $storageDir = dirname($lockFile);
    if (!is_dir($storageDir) && !@mkdir($storageDir, 0775, true)) {
        return ['ok' => false, 'queued' => false, 'message' => 'Storage directory is not writable.', 'code' => -1];
    }
    @file_put_contents($lockFile, 'running:' . time(), LOCK_EX);

    $output = [];
    $exitCode = 1;
    $buildCmd = 'bash ' . escapeshellarg($scriptPath);
    if ($albumFilter !== '') {
        $buildCmd .= ' ' . escapeshellarg($albumFilter);
    }
    $worker = 'cd ' . escapeshellarg($rootDir)
        . ' && ' . $buildCmd . ' >> ' . escapeshellarg($logFile) . ' 2>&1'
        . '; status=$?; printf "done:%s\n" "$status" > ' . escapeshellarg($lockFile);
    $command = 'nohup bash -lc ' . escapeshellarg($worker) . ' >/dev/null 2>&1 & echo $!';
    @exec($command, $output, $exitCode);
    if ($exitCode !== 0) {
        @unlink($lockFile);
        return skip_background_build($logFile, 'background worker launch failed', $albumFilter);
    }
    $pidRaw = trim((string) ($output[0] ?? '0'));
    $pid = (int) $pidRaw;
    if ($pid <= 0) {
        // Some hosting environments do not return PID for detached process.
        // Keep running marker; worker will update lock to done:<exit_code>.
        return ['ok' => true, 'queued' => true, 'already_running' => false, 'pid' => 0, 'message' => 'Build queued (pid unavailable).', 'code' => 0];
    }
    return [
        'ok' => true,
        'queued' => true,
        'already_running' => false,
        'pid' => $pid,
        'message' => 'Build queued.',
        'code' => 0,
    ];
}

function path_starts_with(string $path, string $prefix): bool
{
    return strncmp($path, $prefix, strlen($prefix)) === 0;
}

function str_ends_with_compat(string $haystack, string $needle): bool
{
    if ($needle === '') {
        return true;
    }
    $needleLen = strlen($needle);
    if ($needleLen > strlen($haystack)) {
        return false;
    }
    return substr($haystack, -$needleLen) === $needle;
}

function list_subdirs(string $dir): array
{
    if (!is_dir($dir)) {
        return [];
    }

    $items = scandir($dir);
    if ($items === false) {
        return [];
    }

    $dirs = [];
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        if ($item[0] === '.') {
            continue;
        }
        $full = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($full)) {
            $dirs[] = $item;
        }
    }

    natcasesort($dirs);
    return array_values($dirs);
}

function list_files_sorted(string $dir): array
{
    if (!is_dir($dir)) {
        return [];
    }

    $items = scandir($dir);
    if ($items === false) {
        return [];
    }

    $files = [];
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $full = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_file($full)) {
            $files[] = $item;
        }
    }

    natcasesort($files);
    return array_values($files);
}

function stem_key(string $filename): string
{
    $stem = pathinfo($filename, PATHINFO_FILENAME);
    return function_exists('mb_strtolower')
        ? mb_strtolower($stem, 'UTF-8')
        : strtolower($stem);
}

function image_stem_key_from_filename(string $filename): string
{
    return stem_key($filename);
}

function image_stem_key_from_stem(string $stem): string
{
    return function_exists('mb_strtolower')
        ? mb_strtolower($stem, 'UTF-8')
        : strtolower($stem);
}

function build_albums(
    string $albumsDir,
    string $rowDir,
    string $thumbsDir,
    array $albumTitles = [],
    array $albumHidden = [],
    array $albumHiddenImages = []
): array {
    $albums = [];
    $folderMap = [];
    foreach (list_subdirs($albumsDir) as $folderName) {
        $folderMap[$folderName] = true;
    }
    foreach (list_subdirs($thumbsDir) as $folderName) {
        $folderMap[$folderName] = true;
    }
    foreach (list_subdirs($rowDir) as $folderName) {
        $folderMap[$folderName] = true;
    }
    $folders = array_keys($folderMap);
    natcasesort($folders);

    foreach ($folders as $folderName) {
        $folderPath = $albumsDir . DIRECTORY_SEPARATOR . $folderName;

        $rowIndex = [];
        $rowFolder = $rowDir . DIRECTORY_SEPARATOR . $folderName;
        foreach (list_files_sorted($rowFolder) as $file) {
            if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'webp') {
                $rowIndex[stem_key($file)] = $file;
            }
        }

        $thumbsIndex = [];
        $thumbsFolder = $thumbsDir . DIRECTORY_SEPARATOR . $folderName;
        foreach (list_files_sorted($thumbsFolder) as $file) {
            if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'webp') {
                $thumbsIndex[stem_key($file)] = $file;
            }
        }

        $originalIndex = [];
        foreach (list_files_sorted($folderPath) as $original) {
            if (!is_image_name($original)) {
                continue;
            }
            $originalIndex[stem_key($original)] = $original;
        }

        $images = [];
        $allKeys = array_unique(array_merge(array_keys($thumbsIndex), array_keys($rowIndex), array_keys($originalIndex)));
        natcasesort($allKeys);
        foreach ($allKeys as $base) {
            $hasThumb = isset($thumbsIndex[$base]);
            $hasRow = isset($rowIndex[$base]);
            $hasOriginal = isset($originalIndex[$base]);
            if (!$hasThumb && !$hasRow && !$hasOriginal) {
                continue;
            }

            if ($hasThumb) {
                $previewName = $thumbsIndex[$base];
                $previewRoot = 'thumbs';
            } elseif ($hasRow) {
                $previewName = $rowIndex[$base];
                $previewRoot = 'row';
            } else {
                $previewName = $originalIndex[$base];
                $previewRoot = 'albums';
            }

            if ($hasRow) {
                $detailName = $rowIndex[$base];
                $detailRoot = 'row';
            } elseif ($hasOriginal) {
                $detailName = $originalIndex[$base];
                $detailRoot = 'albums';
            } else {
                $detailName = $previewName;
                $detailRoot = $previewRoot;
            }

            if ($hasOriginal) {
                $originalName = $originalIndex[$base];
                $originalRoot = 'albums';
            } else {
                $originalName = $detailName;
                $originalRoot = $detailRoot;
            }

            $previewPath = ($previewRoot === 'thumbs' ? $thumbsFolder : ($previewRoot === 'row' ? $rowFolder : $folderPath)) . DIRECTORY_SEPARATOR . $previewName;
            $detailPath = ($detailRoot === 'thumbs' ? $thumbsFolder : ($detailRoot === 'row' ? $rowFolder : $folderPath)) . DIRECTORY_SEPARATOR . $detailName;
            $originalPath = ($originalRoot === 'albums' ? $folderPath : ($originalRoot === 'thumbs' ? $thumbsFolder : $rowFolder)) . DIRECTORY_SEPARATOR . $originalName;
            $uploadedAt = @filemtime($originalPath);
            if ($uploadedAt === false) {
                $uploadedAt = @filemtime($detailPath);
            }
            if ($uploadedAt === false) {
                $uploadedAt = @filemtime($previewPath);
            }
            $createdAt = @filectime($originalPath);
            if ($createdAt === false) {
                $createdAt = @filectime($detailPath);
            }
            if ($createdAt === false) {
                $createdAt = @filectime($previewPath);
            }
            $uploadedAtValue = $uploadedAt === false ? 0 : (int) $uploadedAt;
            $createdAtValue = $createdAt === false ? $uploadedAtValue : (int) $createdAt;

            $hiddenKey = image_stem_key_from_filename($originalName !== '' ? $originalName : $previewName);
            $hiddenImage = isset($albumHiddenImages[$folderName]) && isset($albumHiddenImages[$folderName][$hiddenKey]);
            $images[] = [
                'name' => $previewName,
                'root' => $previewRoot,
                'detail' => $detailName,
                'detail_root' => $detailRoot,
                'original' => $originalName,
                'original_root' => $originalRoot,
                'uploaded_at' => $uploadedAtValue,
                'created_at' => $createdAtValue,
                'hidden' => $hiddenImage,
            ];
        }

        if (count($images) < 1 && count($originalIndex) < 1) {
            continue;
        }
        $hidden = isset($albumHidden[$folderName]) && $albumHidden[$folderName] ? true : false;
        $albums[] = [
            'title' => isset($albumTitles[$folderName]) && is_string($albumTitles[$folderName]) && trim($albumTitles[$folderName]) !== ''
                ? sanitize_album_title($albumTitles[$folderName])
                : album_title_from_folder($folderName),
            'folder' => $folderName,
            'images' => $images,
            'hidden' => $hidden,
        ];
    }

    return $albums;
}

function sanitize_zip_name(string $key): string
{
    $safe = preg_replace('/[^0-9A-Za-z._-]+/', '-', $key);
    $safe = trim((string) $safe, '-');
    return $safe !== '' ? $safe : 'album';
}

function iter_original_images(string $folderPath): array
{
    $entries = [];
    foreach (list_files_sorted($folderPath) as $file) {
        if (is_image_name($file)) {
            $entries[] = $file;
        }
    }
    return $entries;
}

function send_download_zip(string $albumKey, string $albumsDir): void
{
    if (!class_exists('ZipArchive')) {
        send_error_text(500, 'ZipArchive extension is not enabled.');
    }

    $entries = [];
    if ($albumKey === '__all__') {
        foreach (list_subdirs($albumsDir) as $folderName) {
            $folderPath = $albumsDir . DIRECTORY_SEPARATOR . $folderName;
            foreach (iter_original_images($folderPath) as $fileName) {
                $abs = $folderPath . DIRECTORY_SEPARATOR . $fileName;
                $entries[] = [$abs, $folderName . '/' . $fileName];
            }
        }
    } else {
        $target = realpath($albumsDir . DIRECTORY_SEPARATOR . $albumKey);
        $albumsReal = realpath($albumsDir);
        if ($target === false || $albumsReal === false || !is_dir($target) || !path_starts_with($target, $albumsReal)) {
            send_error_text(404, 'Album not found.');
        }
        foreach (iter_original_images($target) as $fileName) {
            $entries[] = [$target . DIRECTORY_SEPARATOR . $fileName, $fileName];
        }
    }

    if (count($entries) === 0) {
        send_error_text(404, 'No images found.');
    }

    $tmpZip = tempnam(sys_get_temp_dir(), 'album_zip_');
    if ($tmpZip === false) {
        send_error_text(500, 'Cannot create temporary zip file.');
    }

    $zip = new ZipArchive();
    if ($zip->open($tmpZip, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
        @unlink($tmpZip);
        send_error_text(500, 'Cannot open zip archive.');
    }

    foreach ($entries as [$absPath, $nameInZip]) {
        $zip->addFile($absPath, $nameInZip);
    }
    $zip->close();

    $zipData = file_get_contents($tmpZip);
    @unlink($tmpZip);
    if ($zipData === false) {
        send_error_text(500, 'Cannot read zip archive.');
    }

    $zipName = sanitize_zip_name($albumKey) . '.zip';
    send_status(200);
    header('Content-Type: application/zip');
    header('Content-Disposition: attachment; filename="' . $zipName . '"');
    header('Content-Length: ' . strlen($zipData));
    echo $zipData;
    exit;
}

function remove_directory_tree(string $dir): void
{
    if (!is_dir($dir)) {
        return;
    }
    $items = scandir($dir);
    if ($items === false) {
        @rmdir($dir);
        return;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        $path = $dir . DIRECTORY_SEPARATOR . $item;
        if (is_dir($path)) {
            remove_directory_tree($path);
        } else {
            @unlink($path);
        }
    }
    @rmdir($dir);
}

function send_file_with_range(string $filePath, string $contentType): void
{
    if (!is_file($filePath)) {
        send_error_text(404, 'File not found.');
    }
    $size = filesize($filePath);
    if ($size === false) {
        send_error_text(500, 'Cannot read file size.');
    }

    $range = $_SERVER['HTTP_RANGE'] ?? '';
    $start = 0;
    $end = $size - 1;
    $status = 200;

    if (is_string($range) && preg_match('/bytes=([0-9]*)-([0-9]*)/i', $range, $matches)) {
        $rangeStart = $matches[1] !== '' ? (int) $matches[1] : null;
        $rangeEnd = $matches[2] !== '' ? (int) $matches[2] : null;
        if ($rangeStart !== null || $rangeEnd !== null) {
            $status = 206;
            if ($rangeStart !== null) {
                $start = max(0, $rangeStart);
            }
            if ($rangeEnd !== null) {
                $end = min($end, $rangeEnd);
            }
            if ($start > $end) {
                send_status(416);
                header('Content-Range: bytes */' . $size);
                exit;
            }
        }
    }

    $length = $end - $start + 1;
    send_status($status);
    header('Content-Type: ' . $contentType);
    header('Accept-Ranges: bytes');
    if ($status === 206) {
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $size);
    }
    header('Content-Length: ' . $length);

    $fh = fopen($filePath, 'rb');
    if ($fh === false) {
        send_error_text(500, 'Cannot open file.');
    }
    if ($start > 0) {
        fseek($fh, $start);
    }
    $chunkSize = 8192;
    $bytesLeft = $length;
    while ($bytesLeft > 0 && !feof($fh)) {
        $readSize = $bytesLeft > $chunkSize ? $chunkSize : $bytesLeft;
        $buffer = fread($fh, $readSize);
        if ($buffer === false) {
            break;
        }
        echo $buffer;
        $bytesLeft -= strlen($buffer);
        if (connection_status() !== CONNECTION_NORMAL) {
            break;
        }
    }
    fclose($fh);
    exit;
}

$requestPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$requestPath = is_string($requestPath) ? $requestPath : '/';
$requestPath = str_replace('\\', '/', $requestPath);
if ($basePath !== '' && path_starts_with($requestPath, $basePath . '/')) {
    $requestPath = substr($requestPath, strlen($basePath));
}
if ($requestPath === '') {
    $requestPath = '/';
}
$routeParam = isset($_GET['route']) ? trim((string) $_GET['route']) : '';
if (
    $routeParam !== '' &&
    ($requestPath === '/' || $requestPath === '/index.php')
) {
    $routePath = '/' . ltrim($routeParam, '/');
    $requestPath = $routePath;
}

if ($requestPath === '/index.html') {
    redirect_to(with_base($basePath, '/'));
}

if ($requestPath === '/favicon.ico') {
    redirect_to(with_base($basePath, '/resources/album-resource/favicon.svg'));
}

if ($requestPath === '/login.html') {
    redirect_to(with_base($basePath, '/login'));
}

if ($requestPath === '/login') {
    if (is_authenticated()) {
        redirect_to(with_base($basePath, '/'));
    }
    if (!is_file($loginFile)) {
        send_error_text(404, 'Login file not found.');
    }
    send_html_page($loginFile, $rootDir);
}

if (path_starts_with($requestPath, '/__audio__/')) {
    $audioDir = $rootDir . '/src/audio';
    $audioRoot = realpath($audioDir);
    $rel = substr($requestPath, strlen('/__audio__/'));
    $rel = rawurldecode($rel);
    $rel = str_replace("\0", '', $rel);
    $target = $audioDir . '/' . $rel;
    $realTarget = realpath($target);
    if ($audioRoot === false || $realTarget === false || !path_starts_with($realTarget, $audioRoot)) {
        send_error_text(404, 'Audio not found.');
    }
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mime = $finfo ? finfo_file($finfo, $realTarget) : null;
    if ($finfo) {
        finfo_close($finfo);
    }
    if (!is_string($mime) || $mime === '') {
        $mime = 'audio/mpeg';
    }
    send_file_with_range($realTarget, $mime);
}

if ($requestPath === '/__auth_status__') {
    send_json([
        'authenticated' => is_authenticated(),
        'username' => session_username(),
        'role' => session_role(),
        'login' => with_base($basePath, '/login'),
        'home' => with_base($basePath, '/'),
    ]);
}

if ($requestPath === '/__auth_login__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }

    $payload = read_json_body();
    $username = isset($_POST['username']) ? trim((string) $_POST['username']) : '';
    $password = isset($_POST['password']) ? (string) $_POST['password'] : '';
    if ($username === '' && isset($payload['username']) && is_string($payload['username'])) {
        $username = trim($payload['username']);
    }
    if ($password === '' && isset($payload['password']) && is_string($payload['password'])) {
        $password = $payload['password'];
    }

    if ($username === '' || $password === '') {
        send_json(['ok' => false, 'message' => 'Missing username or password.'], 400);
    }

    $store = load_user_store($userStoreFile);
    $users = isset($store['users']) && is_array($store['users']) ? $store['users'] : [];
    $userIndex = find_user_index_by_credentials($users, $username, $password);
    if ($userIndex < 0) {
        send_json(['ok' => false, 'message' => 'Invalid username or password.'], 401);
    }

    $loginAt = date('c');
    $tokken = bin2hex(random_bytes(24));
    $users[$userIndex]['login_at'] = $loginAt;
    $users[$userIndex]['tokken'] = $tokken;
    $store['users'] = $users;
    if (!save_user_store($userStoreFile, $store)) {
        send_json(['ok' => false, 'message' => 'Cannot persist login state.'], 500);
    }

    session_regenerate_id(true);
    $_SESSION['auth_user'] = $username;
    $_SESSION['auth_role'] = normalize_role(isset($users[$userIndex]['role']) && is_string($users[$userIndex]['role']) ? $users[$userIndex]['role'] : 'user');
    set_auth_cookie($authCookieName, $tokken, time() + $authTtlSeconds, $basePath);
    send_json(['ok' => true, 'redirect' => with_base($basePath, '/')]);
}

if ($requestPath === '/__auth_logout__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    $tokken = isset($_COOKIE[$authCookieName]) && is_string($_COOKIE[$authCookieName]) ? trim($_COOKIE[$authCookieName]) : '';
    $username = session_username();
    clear_user_tokken_by_username($userStoreFile, $username);
    clear_user_tokken_by_value($userStoreFile, $tokken);
    clear_auth_cookie($authCookieName, $basePath);
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    send_json([
        'ok' => true,
        'redirect' => with_base($basePath, '/login'),
    ]);
}

if ($requestPath === '/__upload_album__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }

    $uploadType = isset($_POST['upload_type']) && is_string($_POST['upload_type']) ? trim($_POST['upload_type']) : '';
    if ($uploadType === '' && isset($_GET['upload_type']) && is_string($_GET['upload_type'])) {
        $uploadType = trim($_GET['upload_type']);
    }
    if ($uploadType === '') {
        $uploadType = 'files';
    }
    $albumInputName = isset($_POST['album']) ? trim((string) $_POST['album']) : '';
    if ($albumInputName === '' && isset($_GET['album']) && is_string($_GET['album'])) {
        $albumInputName = trim($_GET['album']);
    }
    $albumName = trim($albumInputName);
    $detectedFolderTitle = '';
    if (isset($_FILES['files']) && is_array($_FILES['files'])) {
        $detectedFolderTitle = detect_folder_title_from_upload($_FILES['files']);
        if ($albumName === '' && $detectedFolderTitle !== '') {
            $albumName = $detectedFolderTitle;
        }
        if ($albumName === '') {
            $names = $_FILES['files']['name'] ?? [];
            if (is_array($names) && count($names) > 0) {
                $firstName = is_string($names[0]) ? basename($names[0]) : '';
            } else {
                $firstName = is_string($names) ? basename($names) : '';
            }
            if ($firstName !== '') {
                $albumName = pathinfo($firstName, PATHINFO_FILENAME);
            }
        }
    }
    if ($albumName === '' && $uploadType === 'zip' && isset($_FILES['zip_file']) && is_array($_FILES['zip_file'])) {
        $zipName = isset($_FILES['zip_file']['name']) && is_string($_FILES['zip_file']['name']) ? basename($_FILES['zip_file']['name']) : '';
        $zipStem = $zipName !== '' ? pathinfo($zipName, PATHINFO_FILENAME) : '';
        if ($zipStem !== '') {
            $albumName = $zipStem;
        }
    }
    if ($albumName === '') {
        $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
        $filesCount = 0;
        if (isset($_FILES['files']) && is_array($_FILES['files'])) {
            $namesField = $_FILES['files']['name'] ?? [];
            $filesCount = is_array($namesField) ? count($namesField) : ($namesField !== '' ? 1 : 0);
        }
        $zipName = '';
        if (isset($_FILES['zip_file']) && is_array($_FILES['zip_file'])) {
            $zipName = isset($_FILES['zip_file']['name']) ? (string) $_FILES['zip_file']['name'] : '';
        }
        $contentType = isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '';
        $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (string) $_SERVER['CONTENT_LENGTH'] : '';
        $contentLengthInt = $contentLength !== '' ? (int) $contentLength : 0;
        $postMax = parse_ini_size((string) ini_get('post_max_size'));
        $uploadMax = parse_ini_size((string) ini_get('upload_max_filesize'));
        $fileUploads = ini_get('file_uploads');
        $uploadTmp = (string) ini_get('upload_tmp_dir');
        $maxFiles = (string) ini_get('max_file_uploads');
        if ($contentLengthInt > 0 && $postMax > 0 && $contentLengthInt > $postMax) {
            append_client_log(
                $logTarget,
                'upload_album_error post_max_exceeded content_length=' . $contentLengthInt . ' post_max=' . $postMax
            );
            send_json(['ok' => false, 'message' => 'Upload failed: post_max_size exceeded.'], 400);
        }
        if ($fileUploads !== '' && strtolower($fileUploads) !== '1' && strtolower($fileUploads) !== 'on') {
            append_client_log($logTarget, 'upload_album_error file_uploads_disabled');
            send_json(['ok' => false, 'message' => 'Upload failed: file_uploads is disabled on server.'], 400);
        }
        $logLine = 'upload_album_error missing_album_name upload_type=' . $uploadType
            . ' album_input=' . ($albumInputName !== '' ? $albumInputName : 'empty')
            . ' files=' . $filesCount
            . ($zipName !== '' ? ' zip=' . $zipName : '')
            . ($contentType !== '' ? ' content_type=' . $contentType : '')
            . ($contentLength !== '' ? ' content_length=' . $contentLength : '')
            . ($postMax > 0 ? ' post_max=' . $postMax : '')
            . ($uploadMax > 0 ? ' upload_max=' . $uploadMax : '')
            . ($maxFiles !== '' ? ' max_files=' . $maxFiles : '')
            . ($uploadTmp !== '' ? ' upload_tmp=' . $uploadTmp : '');
        append_client_log($logTarget, $logLine);
        send_json(['ok' => false, 'message' => 'Missing album name.'], 400);
    }
    [$okDir, $targetDir, $albumFolder] = ensure_album_directory($albumsDir, $albumName);
    if (!$okDir || !is_string($targetDir) || $targetDir === '') {
        $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
        append_client_log(
            $logTarget,
            'upload_album_error cannot_prepare_album album=' . $albumName . ' detail=' . (is_string($albumFolder) ? $albumFolder : 'unknown')
        );
        send_json(['ok' => false, 'message' => is_string($albumFolder) ? $albumFolder : 'Cannot prepare album directory.'], 400);
    }
    $albumTitleRaw = $albumInputName !== '' ? $albumInputName : ($detectedFolderTitle !== '' ? $detectedFolderTitle : '');
    if ($albumTitleRaw === '') {
        $albumTitleRaw = $albumName !== '' ? $albumName : album_title_from_folder($albumFolder);
    }
    $albumTitle = sanitize_album_title($albumTitleRaw);
    if ($albumTitle === '') {
        $albumTitle = album_title_from_folder($albumFolder);
    }
    $saved = 0;
    $skipped = 0;

    if ($uploadType === 'zip') {
        if (!isset($_FILES['zip_file']) || !is_array($_FILES['zip_file'])) {
            $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
            append_client_log($logTarget, 'upload_album_error missing_zip_file album=' . $albumFolder);
            send_json(['ok' => false, 'message' => 'Missing zip upload.'], 400);
        }
        $zipUpload = $_FILES['zip_file'];
        $zipError = isset($zipUpload['error']) ? (int) $zipUpload['error'] : UPLOAD_ERR_NO_FILE;
        $zipTmp = isset($zipUpload['tmp_name']) && is_string($zipUpload['tmp_name']) ? $zipUpload['tmp_name'] : '';
        if ($zipError !== UPLOAD_ERR_OK || $zipTmp === '' || !is_uploaded_file($zipTmp)) {
            $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
            append_client_log($logTarget, 'upload_album_error invalid_zip_upload album=' . $albumFolder . ' error=' . $zipError);
            send_json(['ok' => false, 'message' => 'Invalid zip upload.'], 400);
        }
        if (!class_exists('ZipArchive')) {
            $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
            append_client_log($logTarget, 'upload_album_error ziparchive_missing album=' . $albumFolder);
            send_json(['ok' => false, 'message' => 'ZipArchive extension is not enabled.'], 500);
        }
        $zip = new ZipArchive();
        if ($zip->open($zipTmp) !== true) {
            $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
            append_client_log($logTarget, 'upload_album_error zip_open_failed album=' . $albumFolder);
            send_json(['ok' => false, 'message' => 'Cannot open zip file.'], 400);
        }
        for ($i = 0; $i < $zip->numFiles; $i += 1) {
            if (save_image_from_zip_stream($zip, $i, $targetDir)) {
                $saved += 1;
            } else {
                $skipped += 1;
            }
        }
        $zip->close();
    } else {
        if (!isset($_FILES['files']) || !is_array($_FILES['files'])) {
            $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
            $contentType = isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '';
            $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (string) $_SERVER['CONTENT_LENGTH'] : '';
            append_client_log(
                $logTarget,
                'upload_album_error missing_files_upload album=' . $albumFolder
                . ($contentType !== '' ? ' content_type=' . $contentType : '')
                . ($contentLength !== '' ? ' content_length=' . $contentLength : '')
            );
            send_json(['ok' => false, 'message' => 'Missing files upload.'], 400);
        }
        $files = extract_uploaded_files($_FILES['files']);
        if (count($files) === 0) {
            $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
            $contentType = isset($_SERVER['CONTENT_TYPE']) ? (string) $_SERVER['CONTENT_TYPE'] : '';
            $contentLength = isset($_SERVER['CONTENT_LENGTH']) ? (string) $_SERVER['CONTENT_LENGTH'] : '';
            append_client_log(
                $logTarget,
                'upload_album_error no_files_uploaded album=' . $albumFolder
                . ($contentType !== '' ? ' content_type=' . $contentType : '')
                . ($contentLength !== '' ? ' content_length=' . $contentLength : '')
            );
            send_json(['ok' => false, 'message' => 'No files uploaded.'], 400);
        }
        foreach ($files as $file) {
            if (save_uploaded_image_file($file, $targetDir)) {
                $saved += 1;
            } else {
                $skipped += 1;
            }
        }
    }

    if ($saved < 1) {
        $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
        append_client_log($logTarget, 'upload_album_error no_valid_images album=' . $albumFolder . ' skipped=' . $skipped);
        send_json(['ok' => false, 'message' => 'No valid image files were uploaded.'], 400);
    }

    $buildResult = queue_build_row_and_thumbs($rootDir, $buildLockFile, $buildLogFile, $albumFolder);
    $titleMap = load_album_titles($albumTitlesFile);
    if ($albumTitle !== '') {
        $titleMap[$albumFolder] = $albumTitle;
        save_album_titles($albumTitlesFile, $titleMap);
    }
    send_json([
        'ok' => true,
        'album' => $albumFolder,
        'album_title' => $albumTitle !== '' ? $albumTitle : album_title_from_folder($albumFolder),
        'saved' => $saved,
        'skipped' => $skipped,
        'build' => $buildResult,
    ]);
}

if ($requestPath === '/__upload_audio__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }
    if (!is_dir($audioDir) && !@mkdir($audioDir, 0775, true)) {
        send_json(['ok' => false, 'message' => 'Cannot prepare audio directory.'], 500);
    }
    $audioReal = realpath($audioDir);
    $rootReal = realpath($rootDir . '/src');
    if ($audioReal === false || $rootReal === false || !path_starts_with($audioReal, $rootReal)) {
        send_json(['ok' => false, 'message' => 'Invalid audio path.'], 500);
    }
    if (!isset($_FILES['files']) || !is_array($_FILES['files'])) {
        send_json(['ok' => false, 'message' => 'Missing audio upload.'], 400);
    }
    $files = extract_uploaded_files($_FILES['files']);
    if (count($files) === 0) {
        send_json(['ok' => false, 'message' => 'No files uploaded.'], 400);
    }
    $saved = 0;
    $skipped = 0;
    foreach ($files as $file) {
        if (save_uploaded_audio_file($file, $audioDir)) {
            $saved += 1;
        } else {
            $skipped += 1;
        }
    }
    if ($saved < 1) {
        send_json(['ok' => false, 'message' => 'No valid audio files were uploaded.'], 400);
    }
    send_json([
        'ok' => true,
        'saved' => $saved,
        'skipped' => $skipped,
    ]);
}

if ($requestPath === '/__list_audio__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    $order = load_audio_order($audioOrderFile);
    $files = [];
    if (is_dir($audioDir)) {
        foreach (list_files_sorted($audioDir) as $name) {
            if (is_audio_name($name)) {
                $files[] = $name;
            }
        }
    }
    if (count($order) > 0 && count($files) > 0) {
        $lookup = array_fill_keys($files, true);
        $ordered = [];
        foreach ($order as $name) {
            if (isset($lookup[$name])) {
                $ordered[] = $name;
                unset($lookup[$name]);
            }
        }
        foreach ($files as $name) {
            if (isset($lookup[$name])) {
                $ordered[] = $name;
            }
        }
        $files = $ordered;
    }
    send_json(['ok' => true, 'files' => $files]);
}

if ($requestPath === '/__list_audio_public__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'GET') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    $order = load_audio_order($audioOrderFile);
    $files = [];
    if (is_dir($audioDir)) {
        foreach (list_files_sorted($audioDir) as $name) {
            if (is_audio_name($name)) {
                $files[] = $name;
            }
        }
    }
    if (count($order) > 0 && count($files) > 0) {
        $lookup = array_fill_keys($files, true);
        $ordered = [];
        foreach ($order as $name) {
            if (isset($lookup[$name])) {
                $ordered[] = $name;
                unset($lookup[$name]);
            }
        }
        foreach ($files as $name) {
            if (isset($lookup[$name])) {
                $ordered[] = $name;
            }
        }
        $files = $ordered;
    }
    send_json(['ok' => true, 'files' => $files]);
}

if ($requestPath === '/__audio_order__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }
    $payload = read_json_body();
    $items = isset($payload['order']) && is_array($payload['order']) ? $payload['order'] : [];
    if (count($items) === 0) {
        send_json(['ok' => false, 'message' => 'Missing audio order.'], 400);
    }
    $files = [];
    if (is_dir($audioDir)) {
        foreach (list_files_sorted($audioDir) as $name) {
            if (is_audio_name($name)) {
                $files[] = $name;
            }
        }
    }
    $valid = array_fill_keys($files, true);
    $order = [];
    foreach ($items as $name) {
        if (!is_string($name)) {
            continue;
        }
        $value = basename(trim($name));
        if ($value === '' || !is_audio_name($value) || !isset($valid[$value])) {
            continue;
        }
        $order[] = $value;
    }
    if (count($order) === 0) {
        send_json(['ok' => false, 'message' => 'Invalid audio order.'], 400);
    }
    if (!save_audio_order($audioOrderFile, $order)) {
        send_json(['ok' => false, 'message' => 'Failed to save audio order.'], 500);
    }
    send_json(['ok' => true, 'saved' => count($order)]);
}

if ($requestPath === '/__delete_audio__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }
    $payload = read_json_body();
    $filename = isset($payload['file']) && is_string($payload['file']) ? basename(trim($payload['file'])) : '';
    if ($filename === '' || !is_audio_name($filename)) {
        send_json(['ok' => false, 'message' => 'Invalid file name.'], 400);
    }
    $filePath = $audioDir . DIRECTORY_SEPARATOR . $filename;
    $audioReal = is_dir($audioDir) ? realpath($audioDir) : false;
    $fileReal = $filePath !== '' && is_file($filePath) ? realpath($filePath) : false;
    if ($audioReal === false || $fileReal === false || !path_starts_with($fileReal, $audioReal)) {
        send_json(['ok' => false, 'message' => 'File not found.'], 404);
    }
    if (!@unlink($filePath)) {
        send_json(['ok' => false, 'message' => 'Failed to delete file.'], 500);
    }
    send_json(['ok' => true]);
}

if ($requestPath === '/__delete_image__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }
    $payload = read_json_body();
    $folder = isset($payload['folder']) && is_string($payload['folder']) ? sanitize_album_folder_name($payload['folder']) : '';
    $filename = isset($payload['file']) && is_string($payload['file']) ? basename(trim($payload['file'])) : '';
    if ($folder === '' || $filename === '' || !is_image_name($filename)) {
        send_json(['ok' => false, 'message' => 'Invalid image payload.'], 400);
    }
    $albumDir = $albumsDir . DIRECTORY_SEPARATOR . $folder;
    if (!is_dir($albumDir)) {
        send_json(['ok' => false, 'message' => 'Album not found.'], 404);
    }
    $target = $albumDir . DIRECTORY_SEPARATOR . $filename;
    $albumReal = realpath($albumDir);
    $targetReal = is_file($target) ? realpath($target) : false;
    if ($albumReal === false || $targetReal === false || !path_starts_with($targetReal, $albumReal)) {
        send_json(['ok' => false, 'message' => 'Image not found.'], 404);
    }
    if (!@unlink($targetReal)) {
        send_json(['ok' => false, 'message' => 'Failed to delete image.'], 500);
    }
    $stem = pathinfo($filename, PATHINFO_FILENAME);
    $rowFolder = $rowDir . DIRECTORY_SEPARATOR . $folder;
    $thumbFolder = $thumbsDir . DIRECTORY_SEPARATOR . $folder;
    if ($stem !== '') {
        if (is_dir($rowFolder)) {
            foreach (list_files_sorted($rowFolder) as $name) {
                if (!is_image_name($name)) {
                    continue;
                }
                if (pathinfo($name, PATHINFO_FILENAME) === $stem) {
                    @unlink($rowFolder . DIRECTORY_SEPARATOR . $name);
                }
            }
        }
        if (is_dir($thumbFolder)) {
            foreach (list_files_sorted($thumbFolder) as $name) {
                if (!is_image_name($name)) {
                    continue;
                }
                if (pathinfo($name, PATHINFO_FILENAME) === $stem) {
                    @unlink($thumbFolder . DIRECTORY_SEPARATOR . $name);
                }
            }
        }
    }
    $hiddenImagesMap = load_album_hidden_images($albumHiddenImagesFile);
    if (isset($hiddenImagesMap[$folder])) {
        $stemKey = image_stem_key_from_filename($filename);
        if ($stemKey !== '' && isset($hiddenImagesMap[$folder][$stemKey])) {
            unset($hiddenImagesMap[$folder][$stemKey]);
            if (count($hiddenImagesMap[$folder]) < 1) {
                unset($hiddenImagesMap[$folder]);
            }
            save_album_hidden_images($albumHiddenImagesFile, $hiddenImagesMap);
        }
    }
    send_json(['ok' => true]);
}

if ($requestPath === '/__build_status__') {
    send_json(build_status($buildLockFile));
}

if ($requestPath === '/__client_error__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    $payload = read_json_body();
    $code = isset($payload['code']) ? (int) $payload['code'] : 0;
    $route = isset($payload['route']) && is_string($payload['route']) ? trim($payload['route']) : '';
    $detail = isset($payload['detail']) && is_string($payload['detail']) ? trim($payload['detail']) : '';
    $path = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
    $message = 'client_error code=' . $code
        . ' route=' . $route
        . ' path=' . $path
        . ($detail !== '' ? ' detail=' . $detail : '');
    $logTarget = resolve_client_log_file($clientLogFile, $clientLogFallbackFile);
    append_client_log($logTarget, $message);
    send_json(['ok' => true]);
}

if ($requestPath === '/__rebuild_album__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }

    $payload = read_json_body();
    $album = isset($payload['album']) && is_string($payload['album']) ? trim($payload['album']) : '';
    $album = sanitize_album_folder_name($album);
    if ($album === '') {
        send_json(['ok' => false, 'message' => 'Missing album name.'], 400);
    }
    $albumDir = $albumsDir . DIRECTORY_SEPARATOR . $album;
    if (!is_dir($albumDir)) {
        send_json(['ok' => false, 'message' => 'Album not found.'], 404);
    }

    $buildResult = queue_build_row_and_thumbs($rootDir, $buildLockFile, $buildLogFile, $album);
    if (!($buildResult['ok'] ?? false)) {
        send_json([
            'ok' => false,
            'album' => $album,
            'message' => isset($buildResult['message']) && is_string($buildResult['message']) ? $buildResult['message'] : 'Failed to queue rebuild.',
            'build' => $buildResult,
        ], 500);
    }
    send_json([
        'ok' => true,
        'album' => $album,
        'build' => $buildResult,
    ]);
}

if ($requestPath === '/__delete_album__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }

    $payload = read_json_body();
    $album = isset($payload['album']) && is_string($payload['album']) ? trim($payload['album']) : '';
    $album = sanitize_album_folder_name($album);
    if ($album === '') {
        send_json(['ok' => false, 'message' => 'Missing album name.'], 400);
    }

    $baseReal = realpath($albumsDir);
    if ($baseReal === false) {
        send_json(['ok' => false, 'message' => 'Albums directory not found.'], 404);
    }
    $target = $albumsDir . DIRECTORY_SEPARATOR . $album;
    $targetReal = realpath($target);
    if ($targetReal === false || !is_dir($targetReal) || !path_starts_with($targetReal, $baseReal)) {
        send_json(['ok' => false, 'message' => 'Album not found.'], 404);
    }

    remove_directory_tree($targetReal);
    remove_directory_tree($rowDir . DIRECTORY_SEPARATOR . $album);
    remove_directory_tree($thumbsDir . DIRECTORY_SEPARATOR . $album);
    $titleMap = load_album_titles($albumTitlesFile);
    if (isset($titleMap[$album])) {
        unset($titleMap[$album]);
        save_album_titles($albumTitlesFile, $titleMap);
    }
    $hiddenMap = load_album_hidden($albumHiddenFile);
    if (isset($hiddenMap[$album])) {
        unset($hiddenMap[$album]);
        save_album_hidden($albumHiddenFile, $hiddenMap);
    }
    $hiddenImagesMap = load_album_hidden_images($albumHiddenImagesFile);
    if (isset($hiddenImagesMap[$album])) {
        unset($hiddenImagesMap[$album]);
        save_album_hidden_images($albumHiddenImagesFile, $hiddenImagesMap);
    }

    send_json(['ok' => true, 'album' => $album]);
}

if ($requestPath === '/__edit_page_save__') {
    if (strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        send_json(['ok' => false, 'message' => 'Method not allowed.'], 405);
    }
    if (!is_authenticated()) {
        send_json(['ok' => false, 'message' => 'Unauthorized.'], 401);
    }
    if (!is_admin()) {
        send_json(['ok' => false, 'message' => 'Forbidden. Admin role required.'], 403);
    }

    $payload = read_json_body();
    $albumTitles = isset($payload['album_titles']) && is_array($payload['album_titles']) ? $payload['album_titles'] : [];
    $imageNames = isset($payload['image_names']) && is_array($payload['image_names']) ? $payload['image_names'] : [];
    $hiddenAlbums = isset($payload['hidden_albums']) && is_array($payload['hidden_albums']) ? $payload['hidden_albums'] : [];
    $hiddenImages = isset($payload['hidden_images']) && is_array($payload['hidden_images']) ? $payload['hidden_images'] : [];

    $titleMap = load_album_titles($albumTitlesFile);
    $updatedAlbums = 0;
    foreach ($albumTitles as $item) {
        if (!is_array($item)) {
            continue;
        }
        $folder = isset($item['folder']) && is_string($item['folder']) ? sanitize_album_folder_name($item['folder']) : '';
        $title = isset($item['title']) && is_string($item['title']) ? sanitize_album_title($item['title']) : '';
        if ($folder === '' || $title === '') {
            continue;
        }
        $titleMap[$folder] = $title;
        $updatedAlbums += 1;
    }
    if ($updatedAlbums > 0) {
        save_album_titles($albumTitlesFile, $titleMap);
    }

    $hiddenMap = load_album_hidden($albumHiddenFile);
    $hiddenUpdated = 0;
    foreach ($hiddenAlbums as $item) {
        if (!is_array($item)) {
            continue;
        }
        $folder = isset($item['folder']) && is_string($item['folder']) ? sanitize_album_folder_name($item['folder']) : '';
        if ($folder === '') {
            continue;
        }
        $hidden = isset($item['hidden']) ? (bool) $item['hidden'] : false;
        if ($hidden) {
            if (!isset($hiddenMap[$folder])) {
                $hiddenMap[$folder] = true;
                $hiddenUpdated += 1;
            }
        } else {
            if (isset($hiddenMap[$folder])) {
                unset($hiddenMap[$folder]);
                $hiddenUpdated += 1;
            }
        }
    }
    if ($hiddenUpdated > 0) {
        save_album_hidden($albumHiddenFile, $hiddenMap);
    }

    $hiddenImagesMap = load_album_hidden_images($albumHiddenImagesFile);
    $hiddenImagesUpdated = 0;
    foreach ($hiddenImages as $item) {
        if (!is_array($item)) {
            continue;
        }
        $folder = isset($item['folder']) && is_string($item['folder']) ? sanitize_album_folder_name($item['folder']) : '';
        $stem = isset($item['stem']) && is_string($item['stem']) ? image_stem_key_from_stem($item['stem']) : '';
        if ($folder === '' || $stem === '') {
            continue;
        }
        $hidden = isset($item['hidden']) ? (bool) $item['hidden'] : false;
        if ($hidden) {
            if (!isset($hiddenImagesMap[$folder])) {
                $hiddenImagesMap[$folder] = [];
            }
            if (!isset($hiddenImagesMap[$folder][$stem])) {
                $hiddenImagesMap[$folder][$stem] = true;
                $hiddenImagesUpdated += 1;
            }
        } else {
            if (isset($hiddenImagesMap[$folder]) && isset($hiddenImagesMap[$folder][$stem])) {
                unset($hiddenImagesMap[$folder][$stem]);
                $hiddenImagesUpdated += 1;
                if (count($hiddenImagesMap[$folder]) < 1) {
                    unset($hiddenImagesMap[$folder]);
                }
            }
        }
    }

    $renamedImages = 0;
    $errors = [];
    foreach ($imageNames as $item) {
        if (!is_array($item)) {
            continue;
        }
        $folder = isset($item['folder']) && is_string($item['folder']) ? (string) $item['folder'] : '';
        $oldName = isset($item['old_name']) && is_string($item['old_name']) ? (string) $item['old_name'] : '';
        $newStem = isset($item['new_stem']) && is_string($item['new_stem']) ? (string) $item['new_stem'] : '';
        if ($folder === '' || $oldName === '' || trim($newStem) === '') {
            continue;
        }
        if (rename_album_image_files($albumsDir, $rowDir, $thumbsDir, $folder, $oldName, $newStem)) {
            $renamedImages += 1;
            $oldStemKey = image_stem_key_from_filename($oldName);
            $newStemKey = image_stem_key_from_stem($newStem);
            if ($oldStemKey !== '' && $newStemKey !== '' && isset($hiddenImagesMap[$folder]) && isset($hiddenImagesMap[$folder][$oldStemKey])) {
                unset($hiddenImagesMap[$folder][$oldStemKey]);
                $hiddenImagesMap[$folder][$newStemKey] = true;
                $hiddenImagesUpdated += 1;
            }
        } else {
            $errors[] = [
                'folder' => sanitize_album_folder_name($folder),
                'old_name' => basename($oldName),
            ];
        }
    }

    if ($errors) {
        send_json([
            'ok' => false,
            'message' => 'Some files could not be renamed.',
            'updated_albums' => $updatedAlbums,
            'renamed_images' => $renamedImages,
            'errors' => $errors,
        ], 400);
    }

    if ($hiddenImagesUpdated > 0) {
        save_album_hidden_images($albumHiddenImagesFile, $hiddenImagesMap);
    }

    send_json([
        'ok' => true,
        'updated_albums' => $updatedAlbums,
        'renamed_images' => $renamedImages,
    ]);
}

if ($requestPath === '/__albums__') {
    $titleMap = load_album_titles($albumTitlesFile);
    $hiddenMap = load_album_hidden($albumHiddenFile);
    $hiddenImagesMap = load_album_hidden_images($albumHiddenImagesFile);
    send_json(['albums' => build_albums($albumsDir, $rowDir, $thumbsDir, $titleMap, $hiddenMap, $hiddenImagesMap)]);
}

if ($requestPath === '/__download__') {
    $albumKey = isset($_GET['album']) ? trim((string) $_GET['album']) : '';
    if ($albumKey === '') {
        send_error_text(400, 'Missing album query parameter.');
    }
    send_download_zip($albumKey, $albumsDir);
}

if ($requestPath === '/' || $requestPath === '/index.php' || str_ends_with_compat($requestPath, '.html')) {
    if (!is_file($viewerFile)) {
        send_error_text(404, 'Viewer file not found.');
    }
    if ($requestPath !== '/' && $requestPath !== '/index.php') {
        redirect_to(with_base($basePath, '/'));
    }
    send_html_page($viewerFile, $rootDir);
}

send_error_text(404, 'Not Found');
