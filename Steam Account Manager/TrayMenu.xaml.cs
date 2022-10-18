using Steam_Account_Manager.ViewModels;
using System;
using System.Reflection;
using System.Windows;
using System.Windows.Input;
using WinForms = System.Windows.Forms;

namespace Steam_Account_Manager
{
    public partial class TrayMenu : Window, IDisposable
    {
        private WinForms.NotifyIcon TrayIcon = new WinForms.NotifyIcon();
        public TrayMenu()
        {
            InitializeComponent();
            TrayIcon = new WinForms.NotifyIcon()
            {
                Text = "Steam Account Manager",
                Icon = System.Drawing.Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location),
                Visible = true,

            };

            this.TrayIcon.MouseDown += new WinForms.MouseEventHandler(notifier_MouseDown);
            this.TrayIcon.DoubleClick += Notifier_DoubleClick;
            this.MouseLeave += Menu_MouseLeave;
        }


        public void Dispose()
        {
            TrayIcon.Dispose();
            TrayIcon = null;
        }

        private void HideOrShow()
        {
            if (App.Current.MainWindow.WindowState == WindowState.Normal)
            {
                App.Current.MainWindow.WindowState = WindowState.Minimized;
            }
            else
            {
                App.Current.MainWindow.WindowState = WindowState.Normal;
            }
            this.Hide();
        }

        private void Notifier_DoubleClick(object sender, EventArgs e)
        {
            HideOrShow();
        }

        void notifier_MouseDown(object sender, WinForms.MouseEventArgs e)
        {
            if (e.Button == WinForms.MouseButtons.Right)
            {
                Show();
            }
        }

        public new void Show()
        {
            this.Topmost = true;
            base.Show();

            this.Owner = System.Windows.Application.Current.MainWindow;
            var points = Utilities.GetMousePosition();

            this.Left = points.X - this.ActualWidth+3;
            this.Top = points.Y - this.ActualHeight+3;
        }

        private void Menu_MouseLeave(object sender, MouseEventArgs e)
        {
            this.Hide();
        }

        private void Exit_Button_Click(object sender, RoutedEventArgs e)
        {
            App.Shutdown();
        }

        private void ShowOrHide_Click(object sender, RoutedEventArgs e)
        {
            HideOrShow();
        }

        private void Options_Click(object sender, RoutedEventArgs e)
        {
            if (App.Current.MainWindow.WindowState != WindowState.Normal)
            {
                App.Current.MainWindow.WindowState = WindowState.Normal;
            }
            MainWindowViewModel.SettingsViewCommand.Execute(null);
            this.Hide();
        }
    }
}
