using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.Log;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.Storages;
using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Reflection;
using System.Runtime;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace SteamOrganizer
{
    public sealed partial class App : Application
    {
        #region App domain info
        private static readonly Mutex Mutex             = new Mutex(true, "SteamOrganizer");
        internal static readonly Lazy<AppLogger> Logger = new Lazy<AppLogger>();

        internal static readonly Version Version;
        internal static readonly string WorkingDir;
        internal static readonly string ConfigPath;
        internal static readonly string DatabasePath;

        internal static readonly byte[] EncryptionKey = new byte[32] 
        { 
            0x45, 0x4F, 0x74, 0x7A, 0x61, 0x6E, 0x6E, 0x58, 0x45, 0x4F, 0x53, 0x64, 0x35, 0x48, 0x47, 0x42, 0x53, 0x4A, 0x76, 0x73, 0x30, 0x6F, 0x70, 0x31, 0x42, 0x48, 0x52, 0x75, 0x76, 0x46, 0x77, 0x6C 
        };

        internal static bool IsShuttingDown { get; private set; }
        internal static new MainWindow MainWindow { get; private set; }
        

        private static GlobalStorage _config;
        internal static GlobalStorage Config => _config;

        #region App domain initializer
        static App()
        {
            /*AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
            TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;*/

            WorkingDir   = Path.GetDirectoryName(Assembly.GetExecutingAssembly()?.Location) ?? throw new ArgumentNullException(nameof(WorkingDir));
            Version      = Assembly.GetExecutingAssembly()?.GetName()?.Version ?? throw new ArgumentNullException(nameof(Version));
            ConfigPath   = Path.Combine(WorkingDir, "config.bin");
            DatabasePath = Path.Combine(WorkingDir, "database.dat");
        } 
        #endregion

        #endregion

        [STAThread]
        protected override void OnStartup(StartupEventArgs e)
        {
#if !DEBUG
            if (!Mutex.WaitOne(TimeSpan.Zero, true))
            {
                Current.Shutdown();
            }
#endif
            AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
            TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;

            ProfileOptimization.SetProfileRoot(WorkingDir);
            ProfileOptimization.StartProfile("Startup.profile");

            _config = GlobalStorage.Load();

            MainWindow = new MainWindow();
            MainWindow.Loaded += OnLoadingDatabase;
            MainWindow.Show();
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

        private void OnLoadingDatabase(object sender, RoutedEventArgs e)
        {
            var loadResult = Config.LoadDatabase();
            if (loadResult)
                return;

            // request password for exists db
            if (!loadResult && File.Exists(DatabasePath))
            {
                MainWindow.OpenPopupWindow(new MVVM.View.Controls.AuthenticationView(DatabasePath,OnSuccessDecrypt,true), FindString("av_title"), OnInstallationCanceled);
            }
#if !DEBUG
            // request password for new db
            else if (Config.DatabaseKey == null)
            {
                MainWindow.OpenPopupWindow(new MVVM.View.Controls.AuthenticationView(), FindString("word_registration"), OnInstallationCanceled);
            }
#endif


            void OnSuccessDecrypt(object content, byte[] key)
            {
                if(content is ObservableCollection<Account> db)
                {
                    Config.Database = db;
                    Config.DatabaseKey = key;
                    Config.Save();
                    Config.SaveDatabase();
                }
            }

            void OnInstallationCanceled()
            {
                if (_config.DatabaseKey == null)
                    App.Shutdown();
            }
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;

            try
            {
                if (Config.IsPropertiesChanged)
                    Config.Save();

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
                //Log cannot find resource
            }
            else if(value is string locale) 
            {
                return locale;
            }

            return null;
        } 

    }
}
