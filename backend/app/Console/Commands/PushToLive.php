<?php

namespace App\Console\Commands;

use App\Services\DatabaseSyncService;
use Illuminate\Console\Command;

class PushToLive extends Command
{
    protected $signature = 'dastak:push-to-live {--force : Skip the confirmation prompt}';

    protected $description = 'Full-DB sync: copy LOCAL data → LIVE (api.dastak.cc). Overwrites the live database.';

    public function handle(DatabaseSyncService $sync): int
    {
        if (empty(config('database.connections.mysql_live.host'))) {
            $this->error('Live DB is not configured. Fill DB_LIVE_* in .env once the live server exists.');
            return self::FAILURE;
        }

        $this->warn('⚠  This will OVERWRITE the LIVE database (api.dastak.cc) with your LOCAL data.');
        if (! $this->option('force') && ! $this->confirm('Continue pushing LOCAL → LIVE?')) {
            $this->line('Aborted.');
            return self::SUCCESS;
        }

        $this->info('Pushing LOCAL → LIVE...');
        try {
            $summary = $sync->sync('mysql', 'mysql_live', fn ($m) => $this->line('  '.$m));
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->info('✔ Pushed '.array_sum($summary).' rows across '.count($summary).' tables to LIVE.');
        return self::SUCCESS;
    }
}
