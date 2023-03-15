using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.RemoteControl.Controls;
using System;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class MainRemoteControlViewModel : ObservableObject
    {
        public RelayCommand LoginViewCommand { get; set; }
        public RelayCommand GamesViewCommand { get; set; }
        public RelayCommand MessagesViewCommand { get; set; }
        public RelayCommand FriendsViewCommand { get; set; }
        public RelayCommand SteamWebViewCommand { get; set; }

        public static LoginViewModel LoginVm { get; private set; }
        public static GamesView GamesV { get; set; }
        public static FriendsView FriendsV { get; private set; }
        public static MessagesView MessagesV { get; set; }
        public static SteamWebView SteamWebV { get; private set; }

        private static bool _isPanelActive;
        public static event EventHandler IsPanelActiveChanged;
        public static bool IsPanelActive
        {
            get => _isPanelActive;
            set
            {
                _isPanelActive = value;
                IsPanelActiveChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private static object _remoteControlCurrentView;
        public static event EventHandler RemoteControlCurrentViewChanged;
        public static object RemoteControlCurrentView
        {
            get => _remoteControlCurrentView;
            set
            {
                _remoteControlCurrentView = value;
                RemoteControlCurrentViewChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private bool _isLoginView = true;
        public bool IsLoginView
        {
            get => _isLoginView;
            set => SetProperty(ref _isLoginView, value);
        }

        public MainRemoteControlViewModel()
        {
            LoginVm = new LoginViewModel();
            GamesV = new GamesView();
            //  CurrentView = MessagesV;

            //  FriendsV = new FriendsView();
            // CurrentView = FriendsV;
            RemoteControlCurrentView = GamesV;


            LoginViewCommand = new RelayCommand(o =>
            {
                IsLoginView = true;
                if (o != null && o is Account acc)
                {
                    LoginVm.Username = acc.Login;
                    LoginVm.Password = acc.Password;
                    if (!String.IsNullOrEmpty(acc.AuthenticatorPath))
                    {
                        LoginVm.AuthCode = Newtonsoft.Json.JsonConvert.DeserializeObject<SteamGuardAccount>(
                                System.IO.File.ReadAllText(acc.AuthenticatorPath)).GenerateSteamGuardCode();
                    }
                    LoginVm.LogOnCommand.Execute(null);
                }

                if (RemoteControlCurrentView != LoginVm)
                    RemoteControlCurrentView = LoginVm;
            });

            GamesViewCommand = new RelayCommand(o =>
            {
                IsLoginView = false;
                if (RemoteControlCurrentView != GamesV)
                {
                    if (GamesV == null)
                        GamesV = new GamesView();

                    RemoteControlCurrentView = GamesV;
                }
            });

            MessagesViewCommand = new RelayCommand(o =>
            {
                IsLoginView = false;
                if (RemoteControlCurrentView != MessagesV)
                {
                    if (MessagesV == null)
                        MessagesV = new MessagesView();

                    RemoteControlCurrentView = MessagesV;
                }

            });

            FriendsViewCommand = new RelayCommand(o =>
            {
                IsLoginView = false;
                if (RemoteControlCurrentView != FriendsV)
                {
                    if (FriendsV == null)
                        FriendsV = new FriendsView();

                    RemoteControlCurrentView = FriendsV;
                }
            });

            SteamWebViewCommand = new RelayCommand(o =>
            {
                IsLoginView = false;
                if (RemoteControlCurrentView != SteamWebV)
                {
                    if (SteamWebV == null)
                        SteamWebV = new SteamWebView();

                    RemoteControlCurrentView = SteamWebV;
                }
            });
        }
    }
}
