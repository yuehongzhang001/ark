import fs from 'fs';
import path from 'path';

// 确保只在服务器端运行
if (typeof window !== 'undefined') {
  throw new Error('This module can only be used on the server side');
}

// 缓存键格式: {symbol}_{date}
type CacheKey = string;

interface CacheEntry {
  data: any;
  timestamp: number;
}

class TradeCacheService {
  private cache: Map<CacheKey, CacheEntry>;
  private cacheFilePath: string;
  private initialized: boolean;

  constructor() {
    this.cache = new Map<CacheKey, CacheEntry>();
    this.cacheFilePath = path.join(process.cwd(), 'trades_cache.json');
    this.initialized = false;
    this.initialize();
  }

  /**
   * 初始化缓存服务
   */
  private async initialize(): Promise<void> {
    try {
      // 从JSON文件加载缓存数据
      if (fs.existsSync(this.cacheFilePath)) {
        const fileContent = fs.readFileSync(this.cacheFilePath, 'utf8');
        const fileCache = JSON.parse(fileContent);
        for (const [key, value] of Object.entries(fileCache)) {
          this.cache.set(key, value as CacheEntry);
        }
        console.log(`Trade cache initialized with ${this.cache.size} entries`);
      } else {
        console.log('No existing cache file found, starting with empty cache');
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error initializing trade cache:', error);
      this.initialized = true; // 即使加载失败也继续运行
    }
  }

  /**
   * 生成缓存键
   */
  private generateKey(symbol: string, date: string): CacheKey {
    // 确保日期格式统一为YYYY-MM-DD
    const normalizedDate = new Date(date).toISOString().split('T')[0];
    const key = `${symbol}_${normalizedDate}`;
    console.log(`Generated cache key: ${key} for symbol: ${symbol}, date: ${date}`);
    return key;
  }

  /**
   * 获取缓存数据
   */
  get(symbol: string, date: string): any | null {
    const key = this.generateKey(symbol, date);
    const entry = this.cache.get(key);
    
    if (entry) {
      console.log(`Cache HIT for key: ${key}`);
      return entry.data;
    }
    
    console.log(`Cache MISS for key: ${key}`);
    return null;
  }

  /**
   * 设置缓存数据
   */
  set(symbol: string, date: string, data: any): void {
    const key = this.generateKey(symbol, date);
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    
    this.cache.set(key, entry);
    this.persistCache();
    console.log(`Cache SET for key: ${key}`);
  }

  /**
   * 持久化缓存到JSON文件
   */
  private persistCache(): void {
    try {
      // 将Map转换为普通对象以便JSON序列化
      const cacheObject: Record<string, CacheEntry> = {};
      this.cache.forEach((value, key) => {
        cacheObject[key] = value;
      });
      
      fs.writeFileSync(this.cacheFilePath, JSON.stringify(cacheObject, null, 2));
    } catch (error) {
      console.error('Error persisting cache to file:', error);
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; initialized: boolean } {
    return {
      size: this.cache.size,
      initialized: this.initialized
    };
  }
  
  /**
   * 获取所有缓存键（用于调试）
   */
  getAllKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}

// 导出单例实例
export const tradeCacheService = new TradeCacheService();