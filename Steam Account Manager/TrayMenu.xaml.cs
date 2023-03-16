using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.ViewModels;
using Steam_Account_Manager.Utils;
using System;
using System.Collections.ObjectModel;
using System.Reflection;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using WinForms = System.Windows.Forms;

namespace Steam_Account_Manager
{
    public partial class TrayMenu : Window, IDisposable
    {
        private WinForms.NotifyIcon TrayIcon = new WinForms.NotifyIcon();
        private const double BaseHeight      = 94.0;
        public TrayMenu()
        {
            InitializeComponent();
            TrayIcon = new WinForms.NotifyIcon()
            {
                Text = "Steam Account Manager",
                Icon = System.Drawing.Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location),
                Visible = true,
            };

            Loaded += (sender, e) => Win32.HideWindow(new WindowInteropHelper(this).Handle); 
            this.TrayIcon.MouseDown += new WinForms.MouseEventHandler(notifier_MouseDown);
            this.TrayIcon.DoubleClick += Notifier_DoubleClick;
            this.MouseLeave += Menu_MouseLeave;
            recentlyAccs.ItemsSource = Config.Properties.RecentlyLoggedUsers;
        }


        public void Dispose()
        {
            TrayIcon?.Dispose();
            TrayIcon = null;
        }

        public void TrayListUpdate() {  }

        private void HideOrShow()
        {
            if (App.MainWindow.IsVisible)
            {
               App.MainWindow.Hide();
            }
            else
            {
                App.MainWindow.Show();
            }
            this.Hide();
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
            var newHeight = BaseHeight + Config.Properties.RecentlyLoggedUsers.Count * 29;
            if (this.Height != newHeight)
                this.Height = newHeight;

            var points = Utils.Win32.GetMousePosition();

            this.Left = points.X - this.Width + 3;
            this.Top = points.Y - this.Height + 3;
            base.Show();


        }

        private void Menu_MouseLeave(object sender, MouseEventArgs e)    =>  this.Hide();
        private void Exit_Button_Click(object sender, RoutedEventArgs e) =>  App.Shutdown();
        private void ShowOrHide_Click(object sender, RoutedEventArgs e)  =>  HideOrShow();
        private void Notifier_DoubleClick(object sender, EventArgs e)    => HideOrShow();


        private void Options_Click(object sender, RoutedEventArgs e)
        {
            if (!App.MainWindow.IsVisible)
            {
                App.MainWindow.Show();
            }
            MainWindowViewModel.SettingsViewCommand.Execute(null);
            this.Hide();
        }

        private void box_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (recentlyAccs.SelectedItem == null) return;
            var acc = Config.Accounts.Find(o => o.SteamId64.HasValue && o.SteamId64.Value == (recentlyAccs.SelectedItem as RecentlyLoggedUser).SteamID64);

            if (acc != default(Account))
                 _ = SteamHandler.ConnectToSteam(acc);
            recentlyAccs.UnselectAll();
            this.Hide();
        }
    }

}
