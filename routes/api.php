<?php

use App\Http\Controllers\Api\V1\AdminBadgeController;
use App\Http\Controllers\Api\V1\AdminDashboardController;
use App\Http\Controllers\Api\V1\AdminModuleController;
use App\Http\Controllers\Api\V1\AdminQuestionController;
use App\Http\Controllers\Api\V1\AdminStoryController;
use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\ChildAreaController;
use App\Http\Controllers\Api\V1\ChildGrowthController;
use App\Http\Controllers\Api\V1\MediaController;
use App\Http\Controllers\Api\V1\ParentAreaController;
use App\Http\Controllers\Api\V1\QuizAttemptController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // --- AUTH ---
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/parental-gate/verify', [AuthController::class, 'verifyParentalGate']);
        Route::get('/auth/me', function (Request $request) {
            return response()->json(['data' => $request->user()]);
        });
    });

    // --- AREA ANAK (/belajarceria) ---
    Route::get('/children/{child_id}/home', [ChildAreaController::class, 'home']);
    Route::get('/modules', [ChildAreaController::class, 'modules']);
    Route::get('/modules/{code}/topics', [ChildAreaController::class, 'topics']);
    Route::get('/topics/{id}', [ChildAreaController::class, 'topicDetail']);
    Route::get('/topics/{id}/questions', [ChildAreaController::class, 'questions']);
    Route::get('/stories', [ChildAreaController::class, 'stories']);
    Route::get('/stories/{id}', [ChildAreaController::class, 'storyDetail']);
    Route::post('/stories/{id}/complete', [ChildAreaController::class, 'completeStory']);
    Route::post('/quiz-attempts', [QuizAttemptController::class, 'store']);
    Route::get('/children/{id}/badges', [ChildAreaController::class, 'badges']);
    Route::get('/children/{id}/settings', [ChildAreaController::class, 'settings']);
    Route::put('/children/{id}/settings', [ChildAreaController::class, 'updateSettings']);

    // --- AREA ORANG TUA (/orangtua) ---
    Route::middleware('auth:sanctum')->prefix('parent')->group(function () {
        Route::get('/children', [ParentAreaController::class, 'children']);
        Route::post('/children', [ParentAreaController::class, 'storeChild']);
        Route::put('/children/{id}', [ParentAreaController::class, 'updateChild']);
        Route::delete('/children/{id}', [ParentAreaController::class, 'destroyChild']);

        Route::get('/children/{id}/report', [ParentAreaController::class, 'report']);
        Route::get('/children/{id}/badges', [ParentAreaController::class, 'childBadges']);

        // Tumbuh Kembang Anak
        Route::get('/children/{childId}/growth', [ChildGrowthController::class, 'index']);
        Route::post('/children/{childId}/growth', [ChildGrowthController::class, 'storeMeasurement']);
        Route::put('/growth/{id}', [ChildGrowthController::class, 'updateMeasurement']);
        Route::delete('/growth/{id}', [ChildGrowthController::class, 'destroyMeasurement']);
        Route::post('/children/{childId}/milestones/toggle', [ChildGrowthController::class, 'toggleMilestone']);
        Route::match(['post', 'patch'], '/milestone_progress', [ChildGrowthController::class, 'toggleMilestone']);

        Route::get('/account', [ParentAreaController::class, 'account']);
        Route::put('/account', [ParentAreaController::class, 'updateAccount']);
        Route::put('/pin', [ParentAreaController::class, 'updatePin']);
    });

    // --- AREA ADMIN (/admin) ---
    Route::middleware('auth:sanctum')->prefix('admin')->group(function () {
        Route::get('/dashboard/summary', [AdminDashboardController::class, 'summary']);

        // Modules & Topics
        Route::get('/modules', [AdminModuleController::class, 'indexModules']);
        Route::post('/modules', [AdminModuleController::class, 'storeModule']);
        Route::put('/modules/{id}', [AdminModuleController::class, 'updateModule']);
        Route::delete('/modules/{id}', [AdminModuleController::class, 'destroyModule']);

        Route::get('/modules/{id}/topics', [AdminModuleController::class, 'indexTopics']);
        Route::post('/topics/generate-ai', [AdminModuleController::class, 'generateAiTopic']);
        Route::post('/topics', [AdminModuleController::class, 'storeTopic']);
        Route::put('/topics/{id}', [AdminModuleController::class, 'updateTopic']);
        Route::delete('/topics/{id}', [AdminModuleController::class, 'destroyTopic']);

        // Bank Soal & Options
        Route::get('/topics/{id}/questions', [AdminQuestionController::class, 'indexByTopic']);
        Route::post('/questions/generate-ai', [AdminQuestionController::class, 'generateAi']);
        Route::post('/questions/bulk', [AdminQuestionController::class, 'bulkStore']);
        Route::post('/questions', [AdminQuestionController::class, 'store']);
        Route::put('/questions/{id}', [AdminQuestionController::class, 'update']);
        Route::delete('/questions/{id}', [AdminQuestionController::class, 'destroy']);

        Route::post('/questions/{id}/options', [AdminQuestionController::class, 'storeOption']);
        Route::put('/options/{id}', [AdminQuestionController::class, 'updateOption']);
        Route::delete('/options/{id}', [AdminQuestionController::class, 'destroyOption']);

        // Stories & Vocabularies
        Route::get('/stories', [AdminStoryController::class, 'index']);
        Route::post('/stories/generate-ai', [AdminStoryController::class, 'generateAi']);
        Route::post('/stories/generate-image', [AdminStoryController::class, 'generateAiImage']);
        Route::get('/stories/{id}', [AdminStoryController::class, 'show']);
        Route::post('/stories', [AdminStoryController::class, 'store']);
        Route::put('/stories/{id}', [AdminStoryController::class, 'update']);
        Route::delete('/stories/{id}', [AdminStoryController::class, 'destroy']);
        Route::post('/stories/{id}/vocabularies', [AdminStoryController::class, 'storeVocabulary']);

        // Users & Badges
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::put('/users/{id}/suspend', [AdminUserController::class, 'suspend']);

        Route::get('/badges', [AdminBadgeController::class, 'index']);
        Route::get('/badges/{id}', [AdminBadgeController::class, 'show']);
        Route::post('/badges', [AdminBadgeController::class, 'store']);
        Route::put('/badges/{id}', [AdminBadgeController::class, 'update']);
        Route::delete('/badges/{id}', [AdminBadgeController::class, 'destroy']);

        // Media Upload
        Route::post('/media/upload', [MediaController::class, 'upload']);
    });
});
