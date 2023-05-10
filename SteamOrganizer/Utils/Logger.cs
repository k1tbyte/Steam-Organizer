using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.Utils
{
    internal static class Logger
    {
        private static readonly string LogsFolderPath = $"{App.WorkingDirectory}\\Logs";
        private static readonly string LogPath        = $"{LogsFolderPath}\\{DateTime.Now:yyyy-MM-dd HH\\-mm\\-ss}.txt";
        private static StreamWriter logStream;
        private static bool isInitialized;

        public static void Start()
        {
            if(isInitialized) return;

            if (!Directory.Exists(LogsFolderPath))
                Directory.CreateDirectory(LogsFolderPath);

            logStream     = new StreamWriter(LogPath, true) { AutoFlush = true };
            isInitialized = true;
        }

        public static void Stop()
        {
            if (isInitialized)
            {
                logStream.Dispose();
                isInitialized = false;
            }
        }
            
        public static void LogRuntimeError(Exception e)
        {
            if (!isInitialized)
                Start();
            logStream.Write($"{DateTime.Now:yyyy-MM-dd HH\\:mm\\:ss} | RUNTIME ERROR |: {e}\n");
        }
        
        public static void LogInfo(string message)
        {
            if (!isInitialized)
                Start();
            logStream.Write($"{DateTime.Now:yyyy-MM-dd HH\\:mm\\:ss} | INFO |: {message}\n");
        }
    }
}
