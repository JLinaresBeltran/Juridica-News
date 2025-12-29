import { execSync } from 'child_process';
import { createReadStream, createWriteStream, promises as fs } from 'fs';
import { createGzip } from 'zlib';
import { pipeline } from 'stream/promises';
import path from 'path';
import { logger } from '@/utils/logger';

const BACKUP_DIR = path.join(process.cwd(), 'backups');
const DB_PATH = path.join(process.cwd(), 'prisma', 'dev.db');
const RETENTION_DAYS = 30;

interface BackupResult {
  filename: string;
  path: string;
  size: number;
  sizeCompressed: number;
  checksum: string;
  timestamp: Date;
  compressionRatio: number;
}

/**
 * Crear directorio de backups si no existe
 */
async function ensureBackupDir(): Promise<void> {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
  } catch (error) {
    logger.error('[Backup] Error creating backup directory', { error });
    throw error;
  }
}

/**
 * Calcular checksum SHA-256 de un archivo
 */
function calculateFileChecksum(filePath: string): string {
  try {
    const output = execSync(`shasum -a 256 "${filePath}"`).toString();
    const hash = output.split(' ')[0];
    if (!hash) {
      throw new Error('Failed to extract checksum from shasum output');
    }
    return hash;
  } catch (error) {
    logger.error('[Backup] Error calculating checksum', { error });
    throw error;
  }
}

/**
 * Crear backup de base de datos
 */
async function backupDatabase(): Promise<BackupResult> {
  try {
    await ensureBackupDir();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const now = new Date();
    const timeString = `${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}`;
    const uncompressedFilename = `backup-${timestamp}-${timeString}.db`;
    const uncompressedPath = path.join(BACKUP_DIR, uncompressedFilename);
    const compressedFilename = `backup-${timestamp}-${timeString}.db.gz`;
    const compressedPath = path.join(BACKUP_DIR, compressedFilename);

    logger.info('[Backup] Starting database backup...');
    const startTime = Date.now();

    // 1️⃣ Copiar archivo de BD
    logger.info(`[Backup] Copying database file...`);
    await fs.copyFile(DB_PATH, uncompressedPath);

    // Obtener tamaño del archivo original
    const uncompressedStats = await fs.stat(uncompressedPath);
    const uncompressedSize = uncompressedStats.size;

    // 2️⃣ Comprimir con gzip
    logger.info(`[Backup] Compressing with gzip...`);
    const source = createReadStream(uncompressedPath);
    const destination = createWriteStream(compressedPath);
    const gzip = createGzip();

    await pipeline(source, gzip, destination);

    // Obtener tamaño comprimido
    const compressedStats = await fs.stat(compressedPath);
    const compressedSize = compressedStats.size;

    // 3️⃣ Eliminar archivo sin comprimir
    logger.info(`[Backup] Removing uncompressed backup...`);
    await fs.unlink(uncompressedPath);

    // 4️⃣ Calcular checksum del archivo comprimido
    logger.info(`[Backup] Calculating checksum...`);
    const checksum = calculateFileChecksum(compressedPath);

    // 5️⃣ Limpiar backups antiguos (>30 días)
    logger.info(`[Backup] Cleaning old backups (>30 days)...`);
    await cleanOldBackups();

    const duration = (Date.now() - startTime) / 1000;
    const compressionRatio = Math.round((1 - compressedSize / uncompressedSize) * 100);

    const result: BackupResult = {
      filename: compressedFilename,
      path: compressedPath,
      size: uncompressedSize,
      sizeCompressed: compressedSize,
      checksum: checksum.slice(0, 16) + '...', // Mostrar solo primeros 16 chars
      timestamp: new Date(),
      compressionRatio,
    };

    logger.info(`[Backup] ✅ Backup completed`, {
      filename: compressedFilename,
      originalSize: `${(uncompressedSize / 1024 / 1024).toFixed(2)} MB`,
      compressedSize: `${(compressedSize / 1024 / 1024).toFixed(2)} MB`,
      compressionRatio: `${compressionRatio}%`,
      checksum: result.checksum,
      duration: `${duration.toFixed(2)}s`,
    });

    return result;

  } catch (error) {
    logger.error('[Backup] Error during backup', { error });
    throw error;
  }
}

/**
 * Limpiar backups más antiguos que RETENTION_DAYS
 */
async function cleanOldBackups(): Promise<number> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    let deleted = 0;
    const now = Date.now();
    const retentionMs = RETENTION_DAYS * 24 * 60 * 60 * 1000;

    for (const file of files) {
      if (!file.startsWith('backup-') || !file.endsWith('.db.gz')) {
        continue;
      }

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);
      const age = now - stats.mtimeMs;

      if (age > retentionMs) {
        await fs.unlink(filePath);
        deleted++;
        logger.info(`[Backup] Deleted old backup: ${file}`);
      }
    }

    if (deleted > 0) {
      logger.info(`[Backup] Cleaned ${deleted} old backup(s)`);
    }

    return deleted;

  } catch (error) {
    logger.error('[Backup] Error cleaning old backups', { error });
    // No throw - este es un paso opcional
    return 0;
  }
}

/**
 * Listar todos los backups disponibles
 */
async function listBackups(): Promise<{ filename: string; size: number; created: Date }[]> {
  try {
    const files = await fs.readdir(BACKUP_DIR);
    const backups: { filename: string; size: number; created: Date }[] = [];

    for (const file of files) {
      if (!file.startsWith('backup-') || !file.endsWith('.db.gz')) {
        continue;
      }

      const filePath = path.join(BACKUP_DIR, file);
      const stats = await fs.stat(filePath);

      backups.push({
        filename: file,
        size: stats.size,
        created: stats.mtime,
      });
    }

    // Ordenar por fecha (más recientes primero)
    return backups.sort((a, b) => b.created.getTime() - a.created.getTime());

  } catch (error) {
    logger.error('[Backup] Error listing backups', { error });
    throw error;
  }
}

// Ejecutar si es script directo
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];

  (async () => {
    try {
      if (command === 'list') {
        const backups = await listBackups();
        if (backups.length === 0) {
          console.log('No backups found');
        } else {
          console.log('\n📦 AVAILABLE BACKUPS');
          console.log('==================');
          for (const backup of backups) {
            const sizeHuman = (backup.size / 1024 / 1024).toFixed(2) + ' MB';
            console.log(`${backup.created.toISOString()} - ${backup.filename} (${sizeHuman})`);
          }
        }
      } else {
        const result = await backupDatabase();
        console.log('\n✅ BACKUP SUCCESSFUL');
        console.log('====================');
        console.log(`Filename:         ${result.filename}`);
        console.log(`Original size:    ${(result.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Compressed size:  ${(result.sizeCompressed / 1024 / 1024).toFixed(2)} MB`);
        console.log(`Compression:      ${result.compressionRatio}%`);
        console.log(`Checksum (SHA256): ${result.checksum}`);
      }

      process.exit(0);
    } catch (error) {
      logger.error('[Backup] Fatal error', { error });
      process.exit(1);
    }
  })();
}

export { backupDatabase, cleanOldBackups, listBackups };
