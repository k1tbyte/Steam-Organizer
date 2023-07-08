﻿using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Log;
using SteamOrganizer.MVVM.View.Extensions;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Storages;
using System;
using System.Collections.ObjectModel;
using System.IO;
using System.Reflection;
using System.Runtime;
using System.Threading;
using System.Threading.Tasks;
using SteamOrganizer.MVVM.Models;
using System.Windows;

namespace SteamOrganizer
{
    public sealed partial class App : Application
    {
        #region App domain info
        private static readonly Mutex Mutex             = new Mutex(true, "SteamOrganizer");
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

        internal static bool IsShuttingDown { get; private set; }
        internal static MainWindowViewModel MainWindowVM { get; private set; }
        

        private static GlobalStorage _config;
        internal static GlobalStorage Config => _config;

        #region App domain initializer
        static App()
        {
            /*AppDomain.CurrentDomain.UnhandledException += OnUnhandledException;
            TaskScheduler.UnobservedTaskException += OnUnobservedTaskException;*/

            WorkingDir      = Path.GetDirectoryName(Assembly.GetExecutingAssembly()?.Location) ?? throw new ArgumentNullException(nameof(WorkingDir));
            Version         = Assembly.GetExecutingAssembly()?.GetName()?.Version ?? throw new ArgumentNullException(nameof(Version));
            ConfigPath      = Path.Combine(WorkingDir, "config.bin");
            DatabasePath    = Path.Combine(WorkingDir, "database.dat");
            CacheFolderPath = Path.Combine(WorkingDir, ".cache");
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
            CachingManager.Init();

            _config = GlobalStorage.Load();

            MainWindow   = new MainWindow();
            MainWindowVM = MainWindow.DataContext as MainWindowViewModel;
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


        public static new void Shutdown()
        {
            IsShuttingDown = true;

            try
            {
                if (Config.IsPropertiesChanged)
                    Config.Save();

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
