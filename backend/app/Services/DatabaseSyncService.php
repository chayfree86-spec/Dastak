<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Full-database sync engine. Copies EVERY table's rows from one MySQL connection
 * to another (the target is fully replaced by the source — a mirror, not a merge).
 * IDs stay consistent because the whole dataset is copied.
 */
class DatabaseSyncService
{
    /** Ephemeral / framework tables that must NOT be mirrored. */
    protected array $skip = [
        'cache', 'cache_locks', 'sessions', 'jobs', 'job_batches', 'failed_jobs',
    ];

    /**
     * @param  callable|null  $log  fn(string $message): void
     * @return array<string,int>  table => rows copied
     */
    public function sync(string $from, string $to, ?callable $log = null): array
    {
        $log ??= static fn () => null;

        // Fail fast if the target is unreachable / not configured.
        try {
            DB::connection($to)->getPdo();
        } catch (\Throwable $e) {
            throw new RuntimeException("Cannot connect to '{$to}' database: ".$e->getMessage());
        }

        // Safety: never mirror a database onto itself.
        $fromDb = DB::connection($from)->getDatabaseName();
        $toDb = DB::connection($to)->getDatabaseName();
        $fromHost = DB::connection($from)->getConfig('host');
        $toHost = DB::connection($to)->getConfig('host');
        if ($fromDb === $toDb && $fromHost === $toHost) {
            throw new RuntimeException('Source and target point to the SAME database — aborting to avoid data loss.');
        }

        $tables = $this->tables($from);
        $summary = [];

        DB::connection($to)->statement('SET FOREIGN_KEY_CHECKS=0');
        try {
            foreach ($tables as $table) {
                if (in_array($table, $this->skip, true)) {
                    $log("skip (ephemeral): {$table}");
                    continue;
                }
                if (! Schema::connection($to)->hasTable($table)) {
                    $log("skip (missing on target): {$table}");
                    continue;
                }

                DB::connection($to)->table($table)->truncate();

                $orderBy = $this->orderColumn($from, $table);
                $count = 0;
                DB::connection($from)->table($table)->orderBy($orderBy)->chunk(1000, function ($rows) use ($to, $table, &$count) {
                    $data = array_map(fn ($r) => (array) $r, $rows->all());
                    if (! empty($data)) {
                        DB::connection($to)->table($table)->insert($data);
                        $count += count($data);
                    }
                });

                $summary[$table] = $count;
                $log("{$table}: {$count} rows");
            }
        } finally {
            DB::connection($to)->statement('SET FOREIGN_KEY_CHECKS=1');
        }

        return $summary;
    }

    /** All base tables on the given connection. */
    protected function tables(string $connection): array
    {
        $db = DB::connection($connection)->getDatabaseName();
        $rows = DB::connection($connection)->select(
            'SELECT table_name AS name FROM information_schema.tables WHERE table_schema = ? AND table_type = "BASE TABLE"',
            [$db]
        );

        return array_map(fn ($r) => $r->name, $rows);
    }

    /** Prefer the `id` column for a stable chunk order, else the first column. */
    protected function orderColumn(string $connection, string $table): string
    {
        $columns = Schema::connection($connection)->getColumnListing($table);

        return in_array('id', $columns, true) ? 'id' : ($columns[0] ?? 'id');
    }
}
