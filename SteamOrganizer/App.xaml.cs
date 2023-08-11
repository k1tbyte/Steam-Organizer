using SteamOrganizer.Helpers;
using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Log;
using SteamOrganizer.MVVM.View.Extensions;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Storages;
using System;
using System.IO;
using System.Reflection;
using System.Runtime;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace SteamOrganizer
{
    public sealed partial class App : Application
    {
        private static readonly Task BeginInitializerTask;

        #region App domain info
        internal const string Name                      = "SteamOrganizer";
        private static readonly Mutex Mutex             = new Mutex(true, Name);
        internal static readonly Lazy<AppLogger> Logger = new Lazy<AppLogger>();
        internal static readonly WebBrowser WebBrowser  = new WebBrowser();

        internal static readonly Version Version;
        internal static readonly string WorkingDir;
        internal static readonly string ConfigPath;
        internal static readonly string DatabasePath;
        internal static readonly string CacheFolderPath;

        internal static readonly byte[] EncryptionKey = new byte[32] 
        { 
            0x45, 0x4F, 0x74, 0x7A, 0x61, 0x6E, 0x6E, 0x58, 0x45, 0x4F, 0x53, 0x64, 0x35, 0x48, 0x47, 0x42, 0x53, 0x4A, 0x76, 0x73, 0x30, 0x6F, 0x70, 0x31, 0x42, 0x48, 0x52, 0x75, 0x76, 0x46, 0x77, 0x6C 
        };

        internal static byte[] MachineID { get; private set; }

        internal static bool IsShuttingDown { get; private set; }
        internal static MainWindowViewModel MainWindowVM { get; private set; }
        internal static TrayPopup TrayMenu { get; private set; }
        internal static event Action OnStartupFinalized;


        private static GlobalStorage _config;
        internal static GlobalStorage Config => _config;

        #region App domain initializer
        static App()
        {
            BeginInitializerTask = Utils.InBackgroundAwait(() =>
            {
                MachineID = EncryptionTools.GetLocalMachineHash();
                CachingManager.Init();
                ProfileOptimization.SetProfileRoot(WorkingDir);
                ProfileOptimization.StartProfile("Startup.profile");
            });

            WorkingDir      = Path.GetDirectoryName(Assembly.GetExecutingAssembly()?.Location) ?? throw new ArgumentNullException(nameof(WorkingDir));
            Version         = Assembly.GetExecutingAssembly()?.GetName()?.Version ?? throw new ArgumentNullException(nameof(Version));
            ConfigPath      = Path.Combine(WorkingDir, "config.bin");
            DatabasePath    = Path.Combine(WorkingDir, "database.bin");
            CacheFolderPath = Path.Combine(WorkingDir, ".cache");

        }
        #endregion

        #endregion

        [STAThread]
        protected override async void OnStartup(StartupEventArgs e)
        {
#if !DEBUG
            if (!Mutex.WaitOne(TimeSpan.Zero, true))
            {
                Current.Shutdown();
                return;
            }
#endif
            AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
            TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;

            if (!ArgumentsParser.HandleStartArguments(e.Args))
                return;
            

            await BeginInitializerTask;
            BeginInitializerTask.Dispose();
            _config = GlobalStorage.Load();

            TrayMenu     = new TrayPopup();
            MainWindow   = new MainWindow();
            MainWindowVM = MainWindow.DataContext as MainWindowViewModel;

            OnStartupFinalized?.Invoke();
            OnStartupFinalized = null;
        }

        private void OnUnobservedTaskException(object sender, UnobservedTaskExceptionEventArgs e)
        {
            App.Logger.Value.LogUnhandledException(e?.Exception);
            Shutdown();
        }

        private void OnUnhandledException(object sender, UnhandledExceptionEventArgs e)
        {
            App.Logger.Value.LogUnhandledException(e?.ExceptionObject as Exception);
            Shutdown();
        }



        public static new void Shutdown()
        {
            IsShuttingDown = true;

            try
            {
                if (Config?.IsPropertiesChanged == true)
                    Config.Save();

                TrayMenu?.Dispose();
                WebBrowser?.Dispose();
                Mutex.Close();
            }
            catch (Exception e)
            {
                Logger.Value.LogHandledException(e);
            }
            finally
            {
                App.Current.Dispatcher.InvokeShutdown();
            }
        }

        public static void STAInvoke(Action action)
            => Current.Dispatcher.Invoke(action);

        public static string FindString(string resourceKey) 
        {
            var value = Current.TryFindResource(resourceKey);
            if(value == null)
            {
                App.Logger.Value.LogGenericWarningException(new WarnException($"Cannot find resource: {resourceKey}"));
            }
            else if(value is string locale) 
            {
                return locale;
            }

            return null;
        } 

    }
}
