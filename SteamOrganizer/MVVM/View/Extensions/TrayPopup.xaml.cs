using MahApps.Metro.IconPacks;
using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using System;
using System.Reflection;
using System.Windows;
using System.Windows.Controls.Primitives;
using WinForms = System.Windows.Forms;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class TrayPopup : Popup, IDisposable
    {
        private readonly WinForms.NotifyIcon TrayIcon;
        public TrayPopup()
        {
            InitializeComponent();

            TrayIcon = new WinForms.NotifyIcon()
            {
                Text    = "Steam Organizer",
                Icon    = System.Drawing.Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location),
                Visible = true,
            };

            RecentlyList.ItemsSource = App.Config.RecentlyLoggedIn;
            TrayIcon.MouseClick += TrayIcon_Click;
            TrayIcon.MouseDoubleClick += TrayIcon_MouseDoubleClick;
            NotifyButton.Tag = App.Config.Notifications ? PackIconMaterialKind.BellRingOutline :
                PackIconMaterialKind.BellOffOutline;
        }

        private void TrayIcon_MouseDoubleClick(object sender, WinForms.MouseEventArgs e)
        {
            if (e.Button != WinForms.MouseButtons.Left)
                return;

            HideShowClick(null, null);
        }

        private void TrayIcon_Click(object sender, EventArgs e)
        {
            if (((System.Windows.Forms.MouseEventArgs)e).Button != WinForms.MouseButtons.Right)
                return;

            MouseHook.OnMouseAction += OnClickOutside;
            MouseHook.Hook();
            var points       = Win32.GetMousePosition();
            HorizontalOffset = points.X - this.Width - 3;
            VerticalOffset   = points.Y;
            this.IsOpen      = true;
        }

        private void OnClickOutside(int xPos, int yPos)
        {
            if(IsOpen && (xPos < HorizontalOffset || xPos > HorizontalOffset + Width) && (yPos < VerticalOffset || yPos > VerticalOffset + ActualHeight))
            { 
                IsOpen = false;
                MouseHook.OnMouseAction -= OnClickOutside;
                MouseHook.Unhook();
            }
        }

        private void OnSettingNotificationsMode(object sender, RoutedEventArgs e)
        {
            if (App.Config.Notifications)
            {
                NotifyButton.Tag = PackIconMaterialKind.BellOffOutline;
            }
            else
            {
                NotifyButton.Tag = PackIconMaterialKind.BellRingOutline;
            }
            App.Config.Notifications = !App.Config.Notifications;
            App.Config.Save();
            OnClickOutside(0, 0);
        }

        private void SettingsClick(object sender, RoutedEventArgs e)
        {
            if(App.MainWindowVM.View.WindowState == WindowState.Minimized)
            {
                App.MainWindowVM.View.Show();
            }

            App.MainWindowVM.SettingsCommand.Execute(null);
            OnClickOutside(0, 0);
        }

        private void HideShowClick(object sender, RoutedEventArgs e)
        {
            if (App.MainWindowVM.View.WindowState == WindowState.Minimized)
            {
                App.MainWindowVM.View.Show();
            }
            else
            {
                App.MainWindowVM.View.Hide();
            }

            OnClickOutside(0, 0);
        }

        private void ShutdownClick(object sender, RoutedEventArgs e)
            =>  App.Shutdown();

        public void Dispose()
        {
            TrayIcon.Dispose();
            MouseHook.Unhook();
        }
    }
}
