using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Steam;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.View.Extensions;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.Properties;
using System;
using System.Management;
using System.Security.Principal;
using System.Windows;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class MainWindowViewModel : ObservableObject
    {

        #region Commands
        public RelayCommand SettingsCommand { get; }
        public RelayCommand RemoteControlCommand { get; }
        public RelayCommand ToolsControlCommand { get; }
        public RelayCommand AccountsCommand { get; }
        public RelayCommand OpenNotificationsCommand { get; }
        public RelayCommand NotificationInvokeCommand { get; }
        public RelayCommand NotificationRemoveCommand { get; }
        public RelayCommand NotificationClearAll { get; }
        #endregion

        #region Properties
        internal static Action<AccountsViewModel> AccountsViewInitialized;
        private ManagementEventWatcher RegistrySteamUserWatcher;
        internal Action PreviewWindowViewChanged;

        #region Views
        internal MainWindow View { get; }
        internal SettingsView Settings { get; private set; }
        internal AccountPageView AccountPage { get; private set; }
        internal AccountsView Accounts { get; private set; }
        internal RemoteControlView RemoteControl { get; private set; } 
        internal ToolsView ToolsControl { get; private set; }
        #endregion

        private bool _isNotificationsRead = true;
        public bool IsNotificationsRead
        {
            get => _isNotificationsRead;
            set => SetProperty(ref _isNotificationsRead, value);
        }

        private string _loggedInNickname;
        public string LoggedInNickname
        {
            get => _loggedInNickname;
            set => SetProperty(ref _loggedInNickname, value);
        }

        private BitmapImage _loggedInImage = null;
        public BitmapImage LoggedInImage
        {
            get => _loggedInImage;
            set => SetProperty(ref _loggedInImage, value);
        }

        private object _currentView;
        public object CurrentView
        {
            get         => _currentView;
            private set
            {
                PreviewWindowViewChanged?.Invoke();
                SetProperty(ref _currentView, value);
            }
            
        }
        #endregion

        #region Popup window api
        internal async void OpenPopupWindow(object content, string title = null, Action onClosing = null)
        {
            if (!View.IsLoaded)
                View.Show();

            if(View.PopupWindow.OpenedSemaphore.CurrentCount == 0 && await View.PopupWindow.OpenedSemaphore.WaitAsync(3000))
            {
                View.PopupWindow.OpenedSemaphore.Release();
            }

            View.PopupWindow.PopupContent = content;
            View.PopupWindow.Closed = onClosing;
            View.PopupWindow.Title.Text = title;
            View.PopupWindow.IsOpen = true;
        }

        /// <summary>
        /// Closes the popup window
        /// </summary>
        /// <param name="onClosing">The action is automatically cleared after execution</param>
        internal void ClosePopupWindow(bool unsetCallback = false)
        {
            if(unsetCallback)
            {
                View.PopupWindow.Closed = null;
            }

            View.PopupWindow.IsOpen = false;
        }

        internal void OpenPinPopup(Action<byte[]> callback,bool allowCancel = false)
        {
            View.ContentSplash.Child      = new PincodeView(allowCancel) { OnValidated = callback };
            View.ContentSplash.Visibility = Visibility.Visible;
        }

        internal void CloseSplashWindow()
        {
            View.ContentSplash.Child      = null;
            View.ContentSplash.Visibility = Visibility.Collapsed;
        }
        #endregion

        #region Notifications api
        public void Notification(MahApps.Metro.IconPacks.PackIconMaterialKind icon,string message, Action onInvokedAction = null)
        {
            View.NotificationsList.Items.Add(new Notification
            {
                Icon = icon,
                Message = message,
                OnClickAction = onInvokedAction
            });

            if (!View.IsLoaded || View.WindowState == System.Windows.WindowState.Minimized)
                PushNotification.Open(App.FindString("mwv_new_notif"));


            using (var player = new System.Media.SoundPlayer(Resources.ResourceManager.GetStream("Notification")))
            {
                player.Play();
            }

            if (!View.Notifications.IsOpen && IsNotificationsRead)
                IsNotificationsRead = false;
        }

        private void OnNotificationRemoving(object param)
        {
            View.NotificationsList.Items.Remove(param);
        }

        private void OnOpeningNotifications(object param)
        {
            View.Notifications.OpenPopup(param as FrameworkElement, PlacementMode.Bottom, true);
            IsNotificationsRead = true;
        }
        #endregion

        internal void OpenAccountPage(Account account)
        {
            account.ThrowIfNull();

            AccountPage = AccountPage ?? new AccountPageView();
            AccountPage.OpenPage(account);
            CurrentView = AccountPage;

            // We need to stop all timers and background work on page close
            // Since we do not know how the page will be closed (via the "back" button or the menu).
            // We need to bind an action when changing the view
            PreviewWindowViewChanged += OnAccountPageClosing;

            void OnAccountPageClosing()
            {
                AccountPage.Dispose();

                //After closing the page, we must free resources 1 time, so we unbind the action
                PreviewWindowViewChanged -= OnAccountPageClosing;
            }
        }

        #region Command actions
        private void OnOpeningSettings(object param)
        {
            Settings = Settings ?? new SettingsView();
            App.Config.IsPropertiesChanged = true;
            OpenPopupWindow(Settings, App.FindString("sv_title"));
        }

        private async void OnLocalLoggedInUserChanged(object sender, EventArrivedEventArgs args)
        {
            if (!WebBrowser.IsNetworkAvailable)
                return;

            var activeId = SteamRegistry.GetActiveUserSteamID();

            if (activeId == 0)
            {
                LoggedInImage = null;
                LoggedInNickname = null;
                return;
            }

            var login = SteamRegistry.GetActiveUserLogin();
            if (!string.IsNullOrEmpty(login) && App.Config.Database.Exists(o => o.SteamID64 == null && string.Equals(o.Login,login,StringComparison.OrdinalIgnoreCase),out Account anonym))
            {
                anonym.SteamID64 = activeId;
                if (await anonym.RetrieveInfo())
                {
                    anonym.InvokeBannerPropertiesChanged();
                    App.Config.SaveDatabase();
                }
            }

            var xmlPage = await App.WebBrowser.GetStringAsync($"{WebBrowser.SteamProfilesHost}{activeId}?xml=1");

            var imgHash = Regexes.AvatarHashXml.Match(xmlPage)?.Groups[0]?.Value;
            var nickname = Regexes.NicknameXml.Match(xmlPage)?.Groups[0]?.Value;

            if (string.IsNullOrEmpty(imgHash) || string.IsNullOrEmpty(nickname))
                return;

            LoggedInImage = CachingManager.GetCachedAvatar(imgHash, 80, 80);
            LoggedInNickname = $"{App.FindString("word_wlcbck")}, {nickname}";
        }


        private void InitServices()
        {
            RegistrySteamUserWatcher = new ManagementEventWatcher(
                new WqlEventQuery($"SELECT * FROM RegistryValueChangeEvent WHERE Hive = 'HKEY_USERS'" +
                                  $@"AND KeyPath = '{WindowsIdentity.GetCurrent().User.Value}\\SOFTWARE\\Valve\\Steam\\ActiveProcess' AND ValueName='ActiveUser'"));
            RegistrySteamUserWatcher.EventArrived += new EventArrivedEventHandler(OnLocalLoggedInUserChanged);
            RegistrySteamUserWatcher.Start();
            OnLocalLoggedInUserChanged(null, null);
            CheckUpdate();
        } 

        private async void CheckUpdate()
        {
            if (!WebBrowser.IsNetworkAvailable)
                return;

            var versionStr = Regexes.AppVersion.Match(await App.WebBrowser.GetStringAsync(
                "https://raw.githubusercontent.com/k1tbyte/Steam-Organizer/master/SteamOrganizer/Properties/AssemblyInfo.cs"))?.Value;

            if (versionStr == null || !Version.TryParse(versionStr, out Version version) || version <= App.Version)
                return;

            App.STAInvoke(() => Notification(MahApps.Metro.IconPacks.PackIconMaterialKind.ProgressCheck,
                $"An update to version {version.ToReadable()} is available. Click to view details",() =>
                {
                    if(!WebBrowser.IsNetworkAvailable)
                    {
                        App.WebBrowser.OpenNeedConnectionPopup();
                        return;
                    }

                    View.Notifications.IsOpen = false;

                    OpenPopupWindow(new QueryModal($"{version.ToReadable()}?", () => App.Shutdown()));

                }));
        }

        private void HandleState()
        {
            if (App.Config.MinimizeOnStart)
            {
                using (var proc = System.Diagnostics.Process.GetCurrentProcess())
                {
                    proc.MaxWorkingSet = proc.MinWorkingSet;
                }
                return;
            }

            View.Show();
        }
        #endregion

        public MainWindowViewModel(MainWindow owner)
        {
            View                      = owner;

            SettingsCommand           = new RelayCommand(OnOpeningSettings);
            AccountsCommand           = new RelayCommand(o => CurrentView = Accounts);
            RemoteControlCommand      = new RelayCommand(o => CurrentView = RemoteControl ?? (RemoteControl = new RemoteControlView()));
            ToolsControlCommand       = new RelayCommand(o => CurrentView = ToolsControl ?? (ToolsControl = new ToolsView()));
            OpenNotificationsCommand  = new RelayCommand(OnOpeningNotifications);
            NotificationRemoveCommand = new RelayCommand(OnNotificationRemoving);
            NotificationInvokeCommand = new RelayCommand(o => (o as Notification)?.OnClickAction?.Invoke());
            NotificationClearAll      = new RelayCommand(o => View.NotificationsList.Items.Clear());

            if (App.Config.PinCodeKey != null)
            {
                OpenPinPopup((key) => OnPincodeSuccess());
                HandleState();
                return;
            }

            HandleState();
            OnPincodeSuccess();

            void OnPincodeSuccess()
            {
#if DEBUG
            Utils.InBackground(InitServices);
#endif
                CurrentView = Accounts = new AccountsView();
                AccountsViewInitialized?.Invoke(Accounts.DataContext as AccountsViewModel);
                AccountsViewInitialized = null;
            }
        }
    }
}
