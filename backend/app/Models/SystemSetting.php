<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    protected $table = 'system_settings';
    protected $primaryKey = 'key';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'key',
        'value',
    ];

    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::find($key);
        if (! $setting) {
            return $default;
        }

        $decoded = json_decode($setting->value, true);
        return (json_last_error() === JSON_ERROR_NONE) ? $decoded : $setting->value;
    }

    public static function set(string $key, mixed $value): void
    {
        $encoded = is_array($value) || is_bool($value) || is_numeric($value) ? json_encode($value) : $value;
        static::updateOrCreate(
            ['key' => $key],
            ['value' => $encoded]
        );
    }

    public static function getAllSettings(): array
    {
        $settings = static::all()->pluck('value', 'key')->toArray();
        $result = [];
        foreach ($settings as $k => $v) {
            $decoded = json_decode($v, true);
            $result[$k] = (json_last_error() === JSON_ERROR_NONE) ? $decoded : $v;
        }
        return $result;
    }

    public static function setMany(array $settings): void
    {
        foreach ($settings as $k => $v) {
            static::set((string) $k, $v);
        }
    }
}
