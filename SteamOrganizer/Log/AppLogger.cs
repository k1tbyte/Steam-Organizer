using FlaUI.Core.Logging;
using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.Log
{
    internal class AppLogger : IDisposable
    {
        private static readonly string LogsFolderPath = $"{App.WorkingDir}\\Logs";
        private static readonly string LogPath        = $"{LogsFolderPath}\\{DateTime.Now:yyyy-MM-dd HH\\-mm\\-ss}.txt";
        private readonly StreamWriter logStream;

        private const string DebugLevel                   = "DEBUG";
        private const string GenericFatalExceptionLevel   = "GENERIC-FATAL-EXCEPTION";
        private const string GenericWarningExceptionLevel = "GENERIC-WARN-EXCEPTION";
        private const string UnhandledExceptionLevel      = "UNHANDLED-EXCEPTION";
        private const string HandledExceptionLevel        = "HANDLED-EXCEPTION";

        public AppLogger()
        {
            if (!Directory.Exists(LogsFolderPath))
                Directory.CreateDirectory(LogsFolderPath);

            logStream = new StreamWriter(LogPath, true) { AutoFlush = true };
        }

        public void Dispose()
        {
            logStream.Dispose();
        }

        private void Log(string level, object message, string previousMethodName)
        {
#if !DEBUG
            message.ThrowIfNull();
            previousMethodName.ThrowIfNullOrEmpty();
            logStream.WriteLine($"{DateTime.Now:yyyy-MM-dd HH\\:mm\\:ss}|{level}|{previousMethodName}() | {message}");
#endif
        }

        /// <summary>
        /// Log debug message.
        /// </summary>
        public void LogGenericDebug(string message, [CallerMemberName] string previousMethodName = null)
            => Log(DebugLevel,message,previousMethodName);

        /// <summary>
        /// Fatal exception thrown by the programmer. <br/> Consequence: Notify user and app shutdown.
        /// </summary>
        public void LogGenericFatalException(FatalException exception, [CallerMemberName] string previousMethodName = null)
            => Log(GenericFatalExceptionLevel, exception, previousMethodName);

        /// <summary>
        /// Unknown unhandled exception. <br/> Consequence: app shutdown.
        /// </summary>
        public void LogUnhandledException(Exception exception, [CallerMemberName] string previousMethodName = null)
            => Log(UnhandledExceptionLevel, exception, previousMethodName);

        /// <summary>
        /// Unknown handled exception. <br/> Consequence: Notify user, nothing.
        /// </summary>
        public void LogHandledException(Exception exception, [CallerMemberName] string previousMethodName = null)
            => Log(HandledExceptionLevel, exception, previousMethodName);

        /// <summary>
        /// Warn exception thrown by the programmer. <br/> Consequence: Notify user, nothing.
        /// </summary>
        public void LogGenericWarningException(WarnException exception, [CallerMemberName] string previousMethodName = null)
            => Log(GenericWarningExceptionLevel, exception, previousMethodName);
    }
}
