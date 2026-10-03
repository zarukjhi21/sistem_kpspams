<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Exception;

class DatabaseBackupCommand extends Command
{
    protected $signature = 'app:db-backup {--target= : Specific destination path}';
    protected $description = 'Perform an automated backup of the SI-KPSPAMS database (SQLite or PostgreSQL)';

    public function handle(): int
    {
        $this->info("Starting SI-KPSPAMS database backup...");
        $connection = config('database.default');
        $backupDir = storage_path('app/backups');

        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $timestamp = now()->format('Ymd_His');

        try {
            if ($connection === 'sqlite') {
                $dbPath = config('database.connections.sqlite.database');
                if (!File::exists($dbPath)) {
                    throw new Exception("SQLite database file not found at: {$dbPath}");
                }

                $backupFile = $this->option('target') ?: "{$backupDir}/backup_sqlite_{$timestamp}.sqlite";
                
                // Perform vacuum or direct copy
                File::copy($dbPath, $backupFile);

                if (!File::exists($backupFile) || filesize($backupFile) === 0) {
                    throw new Exception("Backup creation failed; backup file is missing or 0 bytes.");
                }

                $sizeKb = round(filesize($backupFile) / 1024, 2);
                $this->info("SQLite database backup created successfully: {$backupFile} ({$sizeKb} KB)");
                return Command::SUCCESS;
            }

            if ($connection === 'pgsql') {
                $host = config('database.connections.pgsql.host');
                $port = config('database.connections.pgsql.port');
                $database = config('database.connections.pgsql.database');
                $username = config('database.connections.pgsql.username');
                $password = config('database.connections.pgsql.password');

                $backupFile = $this->option('target') ?: "{$backupDir}/backup_pgsql_{$database}_{$timestamp}.sql";

                $command = sprintf(
                    'PGPASSWORD="%s" pg_dump -h %s -p %s -U %s -F c -b -v -f "%s" %s',
                    $password,
                    $host,
                    $port,
                    $username,
                    $backupFile,
                    $database
                );

                exec($command, $output, $returnVar);

                if ($returnVar !== 0) {
                    throw new Exception("pg_dump failed with return code: {$returnVar}");
                }

                $this->info("PostgreSQL database backup created successfully: {$backupFile}");
                return Command::SUCCESS;
            }

            $this->warn("Unsupported database driver for automated backup: {$connection}");
            return Command::FAILURE;
        } catch (Exception $e) {
            $this->error("Database backup failed: " . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
