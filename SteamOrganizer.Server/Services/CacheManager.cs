using System.Collections.Concurrent;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Services;

public static class CacheManager
{
    private static readonly ConcurrentDictionary<string, object> GlobalStorage = new();
    public static readonly string Folder = Path.Combine(Environment.CurrentDirectory, Defines.CacheFolderName);

    static CacheManager()
    {
        Directory.CreateDirectory(Folder);
    }

    public static Bucket<T,TV> GetBucket<T,TV>(string name) where T : notnull
    {
        if (GlobalStorage.TryGetValue(name, out var cached))
        {
            return cached as Bucket<T,TV> ?? throw new InvalidCastException("Invalid bucket type");
        }

        var bucket =  new Bucket<T,TV>(name);
        GlobalStorage[name] = bucket;
        return bucket;
    }

    public static void Dispose()
    {
        foreach (var bucket in GlobalStorage)
        {
            ((IDisposable)bucket.Value).Dispose();
        }
        GlobalStorage.Clear();
    }
}

public sealed class Bucket<T,TV> : IDisposable where T : notnull
{
    private Dictionary<T, CacheUnit<TV>> _storage = new();
    private readonly object _locker = new();
    public readonly string Name;
    private readonly string _path;
    public bool IsDisposed { get; private set; }

    public Bucket(string name)
    {
        Name = name;
        _path = Path.Combine(CacheManager.Folder, name + ".bucket");
        Unstash();
    }

    public void Unstash()
    {
        if (!File.Exists(_path))
            return;
        
        lock(_locker)
        {
            var storage = JsonSerializer.Deserialize<Dictionary<T, CacheUnit<TV>>>(File.ReadAllText(_path));
            if (storage == null || storage.Count == 0)
                return;

            _storage = storage;  
        }
    }

    public void Stash()
    {
        lock (_locker)
        {
            _storage.Where(item => item.Value.IsExpired)
                .AsParallel()
                .ForAll(o =>
                    {
                        _storage.Remove(o.Key);
                    }
                );
            
            if(_storage.Count == 0)
            {
                return;
            }
            //#if !DEBUG
            File.WriteAllText(_path,
                JsonSerializer.Serialize(_storage)
            );
            //#endif
        }
    }
    
    public bool Store(T key, TV data, TimeSpan cacheDuration,bool overwrite = true)
    {
        lock(_locker)
        {
            if (!overwrite && _storage.TryGetValue(key,out var cache) && !cache.IsExpired)
            {
                return false;
            }

            _storage[key] = new CacheUnit<TV> { Data = data, ExpiresAt = DateTime.UtcNow + cacheDuration};
            return true;
        }
    }
    
    public bool TryGet(T key,out TV? value)
    {
        value = default;

        lock(_locker)
        {
            if (!_storage.TryGetValue(key, out var cache))
                return false;

            if (cache.IsExpired)
            {
                _storage.Remove(key);
                return false;
            }

            value = cache.Data;
            return true;
        }
    }
    
    ~Bucket()
    {
        Dispose(disposing: false);
    }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }
    
    public void Dispose(bool disposing)
    {
        if (IsDisposed)
            return;

        IsDisposed = true;
        if (!disposing)
            return;
        
        Stash();
        _storage.Clear();
    }
    
    
    

}

public sealed class CacheUnit<T>
{
    public T? Data { get; set; }
    public DateTime ExpiresAt { get; set; }

    [JsonIgnore]
    public bool IsExpired => DateTime.UtcNow > ExpiresAt;
}