<?php
namespace App;

use App\Http\Request;
use App\Http\Response;

final class Router
{
    /** @var array<int, array{methods: string[], pattern: string, handler: callable}> */
    private array $routes = [];

    private string $prefix = '';

    public function add(array $methods, string $pattern, callable $handler): void
    {
        $this->routes[] = [
            'methods' => array_map('strtoupper', $methods),
            'pattern' => $this->join($this->prefix, $pattern),
            'handler' => $handler,
        ];
    }

    /**
     * chi の r.Route("/api", ...) 相当。プレフィックス配下にルートをまとめる。
     *
     * @param callable(self): void $routes
     */
    public function group(string $prefix, callable $routes): void
    {
        $previous = $this->prefix;
        $this->prefix = $this->join($previous, $prefix);
        $routes($this);
        $this->prefix = $previous;
    }

    public function get(string $pattern, callable $handler): void
    {
        $this->add(['GET'], $pattern, $handler);
    }

    public function post(string $pattern, callable $handler): void
    {
        $this->add(['POST'], $pattern, $handler);
    }

    public function put(string $pattern, callable $handler): void
    {
        $this->add(['PUT'], $pattern, $handler);
    }

    public function delete(string $pattern, callable $handler): void
    {
        $this->add(['DELETE'], $pattern, $handler);
    }

    private function join(string $prefix, string $path): string
    {
        if ($path === '' || $path === '/') {
            if ($prefix === '') {
                return '/';
            }
            $trimmed = rtrim($prefix, '/');
            return $trimmed === '' ? '/' : $trimmed;
        }

        return rtrim($prefix, '/') . '/' . ltrim($path, '/');
    }

    public function dispatch(Request $request): void
    {
        foreach ($this->routes as $route) {
            if (!in_array($request->method, $route['methods'], true)) {
                continue;
            }

            $regex = preg_replace('#\{([a-zA-Z_]+)\}#', '(?P<$1>[^/]+)', $route['pattern']);
            $regex = '#^' . $regex . '$#';

            if (!preg_match($regex, $request->path, $matches)) {
                continue;
            }

            $params = array_filter(
                $matches,
                static fn ($key) => !is_int($key),
                ARRAY_FILTER_USE_KEY
            );

            ($route['handler'])($request, $params);
            return;
        }

        Response::error('Not Found', 404);
    }
}
