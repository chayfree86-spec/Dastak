<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use App\Models\SmsLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SmsLogAdminController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = SmsLog::with('user')->latest('id');

        if ($request->filled('channel')) {
            $query->where('channel', $request->input('channel'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('recipient')) {
            $query->where('recipient', 'like', '%' . $request->input('recipient') . '%');
        }

        $logs = $query->paginate((int) $request->input('per_page', 25));

        return ApiResponse::success($logs, 'SMS and WhatsApp audit logs retrieved.');
    }
}
