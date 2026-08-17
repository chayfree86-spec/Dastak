<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class GeocodeController extends Controller
{
    public function reverse(Request $request): JsonResponse
    {
        $request->validate([
            'lat' => ['required', 'numeric', 'between:-90,90'],
            'lng' => ['required', 'numeric', 'between:-180,180'],
        ]);

        $lat = (float) $request->input('lat');
        $lng = (float) $request->input('lng');

        // Provider 1: OpenStreetMap Nominatim (withoutVerifying fixes local Windows SSL issues).
        try {
            $response = Http::withoutVerifying()->withHeaders([
                'User-Agent' => 'DastakDeliveryApp/1.0 (support@dastakdelivery.com)',
                'Accept-Language' => 'en',
            ])->timeout(8)->get('https://nominatim.openstreetmap.org/reverse', [
                'format' => 'json',
                'lat' => $lat,
                'lon' => $lng,
                'zoom' => 18,
                'addressdetails' => 1,
            ]);

            if ($response->successful() && ! empty($response->json())) {
                $data = $response->json();
                $addr = $data['address'] ?? [];

                $street = $addr['road'] ?? $addr['suburb'] ?? $addr['neighbourhood'] ?? $addr['residential'] ?? $addr['hamlet'] ?? '';
                $area = $addr['suburb'] ?? $addr['village'] ?? $addr['town'] ?? $addr['city_district'] ?? '';
                // Real city only — never a hardcoded default.
                $city = $addr['city'] ?? $addr['town'] ?? $addr['municipality'] ?? $addr['village'] ?? $addr['county'] ?? $addr['state_district'] ?? null;
                $state = $addr['state'] ?? '';
                $postcode = $addr['postcode'] ?? '';

                $parts = array_values(array_unique(array_filter([$street, $area, $city, $state])));
                $cleanAddress = ! empty($parts) ? implode(', ', $parts) : ($data['display_name'] ?? '');

                if ($cleanAddress !== '') {
                    return ApiResponse::success([
                        'formatted_address' => $cleanAddress,
                        'city' => $city,
                        'state' => $state,
                        'postcode' => $postcode,
                        'display_name' => $data['display_name'] ?? $cleanAddress,
                        'latitude' => $lat,
                        'longitude' => $lng,
                    ], 'Address resolved successfully.');
                }
            }
        } catch (\Throwable $e) {
            // fall through to next provider
        }

        // Provider 2: BigDataCloud free reverse geocode.
        try {
            $bdcResponse = Http::withoutVerifying()->timeout(6)->get('https://api.bigdatacloud.net/data/reverse-geocode-client', [
                'latitude' => $lat,
                'longitude' => $lng,
                'localityLanguage' => 'en',
            ]);

            if ($bdcResponse->successful()) {
                $bdc = $bdcResponse->json();
                $city = $bdc['city'] ?? $bdc['locality'] ?? $bdc['principalSubdivision'] ?? null;
                $locality = $bdc['locality'] ?? '';
                $state = $bdc['principalSubdivision'] ?? '';
                $clean = implode(', ', array_values(array_unique(array_filter([$locality, $city, $state]))));

                if ($clean !== '') {
                    return ApiResponse::success([
                        'formatted_address' => $clean,
                        'city' => $city,
                        'state' => $state,
                        'postcode' => $bdc['postcode'] ?? '',
                        'display_name' => $clean,
                        'latitude' => $lat,
                        'longitude' => $lng,
                    ], 'Address resolved via fallback provider.');
                }
            }
        } catch (\Throwable $e) {
            // fall through
        }

        // Genuinely unresolved — return an error (NO coordinate-text / no hardcoded city).
        return ApiResponse::error('Could not resolve these coordinates to an address.', null, 404);
    }

    public function forward(Request $request): JsonResponse
    {
        $request->validate([
            'query' => ['required', 'string', 'max:255'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $q = trim($request->input('query'));
        $limit = (int) ($request->input('limit', 5));

        try {
            $response = Http::withoutVerifying()->withHeaders([
                'User-Agent' => 'DastakDeliveryApp/1.0 (support@dastakdelivery.com)',
                'Accept-Language' => 'en',
            ])->timeout(8)->get('https://nominatim.openstreetmap.org/search', [
                'format' => 'json',
                'q' => $q,
                'limit' => $limit,
                'addressdetails' => 1,
            ]);

            if ($response->successful() && ! empty($response->json())) {
                $rawItems = $response->json();
                $results = array_map(function ($item) {
                    $addr = $item['address'] ?? [];
                    $street = $addr['road'] ?? $addr['suburb'] ?? $addr['neighbourhood'] ?? $addr['residential'] ?? '';
                    $area = $addr['suburb'] ?? $addr['village'] ?? $addr['town'] ?? $addr['city_district'] ?? '';
                    $city = $addr['city'] ?? $addr['town'] ?? $addr['village'] ?? $addr['county'] ?? null;
                    $state = $addr['state'] ?? '';
                    $parts = array_values(array_unique(array_filter([$street, $area, $city, $state])));
                    $cleanAddress = ! empty($parts) ? implode(', ', $parts) : ($item['display_name'] ?? '');

                    return [
                        'latitude' => (float) $item['lat'],
                        'longitude' => (float) $item['lon'],
                        'display_name' => $item['display_name'] ?? '',
                        'formatted_address' => $cleanAddress,
                        'city' => $city,
                        'state' => $state,
                    ];
                }, $rawItems);

                $first = $results[0];

                return ApiResponse::success([
                    'results' => $results,
                    'latitude' => $first['latitude'],
                    'longitude' => $first['longitude'],
                    'display_name' => $first['display_name'],
                    'formatted_address' => $first['formatted_address'],
                    'city' => $first['city'],
                    'state' => $first['state'],
                ], 'Location coordinates resolved.');
            }
        } catch (\Throwable $e) {
            //
        }

        return ApiResponse::error('Unable to locate that address.', null, 404);
    }

    public function detectIpLocation(Request $request): JsonResponse
    {
        $ip = $request->ip();
        if ($ip === '127.0.0.1' || $ip === '::1' || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
            $ip = '';
        }

        // Provider 1: ip-api.com (http, no SSL).
        try {
            $url = $ip
                ? "http://ip-api.com/json/{$ip}?fields=status,message,country,regionName,city,zip,lat,lon"
                : 'http://ip-api.com/json/?fields=status,message,country,regionName,city,zip,lat,lon';
            $res = Http::timeout(5)->get($url);
            if ($res->successful() && $res->json('status') === 'success') {
                $data = $res->json();

                return ApiResponse::success([
                    'latitude' => (float) $data['lat'],
                    'longitude' => (float) $data['lon'],
                    'city' => $data['city'] ?? null,
                    'state' => $data['regionName'] ?? null,
                    'formatted_address' => trim(implode(', ', array_filter([$data['city'] ?? null, $data['regionName'] ?? null]))) ?: null,
                    'accuracy' => 'ip', // IP-level only — not precise to a building.
                ], 'Approximate IP location detected.');
            }
        } catch (\Throwable $e) {
            //
        }

        // Provider 2: ipwho.is
        try {
            $res2 = Http::withoutVerifying()->timeout(5)->get('https://ipwho.is/' . ($ip ?: ''));
            if ($res2->successful() && $res2->json('success')) {
                $data = $res2->json();

                return ApiResponse::success([
                    'latitude' => (float) $data['latitude'],
                    'longitude' => (float) $data['longitude'],
                    'city' => $data['city'] ?? null,
                    'state' => $data['region'] ?? null,
                    'formatted_address' => trim(implode(', ', array_filter([$data['city'] ?? null, $data['region'] ?? null]))) ?: null,
                    'accuracy' => 'ip',
                ], 'Approximate IP location detected via fallback.');
            }
        } catch (\Throwable $e) {
            //
        }

        // No mock/hardcoded location — tell the caller detection failed.
        return ApiResponse::error('Could not detect your location automatically. Please use GPS or set the pin manually.', null, 422);
    }
}
