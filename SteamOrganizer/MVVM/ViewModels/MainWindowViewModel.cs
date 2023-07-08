﻿using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.View.Extensions;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.Properties;
using System;
using System.Management;
using System.Security.Principal;
using System.Windows.Controls.Primitives;
using System.Windows;
using System.Windows.Media.Imaging;
using System.Collections.ObjectModel;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        private ManagementEventWatcher RegistrySteamUserWatcher;
        private readonly MainWindow View;

        public RelayCommand SettingsCommand { get; }
        public RelayCommand AccountsCommand { get; }
        public RelayCommand OpenNotificationsCommand { get; }
        public RelayCommand NotificationInvokeCommand { get; }
        public RelayCommand NotificationRemoveCommand { get; }
        public RelayCommand NotificationClearAll { get; }

        public SettingsView Settings { get; private set; }





        #region Properties
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
            get => _currentView;
            set => SetProperty(ref _currentView, value);
        }
        #endregion

        #region Popup window api
        internal void OpenPopupWindow(object content, string title = null, Action onClosing = null)
        {
            if (!View.IsLoaded)
                View.Show();

            View.PopupWindow.PopupContent = content;
            View.PopupWindow.Closed = onClosing;
            View.PopupWindow.Title.Text = title;
            View.PopupWindow.IsOpen = true;
        }

        /// <summary>
        /// Closes the popup window
        /// </summary>
        /// <param name="onClosing">The action is automatically cleared after execution</param>
        internal void ClosePopupWindow()
        {
            View.PopupWindow.IsOpen = false;
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

        #region Private
        private void OnOpeningSettings(object param)
        {
            Settings = Settings ?? new SettingsView();
            App.Config.IsPropertiesChanged = true;
            OpenPopupWindow(Settings, App.FindString("sv_title"));
        }

        private async void OnLocalLoggedInUserChanged(object sender, EventArrivedEventArgs args)
        {
            var userId = Convert.ToUInt32(Utils.GetUserRegistryValue(@"Software\\Valve\\Steam\\ActiveProcess", "ActiveUser"));

            if (userId == 0)
            {
                LoggedInImage = null;
                LoggedInNickname = null;
                return;
            }

            var xmlPage = await App.WebBrowser.GetStringAsync($"{WebBrowser.SteamProfilesHost}{SteamIdConverter.SteamID32ToID64(userId)}?xml=1");

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
        } 
        #endregion

        public MainWindowViewModel(MainWindow owner)
        {
            View                      = owner;
#if !DEBUG
            Utils.InBackground(InitServices);
#endif
            CurrentView = new AccountsView();
            SettingsCommand           = new RelayCommand(OnOpeningSettings);
            AccountsCommand           = new RelayCommand((o) => CurrentView = new AccountsView());
            OpenNotificationsCommand  = new RelayCommand(OnOpeningNotifications);
            NotificationRemoveCommand = new RelayCommand(OnNotificationRemoving);
            NotificationInvokeCommand = new RelayCommand((o) => (o as Notification)?.OnClickAction?.Invoke());
            NotificationClearAll      = new RelayCommand((o) => View.NotificationsList.Items.Clear());
        }
    }
}