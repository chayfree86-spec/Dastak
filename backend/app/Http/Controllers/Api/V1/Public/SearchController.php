<?php

namespace App\Http\Controllers\Api\V1\Public;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Services\SearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function __construct(
        protected SearchService $searchService
    ) {}

    public function search(Request $request): JsonResponse
    {
        $query = (string) $request->input('q', '');
        $restaurantId = $request->filled('restaurant_id') ? (int) $request->input('restaurant_id') : null;
        $limit = (int) $request->input('limit', 30);

        $results = $this->searchService->search($query, $restaurantId, $limit);

        return ApiResponse::success(
            $results,
            'Search results retrieved successfully.'
        );
    }

    public function suggestions(Request $request): JsonResponse
    {
        $partial = (string) $request->input('q', '');
        $suggestions = $this->searchService->getSuggestions($partial);

        return ApiResponse::success(
            $suggestions,
            'Typehead search suggestions retrieved.'
        );
    }
}
