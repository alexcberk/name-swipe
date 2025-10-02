import { resourceLogger as logger } from './logger';
import * as os from 'os';
import { promises as fs } from 'fs';

interface ResourceMetrics {
  timestamp: string;
  memory: {
    totalMB: number;
    usedMB: number;
    freeMB: number;
    usagePercent: number;
    processHeapUsedMB: number;
    processHeapTotalMB: number;
    processRssMB: number;
  };
  cpu: {
    cores: number;
    loadAverage: number[];
    processUptime: number;
  };
  disk?: {
    totalGB: number;
    usedGB: number;
    availableGB: number;
    usagePercent: number;
  };
}

async function getDiskUsage(): Promise<ResourceMetrics['disk'] | undefined> {
  try {
    // Read disk stats from /proc/mounts and statfs
    // This is a simple implementation for Linux systems
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);

    const { stdout } = await execAsync('df -B1 / | tail -1');
    const parts = stdout.trim().split(/\s+/);

    if (parts.length >= 6) {
      const total = parseInt(parts[1]) / (1024 ** 3); // Convert to GB
      const used = parseInt(parts[2]) / (1024 ** 3);
      const available = parseInt(parts[3]) / (1024 ** 3);
      const usagePercent = parseFloat(parts[4]);

      return {
        totalGB: Math.round(total * 100) / 100,
        usedGB: Math.round(used * 100) / 100,
        availableGB: Math.round(available * 100) / 100,
        usagePercent: Math.round(usagePercent * 100) / 100
      };
    }
  } catch (error) {
    logger.debug({ err: error }, 'Failed to get disk usage');
  }
  return undefined;
}

async function getResourceMetrics(): Promise<ResourceMetrics> {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;

  const memUsage = process.memoryUsage();

  const metrics: ResourceMetrics = {
    timestamp: new Date().toISOString(),
    memory: {
      totalMB: Math.round(totalMem / (1024 * 1024)),
      usedMB: Math.round(usedMem / (1024 * 1024)),
      freeMB: Math.round(freeMem / (1024 * 1024)),
      usagePercent: Math.round((usedMem / totalMem) * 100 * 100) / 100,
      processHeapUsedMB: Math.round(memUsage.heapUsed / (1024 * 1024) * 100) / 100,
      processHeapTotalMB: Math.round(memUsage.heapTotal / (1024 * 1024) * 100) / 100,
      processRssMB: Math.round(memUsage.rss / (1024 * 1024) * 100) / 100
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
      processUptime: Math.round(process.uptime())
    }
  };

  // Get disk usage
  const diskUsage = await getDiskUsage();
  if (diskUsage) {
    metrics.disk = diskUsage;
  }

  return metrics;
}

function checkResourceThresholds(metrics: ResourceMetrics) {
  // Memory warnings
  if (metrics.memory.usagePercent > 90) {
    logger.warn({ metrics: metrics.memory }, 'High memory usage detected (>90%)');
  } else if (metrics.memory.usagePercent > 80) {
    logger.info({ metrics: metrics.memory }, 'Elevated memory usage (>80%)');
  }

  // Disk warnings
  if (metrics.disk) {
    if (metrics.disk.usagePercent > 90) {
      logger.error({ metrics: metrics.disk }, 'Critical disk space - usage >90%');
    } else if (metrics.disk.usagePercent > 80) {
      logger.warn({ metrics: metrics.disk }, 'Low disk space - usage >80%');
    }
  }

  // CPU load warnings (load average per core)
  const loadPerCore = metrics.cpu.loadAverage[0] / metrics.cpu.cores;
  if (loadPerCore > 2) {
    logger.warn({
      loadAverage: metrics.cpu.loadAverage,
      cores: metrics.cpu.cores,
      loadPerCore
    }, 'High CPU load detected');
  }

  // Process memory warnings
  if (metrics.memory.processRssMB > 1024) { // Over 1GB
    logger.warn({
      processMemory: {
        rssMB: metrics.memory.processRssMB,
        heapUsedMB: metrics.memory.processHeapUsedMB
      }
    }, 'High process memory usage (>1GB RSS)');
  }
}

export function startResourceMonitoring(intervalMinutes: number = 5) {
  const intervalMs = intervalMinutes * 60 * 1000;

  // Log initial metrics
  (async () => {
    const metrics = await getResourceMetrics();
    logger.info({ metrics }, 'Resource monitoring started');
    checkResourceThresholds(metrics);
  })();

  // Set up periodic monitoring
  const monitoringInterval = setInterval(async () => {
    try {
      const metrics = await getResourceMetrics();
      logger.debug({ metrics }, 'Resource metrics collected');
      checkResourceThresholds(metrics);
    } catch (error) {
      logger.error({ err: error }, 'Failed to collect resource metrics');
    }
  }, intervalMs);

  // Clean up on process termination
  process.on('SIGTERM', () => {
    clearInterval(monitoringInterval);
    logger.info('Resource monitoring stopped');
  });

  process.on('SIGINT', () => {
    clearInterval(monitoringInterval);
    logger.info('Resource monitoring stopped');
  });

  return monitoringInterval;
}

// Export function to get metrics on-demand
export { getResourceMetrics };
