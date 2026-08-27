<?php
require_once __DIR__ . '/../vendor/autoload.php';

// Local development uses backend/.env. Docker-provided environment variables
// take precedence because createUnsafeImmutable() does not overwrite them.
// The unsafe variant is required because this application reads settings via getenv().
Dotenv\Dotenv::createUnsafeImmutable(dirname(__DIR__))->safeLoad();

use App\Config\Database;
use App\Controllers\EventController;
use App\Http\Request;
use App\Http\Response;
use App\Router;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-User-Id');

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$request = Request::fromGlobals();
$router = new Router();
$events = new EventController();

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

$router->group('/api', function (Router $api) use ($events) {
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
