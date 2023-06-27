using SteamOrganizer.MVVM.View.Windows;
using System;
using System.IO;
using System.Reflection;
using System.Runtime;
using System.Threading;
using System.Windows;

namespace SteamOrganizer
{
    public sealed partial class App : Application
    {
        #region App domain info
        internal static readonly Version Version   = Assembly.GetExecutingAssembly().GetName().Version;
        internal static readonly string WorkingDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
        private static readonly Mutex Mutex        = new Mutex(true, "SteamOrganizer");

        internal static bool IsShuttingDown { get; private set; }
        internal static new MainWindow MainWindow { get; private set; }
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
            ProfileOptimization.SetProfileRoot(WorkingDir);
            ProfileOptimization.StartProfile("Startup.profile");

            MainWindow = new MainWindow();
            MainWindow.Show();
        }

        public static new void Shutdown()
        {
            IsShuttingDown = true;
            Mutex.Close();
            App.Current.Dispatcher.InvokeShutdown();
        }

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
