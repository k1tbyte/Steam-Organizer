using MahApps.Metro.IconPacks;
using SteamOrganizer.Infrastructure;
using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class PushNotification : Window
    {
        internal static void Open(string message, Action onClickAction = null, EPushNotificationType type = EPushNotificationType.Info)
        {
            if (App.MainWindowVM?.View?.WindowState == WindowState.Minimized && App.Config?.Notifications == false)
                return;

            var window = new PushNotification();
            window.PopupMessage.Text = message;

            if (onClickAction != null)
            {
                window.mainArea.Cursor = Cursors.Hand;
                window.mainArea.MouseLeftButtonDown += (sender, e) => onClickAction.Invoke();
            }

            if (type == EPushNotificationType.Info) { }
            else if (type == EPushNotificationType.Error)
            {
                window.PopupTitle.Text = App.FindString("word_err");
                window.PopupIcon.Kind = PackIconMaterialKind.CloseCircle;
                window.PopupIcon.Foreground = App.Current.FindResource("ErrorBrush") as Brush;
            }
            else if (type == EPushNotificationType.Warn)
            {
                window.PopupTitle.Text = App.FindString("word_warn");
                window.PopupIcon.Kind = PackIconMaterialKind.AlertCircle;
                window.PopupIcon.Foreground = App.Current.FindResource("WarningBrush") as Brush;
            }

            window.Show();
        }

        internal enum EPushNotificationType
        {
            Info,
            Warn,
            Error
        }

        #region Private

        private static IEasingFunction EasingFunction;
        private PushNotification() 
        {
            EasingFunction = EasingFunction ?? App.Current.FindResource("BaseAnimationFunction") as IEasingFunction;
            InitializeComponent();
            Loaded += (sender, e) => Win32.HideWindow(new WindowInteropHelper(this).Handle);
        } 

        private new void Show()
        {
            base.Show();

            var workingArea = SystemParameters.WorkArea;

            this.Left = workingArea.Right - this.ActualWidth;
            double top = workingArea.Bottom - this.ActualHeight;

            foreach (Window window in Application.Current.Windows)
            {
                string windowName = window.GetType().Name;

                if (windowName.Equals("PushNotification") && window != this)
                {
                    top = window.Top - this.ActualHeight;
                }
            }

            this.Top = top - 7;
        }

        private new void Close()
        {
            var anim = new ThicknessAnimation(new Thickness(0), new Thickness(this.Width, 0, 0, 0), new Duration(TimeSpan.FromSeconds(1)))
            {
                EasingFunction = EasingFunction
            };

            anim.Completed += (obj, ee) =>
            {
                foreach (Window window in Application.Current.Windows)
                {
                    string windowName = window.GetType().Name;

                    if (windowName.Equals("PushNotification") && window != this)
                    {
                        // Drop down
                        if (window.Top < this.Top)
                        {
                            var dropAnim = new DoubleAnimation(window.Top, window.Top + this.ActualHeight, new Duration(TimeSpan.FromSeconds(0.6)))
                            {
                                EasingFunction = EasingFunction
                            };

                            (window as PushNotification).BeginAnimation(TopProperty, dropAnim);
                        }
                    }
                }

                base.Close();
            };

            mainArea.BeginAnimation(MarginProperty, anim);
        }

        private void NotificationWindowClosed(object sender, EventArgs e)
        {
            if (!this.IsMouseOver)
                Close();
        }

        private void OnCloseClick(object sender, RoutedEventArgs e) => Close(); 
        #endregion
    }
}
