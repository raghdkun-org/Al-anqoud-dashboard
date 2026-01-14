# Laravel Backend Integration Guide

Complete guide for integrating the B-Dashboard frontend with a Laravel backend, including AI/agent capabilities.

---

## Table of Contents

- [Overview](#overview)
- [Project Setup](#project-setup)
- [Database Models & Migrations](#database-models--migrations)
- [Authentication](#authentication)
- [API Endpoints](#api-endpoints)
- [Theme System](#theme-system)
- [Dashboard Personalization](#dashboard-personalization)
- [User Preferences](#user-preferences)
- [Widget Data & Caching](#widget-data--caching)
- [AI/Agent Integration](#aiagent-integration)
- [Testing & Deployment](#testing--deployment)

---

## Overview

### Laravel Stack Recommendations

```
Framework: Laravel 11+
API: Laravel REST API (built-in)
Authentication: Laravel Sanctum or Passport
Database: PostgreSQL (recommended) or MySQL
Queue System: Redis + Laravel Queue
WebSockets: Laravel Reverb or Laravel WebSockets
AI Integration: OpenAI PHP, LangChain, custom agents
Caching: Redis
Testing: Pest or PHPUnit
```

### Architecture

```
┌──────────────────────────────────────────┐
│   B-Dashboard (Next.js Frontend)         │
└──────────────────────────────────────────┘
                    │
                    │ HTTP/WebSocket
                    ↓
┌──────────────────────────────────────────┐
│   Laravel REST API                       │
├──────────────────────────────────────────┤
│  • Sanctum Token Authentication          │
│  • User Management & Authorization       │
│  • Theme/Preference Management           │
│  • Widget Data & Caching                 │
│  • AI Agent Endpoints                    │
│  • Real-time Events (Reverb)            │
└──────────────────────────────────────────┘
                    │
                    ↓
┌──────────────────────────────────────────┐
│   PostgreSQL/MySQL Database              │
└──────────────────────────────────────────┘
                    ↑
                    │
┌──────────────────────────────────────────┐
│   Redis Cache & Queue                    │
└──────────────────────────────────────────┘
```

---

## Project Setup

### 1. Create Laravel Project

```bash
# Create new Laravel project
composer create-project laravel/laravel dashboard-api

cd dashboard-api

# Install required packages
composer require laravel/sanctum
composer require laravel/reverb
composer require openai-php/client
composer require predis/predis

# Publish configuration
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan vendor:publish --provider="Laravel\Reverb\ReverbServiceProvider"
```

### 2. Environment Configuration

Create `.env` file:

```env
APP_NAME="B-Dashboard API"
APP_ENV=local
APP_KEY=base64:YourAppKeyHere
APP_DEBUG=true
APP_URL=http://localhost:8000

FRONTEND_URL=http://localhost:3000

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=b_dashboard
DB_USERNAME=postgres
DB_PASSWORD=password

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=your_username
MAIL_PASSWORD=your_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@dashboard.test

# Sanctum
SANCTUM_STATEFUL_DOMAINS=localhost:3000,localhost:8000
SESSION_DOMAIN=localhost

# AI Configuration
OPENAI_API_KEY=sk-your-key-here
OPENAI_ORG_ID=your-org-id

# Reverb (WebSocket)
REVERB_APP_ID=your-app-id
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST=localhost
REVERB_PORT=8080
```

### 3. Config Setup

Update `config/cors.php`:

```php
'allowed_origins' => [
    env('FRONTEND_URL', 'http://localhost:3000'),
    'http://localhost:3000',
    'http://localhost:3001',
],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'exposed_headers' => [],
'max_age' => 0,
'supports_credentials' => true,
```

Update `config/sanctum.php`:

```php
'stateful' => explode(',', env(
    'SANCTUM_STATEFUL_DOMAINS',
    'localhost,localhost:3000,localhost:3001'
)),

'middleware' => [
    'verify_csrf_token' => App\Http\Middleware\VerifyCsrfToken::class,
    'encrypt_cookies' => App\Http\Middleware\EncryptCookies::class,
],
```

---

## Database Models & Migrations

### 1. User Model Migration

```php
// database/migrations/2024_01_01_000000_create_users_table.php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('avatar')->nullable();
            $table->enum('role', ['admin', 'editor', 'user'])->default('user');
            $table->enum('status', ['active', 'inactive', 'pending'])->default('pending');
            
            // Preferences
            $table->string('preferred_locale', 5)->default('en');
            $table->enum('theme_mode', ['light', 'dark', 'system'])->default('system');
            $table->boolean('sidebar_collapsed')->default(false);
            
            $table->rememberToken();
            $table->timestamps();
            
            $table->index('email');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
```

### 2. Theme Model Migration

```php
// database/migrations/2024_01_01_000001_create_themes_table.php
return new class extends Migration {
    public function up(): void
    {
        Schema::create('themes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('name');
            $table->text('description')->nullable();
            $table->enum('color_mode', ['light', 'dark']);
            $table->json('colors');
            $table->string('border_radius')->default('0.5rem');
            $table->boolean('is_active')->default(false);
            $table->boolean('is_default')->default(false);
            $table->boolean('is_system')->default(false);
            $table->timestamps();
            
            $table->unique(['user_id', 'name']);
            $table->index(['user_id', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('themes');
    }
};
```

### 3. Models

```php
// app/Models/User.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'avatar',
        'preferred_locale',
        'theme_mode',
        'sidebar_collapsed',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function themes()
    {
        return $this->hasMany(Theme::class);
    }

    public function dashboardViews()
    {
        return $this->hasMany(DashboardView::class);
    }

    public function preferences()
    {
        return $this->hasOne(UserPreferences::class);
    }

    public function aiAgents()
    {
        return $this->hasMany(AIAgent::class);
    }

    public function getActiveTheme()
    {
        return $this->themes()->where('is_active', true)->first();
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isEditor(): bool
    {
        return in_array($this->role, ['admin', 'editor']);
    }
}
```

```php
// app/Models/Theme.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Theme extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'color_mode',
        'colors',
        'border_radius',
        'is_active',
        'is_default',
        'is_system',
    ];

    protected function casts(): array
    {
        return [
            'colors' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::saved(function ($model) {
            if ($model->is_active) {
                // Only one active theme per user
                $model->user
                    ->themes()
                    ->where('id', '!=', $model->id)
                    ->update(['is_active' => false]);
                
                // Clear cache
                Cache::forget("user_{$model->user_id}_active_theme");
            }
        });
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeSystem($query)
    {
        return $query->where('is_system', true);
    }
}
```

```php
// app/Models/DashboardView.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DashboardView extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'widgets_config',
        'is_default',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'widgets_config' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    protected static function booted()
    {
        static::saved(function ($model) {
            if ($model->is_active) {
                $model->user
                    ->dashboardViews()
                    ->where('id', '!=', $model->id)
                    ->update(['is_active' => false]);
            }
        });
    }
}
```

```php
// app/Models/UserPreferences.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserPreferences extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'locale',
        'theme_mode',
        'active_theme_id',
        'sidebar_collapsed',
        'active_dashboard_view',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public static function forUser(User $user)
    {
        return $user->preferences()->firstOrCreate(
            ['user_id' => $user->id],
            [
                'locale' => 'en',
                'theme_mode' => 'system',
            ]
        );
    }
}
```

---

## Authentication

### 1. Auth Controller

```php
// app/Http/Controllers/Api/AuthController.php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => 'pending',
        ]);

        return response()->json([
            'user' => $user,
            'message' => 'User registered successfully',
        ], 201);
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke all existing tokens
        $user->tokens()->delete();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logout successful']);
    }

    public function refresh(Request $request)
    {
        $user = $request->user();
        $user->tokens()->delete();
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json(['token' => $token]);
    }
}
```

### 2. Auth Routes

```php
// routes/api.php
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
});
```

---

## API Endpoints

### 1. Theme Endpoints

```php
// app/Http/Controllers/Api/ThemeController.php
namespace App\Http\Controllers\Api;

use App\Models\Theme;
use Illuminate\Http\Request;
use App\Http\Resources\ThemeResource;

class ThemeController extends Controller
{
    public function index(Request $request)
    {
        $themes = $request->user()->themes()->get();
        return ThemeResource::collection($themes);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:themes,name,NULL,id,user_id,' . $request->user()->id,
            'description' => 'string|nullable',
            'color_mode' => 'required|in:light,dark',
            'colors' => 'required|array',
            'border_radius' => 'string|max:50',
        ]);

        $theme = $request->user()->themes()->create($validated);

        return new ThemeResource($theme);
    }

    public function show(Theme $theme)
    {
        $this->authorize('view', $theme);
        return new ThemeResource($theme);
    }

    public function update(Request $request, Theme $theme)
    {
        $this->authorize('update', $theme);

        $validated = $request->validate([
            'name' => 'string|max:100|unique:themes,name,' . $theme->id . ',id,user_id,' . $request->user()->id,
            'description' => 'string|nullable',
            'color_mode' => 'in:light,dark',
            'colors' => 'array',
            'border_radius' => 'string|max:50',
        ]);

        $theme->update($validated);

        return new ThemeResource($theme);
    }

    public function destroy(Theme $theme)
    {
        $this->authorize('delete', $theme);
        $theme->delete();

        return response()->json(['message' => 'Theme deleted successfully']);
    }

    public function active(Request $request)
    {
        $theme = $request->user()->themes()->active()->first();

        if (!$theme) {
            return response()->json(['message' => 'No active theme'], 404);
        }

        return new ThemeResource($theme);
    }

    public function setActive(Request $request, Theme $theme)
    {
        $this->authorize('update', $theme);

        $theme->update(['is_active' => true]);

        return new ThemeResource($theme);
    }

    public function export(Theme $theme)
    {
        $this->authorize('view', $theme);

        return response()->json([
            'name' => $theme->name,
            'description' => $theme->description,
            'color_mode' => $theme->color_mode,
            'colors' => $theme->colors,
            'border_radius' => $theme->border_radius,
        ]);
    }

    public function import(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'string|nullable',
            'color_mode' => 'required|in:light,dark',
            'colors' => 'required|array',
            'border_radius' => 'string|max:50',
        ]);

        $theme = $request->user()->themes()->create($validated);

        return new ThemeResource($theme);
    }
}
```

```php
// routes/api.php
Route::middleware('auth:sanctum')->group(function () {
    Route::apiResource('themes', ThemeController::class);
    Route::get('themes/active', [ThemeController::class, 'active']);
    Route::post('themes/{theme}/set-active', [ThemeController::class, 'setActive']);
    Route::get('themes/{theme}/export', [ThemeController::class, 'export']);
    Route::post('themes/import', [ThemeController::class, 'import']);
});
```

### 2. Dashboard Endpoints

```php
// app/Http/Controllers/Api/DashboardController.php
namespace App\Http\Controllers\Api;

use App\Models\DashboardView;
use App\Models\UserPreferences;
use Illuminate\Http\Request;
use App\Http\Resources\DashboardViewResource;

class DashboardController extends Controller
{
    public function views(Request $request)
    {
        $views = $request->user()->dashboardViews()->get();
        return DashboardViewResource::collection($views);
    }

    public function storeView(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:dashboard_views,name,NULL,id,user_id,' . $request->user()->id,
            'description' => 'string|nullable',
            'widgets_config' => 'array|nullable',
            'is_default' => 'boolean',
        ]);

        $view = $request->user()->dashboardViews()->create($validated);

        return new DashboardViewResource($view);
    }

    public function setActiveView(Request $request, DashboardView $view)
    {
        $this->authorize('update', $view);
        $view->update(['is_active' => true]);

        return new DashboardViewResource($view);
    }

    public function getPreferences(Request $request)
    {
        $preferences = UserPreferences::forUser($request->user());
        return response()->json($preferences);
    }

    public function updatePreferences(Request $request)
    {
        $validated = $request->validate([
            'locale' => 'string|max:5',
            'theme_mode' => 'in:light,dark,system',
            'active_theme_id' => 'string|nullable',
            'sidebar_collapsed' => 'boolean',
            'active_dashboard_view' => 'string|nullable',
        ]);

        $preferences = UserPreferences::forUser($request->user());
        $preferences->update($validated);

        return response()->json($preferences);
    }
}
```

---

## Widget Data & Caching

### 1. Widget Model

```php
// app/Models/Widget.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Widget extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'type',
        'description',
        'config_schema',
        'is_public',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'config_schema' => 'array',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function data()
    {
        return $this->hasMany(WidgetData::class);
    }
}

class WidgetData extends Model
{
    use HasFactory;

    protected $fillable = [
        'widget_id',
        'user_id',
        'data',
        'cache_ttl',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
        ];
    }

    public function widget()
    {
        return $this->belongsTo(Widget::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isCacheValid(): bool
    {
        return $this->updated_at->addSeconds($this->cache_ttl)->isFuture();
    }
}
```

### 2. Widget Controller

```php
// app/Http/Controllers/Api/WidgetController.php
namespace App\Http\Controllers\Api;

use App\Models\Widget;
use App\Models\WidgetData;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class WidgetController extends Controller
{
    public function index(Request $request)
    {
        $widgets = Widget::where('is_public', true)
            ->orWhere('created_by', $request->user()->id)
            ->get();

        return response()->json($widgets);
    }

    public function data(Request $request, Widget $widget)
    {
        $cacheKey = "widget_data_{$widget->id}_{$request->user()->id}";

        // Try to get from cache
        $data = Cache::get($cacheKey);

        if (!$data) {
            $widgetData = WidgetData::where('widget_id', $widget->id)
                ->where('user_id', $request->user()->id)
                ->first();

            if ($widgetData && $widgetData->isCacheValid()) {
                $data = $widgetData->data;
                Cache::put($cacheKey, $data, $widgetData->cache_ttl);
            } else {
                return response()->json(['data' => [], 'message' => 'No data available']);
            }
        }

        return response()->json(['data' => $data]);
    }

    public function refresh(Request $request, Widget $widget)
    {
        $cacheKey = "widget_data_{$widget->id}_{$request->user()->id}";
        Cache::forget($cacheKey);

        // Dispatch job to refresh data
        // dispatch(new RefreshWidgetData($widget, $request->user()));

        return response()->json(['message' => 'Widget data refresh triggered']);
    }
}
```

---

## AI/Agent Integration

### 1. AI Agent Model

```php
// app/Models/AIAgent.php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AIAgent extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'name',
        'description',
        'agent_type',
        'system_prompt',
        'model',
        'temperature',
        'max_tokens',
        'available_tools',
        'status',
        'total_interactions',
        'last_used',
    ];

    protected function casts(): array
    {
        return [
            'available_tools' => 'array',
            'last_used' => 'datetime',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function conversations()
    {
        return $this->hasMany(AgentConversation::class);
    }
}

class AgentConversation extends Model
{
    use HasFactory;

    protected $fillable = [
        'agent_id',
        'user_id',
        'title',
        'messages',
        'total_tokens_used',
        'total_cost',
    ];

    protected function casts(): array
    {
        return [
            'messages' => 'array',
            'total_cost' => 'decimal:4',
        ];
    }

    public function agent()
    {
        return $this->belongsTo(AIAgent::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
```

### 2. AI Agent Service

```php
// app/Services/AIAgentService.php
namespace App\Services;

use App\Models\AIAgent;
use App\Models\AgentConversation;
use OpenAI\Client;
use Illuminate\Support\Facades\Log;

class AIAgentService
{
    protected Client $client;
    protected AIAgent $agent;

    public function __construct(AIAgent $agent)
    {
        $this->agent = $agent;
        $this->client = \OpenAI::client(config('services.openai.api_key'));
    }

    public function sendMessage(AgentConversation $conversation, string $userMessage): array
    {
        try {
            // Build message history
            $messages = [
                [
                    'role' => 'system',
                    'content' => $this->agent->system_prompt,
                ],
            ];

            // Add conversation history
            foreach ($conversation->messages as $msg) {
                $messages[] = [
                    'role' => $msg['role'],
                    'content' => $msg['content'],
                ];
            }

            // Add new user message
            $messages[] = [
                'role' => 'user',
                'content' => $userMessage,
            ];

            // Get AI response
            $response = $this->client->chat()->create([
                'model' => $this->agent->model,
                'messages' => $messages,
                'temperature' => $this->agent->temperature,
                'max_tokens' => $this->agent->max_tokens,
            ]);

            $aiResponse = $response->choices[0]->message->content;
            $tokensUsed = $response->usage->totalTokens;

            // Update conversation
            $messages = $conversation->messages ?? [];
            $messages[] = [
                'role' => 'user',
                'content' => $userMessage,
                'timestamp' => now()->toIso8601String(),
            ];
            $messages[] = [
                'role' => 'assistant',
                'content' => $aiResponse,
                'timestamp' => now()->toIso8601String(),
            ];

            $conversation->update([
                'messages' => $messages,
                'total_tokens_used' => $conversation->total_tokens_used + $tokensUsed,
            ]);

            // Update agent statistics
            $this->agent->increment('total_interactions');
            $this->agent->update(['last_used' => now()]);

            return [
                'response' => $aiResponse,
                'tokens_used' => $tokensUsed,
                'conversation_id' => $conversation->id,
            ];
        } catch (\Exception $e) {
            Log::error('AI Agent Error', ['error' => $e->getMessage()]);
            return [
                'error' => $e->getMessage(),
                'response' => null,
            ];
        }
    }

    public function getAvailableTools(): array
    {
        $toolsMap = [
            'search' => 'Search functionality',
            'analysis' => 'Data analysis',
            'reporting' => 'Report generation',
            'automation' => 'Task automation',
        ];

        return array_map(
            fn($tool) => [
                'name' => $tool,
                'description' => $toolsMap[$tool] ?? 'Unknown',
            ],
            $this->agent->available_tools ?? []
        );
    }
}
```

### 3. AI Agent Controller

```php
// app/Http/Controllers/Api/AIAgentController.php
namespace App\Http\Controllers\Api;

use App\Models\AIAgent;
use App\Models\AgentConversation;
use App\Services\AIAgentService;
use Illuminate\Http\Request;

class AIAgentController extends Controller
{
    public function index(Request $request)
    {
        $agents = $request->user()->aiAgents()->get();
        return response()->json($agents);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'description' => 'string|nullable',
            'agent_type' => 'required|in:assistant,analyst,optimizer,custom',
            'system_prompt' => 'required|string',
            'model' => 'string|default:gpt-4',
            'temperature' => 'numeric|between:0,1|default:0.7',
            'max_tokens' => 'integer|default:2000',
            'available_tools' => 'array|nullable',
        ]);

        $agent = $request->user()->aiAgents()->create($validated);

        return response()->json($agent, 201);
    }

    public function chat(Request $request, AIAgent $agent)
    {
        $this->authorize('update', $agent);

        $validated = $request->validate([
            'message' => 'required|string',
            'conversation_id' => 'integer|nullable',
        ]);

        try {
            // Get or create conversation
            if ($validated['conversation_id'] ?? null) {
                $conversation = AgentConversation::findOrFail($validated['conversation_id']);
                $this->authorize('update', $conversation);
            } else {
                $conversation = $agent->conversations()->create([
                    'user_id' => $request->user()->id,
                    'title' => $agent->name . ' - ' . now()->format('Y-m-d H:i'),
                ]);
            }

            // Get AI response
            $service = new AIAgentService($agent);
            $result = $service->sendMessage($conversation, $validated['message']);

            if (isset($result['error'])) {
                return response()->json($result, 400);
            }

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function conversations(Request $request, AIAgent $agent)
    {
        $conversations = $agent->conversations()
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        return response()->json($conversations);
    }

    public function tools(Request $request, AIAgent $agent)
    {
        $this->authorize('view', $agent);

        $service = new AIAgentService($agent);
        return response()->json(['tools' => $service->getAvailableTools()]);
    }
}
```

---

## Testing & Deployment

### 1. Feature Tests

```php
// tests/Feature/AuthTest.php
namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register()
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('users', ['email' => 'john@example.com']);
    }

    public function test_user_can_login()
    {
        $user = User::factory()->create(['password' => bcrypt('password123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['user', 'token']);
    }

    public function test_user_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/logout');

        $response->assertStatus(200);
    }
}
```

### 2. Docker Setup

```dockerfile
# Dockerfile
FROM php:8.3-fpm

WORKDIR /app

# Install dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    git \
    curl \
    && docker-php-ext-install pdo pdo_pgsql

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy application
COPY . .

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader

# Set permissions
RUN chmod -R 755 storage bootstrap/cache

CMD ["php-fpm"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "9000:9000"
    volumes:
      - .:/app
    environment:
      DB_HOST: db
      DB_DATABASE: b_dashboard
      REDIS_HOST: redis
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      POSTGRES_DB: b_dashboard
      POSTGRES_PASSWORD: secret
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  nginx:
    image: nginx:alpine
    ports:
      - "8000:80"
    volumes:
      - .:/app
      - ./docker/nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - app
```

### 3. Deployment

```bash
# Build and push Docker image
docker build -t your-registry/b-dashboard-api:latest .
docker push your-registry/b-dashboard-api:latest

# Deploy with Kubernetes
kubectl apply -f k8s/deployment.yaml

# Run migrations
php artisan migrate --force

# Create admin user
php artisan tinker
# User::create(['email' => 'admin@example.com', 'password' => Hash::make('password'), 'role' => 'admin'])

# Clear caches
php artisan cache:clear
php artisan config:clear
```

---

## Best Practices for Laravel

1. **Use policies** for authorization checks
2. **Implement API resources** for consistent response formatting
3. **Use service classes** to keep controllers lean
4. **Cache frequently accessed data** using Redis
5. **Use database transactions** for critical operations
6. **Implement queue jobs** for long-running tasks
7. **Add comprehensive logging** and monitoring
8. **Use Laravel Fortify** or **Sanctum** for auth
9. **Version your API** (/api/v1/)
10. **Use OpenAPI/Swagger** for documentation

---

## Security Considerations

```php
// config/app.php
'debug' => env('APP_DEBUG', false),

// In production
'key' => env('APP_KEY'),
'cipher' => 'AES-256-CBC',

// HTTPS enforcement
// .env
APP_URL=https://api.example.com

// Middleware for HTTPS
'secure_headers' => [
    'X-Frame-Options' => 'SAMEORIGIN',
    'X-Content-Type-Options' => 'nosniff',
    'X-XSS-Protection' => '1; mode=block',
    'Referrer-Policy' => 'strict-origin-when-cross-origin',
    'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains; preload',
],

// Rate limiting
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/api/login', [AuthController::class, 'login']);
});
```

---

## Quick Start

```bash
# 1. Create project
composer create-project laravel/laravel dashboard-api

# 2. Install packages
cd dashboard-api
composer require laravel/sanctum laravel/reverb

# 3. Publish config
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"

# 4. Create database
createdb b_dashboard

# 5. Configure .env
cp .env.example .env
php artisan key:generate

# 6. Run migrations
php artisan migrate

# 7. Start development server
php artisan serve

# 8. Start WebSocket server (if using Reverb)
php artisan reverb:start
```

---

## Additional Resources

- [Laravel Documentation](https://laravel.com/docs)
- [Laravel Sanctum](https://laravel.com/docs/sanctum)
- [Laravel Reverb](https://reverb.laravel.com/)
- [OpenAI PHP Client](https://github.com/openai-php/client)
- [Pest Testing Framework](https://pestphp.com/)
