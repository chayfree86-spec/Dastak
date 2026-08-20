<?php

namespace App\Console\Commands;

use App\Services\DatabaseSyncService;
use Illuminate\Console\Command;

class PullFromLive extends Command
{
    protected $signature = 'dastak:pull-from-live {--force : Skip the confirmation prompt}';

    protected $description = 'Full-DB sync: copy LIVE (api.dastak.cc) data → LOCAL. Overwrites the local database.';

    public function handle(DatabaseSyncService $sync): int
    {
        if (empty(config('database.connections.mysql_live.host'))) {
            $this->error('Live DB is not configured. Fill DB_LIVE_* in .env once the live server exists.');
            return self::FAILURE;
        }

        $this->warn('⚠  This will OVERWRITE your LOCAL database with data from LIVE (api.dastak.cc).');
        if (! $this->option('force') && ! $this->confirm('Continue pulling LIVE → LOCAL?')) {
            $this->line('Aborted.');
            return self::SUCCESS;
        }

        $this->info('Pulling LIVE → LOCAL...');
        try {
            $summary = $sync->sync('mysql_live', 'mysql', fn ($m) => $this->line('  '.$m));
        } catch (\Throwable $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        $this->info('✔ Pulled '.array_sum($summary).' rows across '.count($summary).' tables to LOCAL.');
        return self::SUCCESS;
    }
}
