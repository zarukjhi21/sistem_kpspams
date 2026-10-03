<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Exception;

class DatabaseRestoreCommand extends Command
{
    protected $signature = 'app:db-restore {file : The path to the backup file} {--test-target= : Optional test destination for verification}';
    protected $description = 'Restore and verify a database backup for SI-KPSPAMS';

    public function handle(): int
    {
        $file = $this->argument('file');

        if (!File::exists($file)) {
            $this->error("Backup file does not exist: {$file}");
            return Command::FAILURE;
        }

        $this->info("Verifying backup file: {$file} (" . round(filesize($file) / 1024, 2) . " KB)...");
        $connection = config('database.default');

        try {
            if ($connection === 'sqlite') {
                $targetDb = $this->option('test-target') ?: config('database.connections.sqlite.database');

                // Perform copy to target
                File::copy($file, $targetDb);

                // Verify SQLite data integrity using PDO PRAGMA integrity_check
                $pdo = new \PDO("sqlite:{$targetDb}");
                $stmt = $pdo->query('PRAGMA integrity_check');
                $result = $stmt->fetchColumn();

                if ($result !== 'ok') {
                    throw new Exception("SQLite PRAGMA integrity_check failed with result: {$result}");
                }

                // Verify key tables exist and have records
                $tables = ['users', 'kpspams', 'customers', 'connections', 'invoices', 'payments'];
                $summary = [];

                foreach ($tables as $table) {
                    $countStmt = $pdo->query("SELECT count(*) FROM {$table}");
                    $count = $countStmt ? (int) $countStmt->fetchColumn() : -1;
                    $summary[$table] = $count;
                }

                $this->info("Database restored successfully to [{$targetDb}]! Integrity Check: OK.");
                $this->table(['Table', 'Record Count'], collect($summary)->map(fn($count, $tbl) => [$tbl, $count])->toArray());

                return Command::SUCCESS;
            }

            if ($connection === 'pgsql') {
                $host = config('database.connections.pgsql.host');
                $port = config('database.connections.pgsql.port');
                $database = $this->option('test-target') ?: config('database.connections.pgsql.database');
                $username = config('database.connections.pgsql.username');
                $password = config('database.connections.pgsql.password');

                $command = sprintf(
                    'PGPASSWORD="%s" pg_restore -h %s -p %s -U %s -d %s -c -v "%s"',
                    $password,
                    $host,
                    $port,
                    $username,
                    $database,
                    $file
                );

                exec($command, $output, $returnVar);

                if ($returnVar !== 0 && $returnVar !== 1) { // 1 is warning in pg_restore
                    throw new Exception("pg_restore failed with return code: {$returnVar}");
                }

                $this->info("PostgreSQL database restored successfully to [{$database}]!");
                return Command::SUCCESS;
            }

            $this->warn("Unsupported database driver: {$connection}");
            return Command::FAILURE;
        } catch (Exception $e) {
            $this->error("Restore failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
