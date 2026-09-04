<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Local development uses backend/.env. Docker-provided environment variables
// take precedence because createUnsafeImmutable() does not overwrite them.
// The unsafe variant is required because this application reads settings via getenv().
Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__))->safeLoad();

use App\Config\Database;
use App\Controllers\EventController;
use App\Controllers\ScheduleSuggestionController;
use App\Http\Request;
use App\Http\Response;
use App\Router;

header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 86400 * 7,
        'path' => '/',
        'secure' => false,
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    session_start();
}

$request = Request::fromGlobals();
$router = new Router();
$events = new EventController();
$scheduleSuggestions = new ScheduleSuggestionController();

$router->get('/', static function () {
    $dbStatus = 'ok';
    $errorMessage = null;

    try {
        Database::getConnection();
    } catch (\Throwable $e) {
        $dbStatus = 'error';
        $errorMessage = $e->getMessage();
    }

    Response::json([
        'service' => 'ScheduleFitter API',
        'php' => PHP_VERSION,
        'database' => $dbStatus,
        'error' => $errorMessage,
    ]);
});

$router->group('/api', function (Router $api) use ($events, $scheduleSuggestions) {
    $api->post('/schedule-suggestions', [$scheduleSuggestions, 'create']);

    $api->group('/events', function (Router $r) use ($events) {
        $r->get('/', [$events, 'index']);
        $r->get('/{id}', [$events, 'show']);
        $r->post('/', [$events, 'store']);
        $r->put('/{id}', [$events, 'update']);
        $r->delete('/{id}', [$events, 'destroy']);
    });
});

try {
    $router->dispatch($request);
} catch (\Throwable $e) {
    Response::error('Internal Server Error', 500, ['detail' => $e->getMessage()]);
}
