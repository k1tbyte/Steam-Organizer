using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.Themes.MessageBoxes;
using System;
using System.Diagnostics;
using System.Linq;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.ViewModels
{
    internal class AccountTabViewModel : ObservableObject
    {
        public RelayCommand DeleteAccoundCommand { get; set; }
        public RelayCommand EditOrViewAccountCommand { get; set; }
        public RelayCommand OpenUrlProfileCommand { get; set; }
        public RelayCommand ConnectToSteamRemoteCommand { get; set; }
        public RelayCommand ViewAccountNoteModeCommand { get; set; }
        public AsyncRelayCommand ConnectToSteamCommand { get; set; }

        private string _steamPicture;
        private string _steamNickname;
        private string _steamId, _login, _password;
        private string _steamLevel;
        private int _vacCount;
        private int _id;
        private bool _containParseInfo;
        public DateTime LastUpdateTime { get; set; }

        #region Getters && setters

        public string Note { get; set; }
        public bool ContainParseInfo
        {
            get => _containParseInfo;
            set
            {
                _containParseInfo = value;
                OnPropertyChanged(nameof(ContainParseInfo));
            }
        }
        public string SteamLevel
        {
            get => _steamLevel;
            set
            {
                _steamLevel = value;
                OnPropertyChanged();
            }
        }

        public string SteamId
        {
            get => _steamId;
            set
            {
                _steamId = value;
                OnPropertyChanged();
            }
        }

        public string SteamPicture
        {
            get => _steamPicture;
            set
            {
                _steamPicture = value;
                OnPropertyChanged();
            }
        }

        public string SteamNickName
        {
            get => _steamNickname;
            set
            {
                _steamNickname = value;
                OnPropertyChanged();
            }
        }

        public int VacCount
        {
            get => _vacCount;
            set
            {
                _vacCount = value;
                OnPropertyChanged();
            }
        }

        public int Id
        {
            get => _id;
            set
            {
                _id = value;
                OnPropertyChanged();
            }
        }
        #endregion

        private async Task ConnectToSteam()
        {
            int id = Id - 1;
            bool update = false,isShuttingDown = false;
            string authPath;

            await Task.Factory.StartNew(async () =>
            {
                Config.GetPropertiesInstance();
                MainWindowViewModel.IsEnabledForUser = false;
                Config.Properties.SteamDirection = Utilities.GetSteamRegistryDirection();
                if (Config.Properties.SteamDirection != null)
                {

                    //Copy steam auth code in clipboard
                    if (!String.IsNullOrEmpty(authPath = Config.Accounts[id].AuthenticatorPath) && System.IO.File.Exists(authPath))
                    {
                        Application.Current.Dispatcher.Invoke(new Action(() =>
                        {
                            Clipboard.SetText(
                            JsonConvert.DeserializeObject<SteamGuardAccount>(
                                System.IO.File.ReadAllText(authPath)).GenerateSteamGuardCode());
                        }));
                        SteamHandler.VirtualSteamLogger(Config.Accounts[id], Config.Properties.RememberPassword, true);
                    }
                    else if (Config.Properties.RememberPassword)
                    {
                        SteamHandler.VirtualSteamLogger(Config.Accounts[id], true, false);
                    }
                    else
                    {
                        Utilities.KillSteamAndConnect(Config.Properties.SteamDirection, "-noreactlogin -login " + _login + " " + _password + " -tcp");
                        isShuttingDown = Config.Properties.ActionAfterLogin == LoggedAction.Close;
                    }

                    
                    Application.Current.Dispatcher.Invoke(new Action(() =>
                    {
                        //Сохраняем данные о недавно используемых аккаунтов
                        if (SteamId != "Unknown" && !Config.Properties.RecentlyLoggedUsers.Any(o => o.SteamID64 == SteamId))
                        {

                            if (Config.Properties.RecentlyLoggedUsers.Count < 5)
                            {

                                Config.Properties.RecentlyLoggedUsers.Add(new RecentlyLoggedUser
                                {
                                    SteamID64 = SteamId,
                                    IsRewritable = false,
                                    Nickname = _steamNickname
                                });
                                if (Config.Properties.RecentlyLoggedUsers.Count == 5)
                                    Config.Properties.RecentlyLoggedUsers[0].IsRewritable = true;


                            }
                            else
                            {
                                var index = Config.Properties.RecentlyLoggedUsers.FindIndex(o => o.IsRewritable);
                                Config.Properties.RecentlyLoggedUsers[index] = new RecentlyLoggedUser()
                                {
                                    SteamID64 = SteamId,
                                    Nickname = _steamNickname,
                                    IsRewritable = false
                                };

                                if (index == 4)
                                {
                                    Config.Properties.RecentlyLoggedUsers[0].IsRewritable = true;
                                }
                                else
                                {
                                    Config.Properties.RecentlyLoggedUsers[++index].IsRewritable = true;
                                }
                            }
                            App.Tray.TrayListUpdate();
                            Config.SaveProperties();
                        }

                        if (Config.Properties.ActionAfterLogin != LoggedAction.None)
                        {
                            switch (Config.Properties.ActionAfterLogin)
                            {
                                case LoggedAction.Close:
                                    if (isShuttingDown)
                                        App.Shutdown();
                                    break;
                                case LoggedAction.Minimize:
                                    if(App.MainWindow.IsVisible)
                                         App.MainWindow.Hide();
                                    break;
                            }
                        }
                    }));




                    MessageBoxes.PopupMessageBox((string)App.Current.FindResource("atv_inf_loggedInSteam"));
                    MainWindowViewModel.IsEnabledForUser = true;

                    //Если надо получить данные об аккаунте без информации
                    if (Config.Properties.AutoGetSteamId && !Config.Accounts[id].ContainParseInfo && MainWindowViewModel.NowLoginUserParse(15000).Result)
                    {
                        try
                        {
                            MessageBoxes.PopupMessageBox((string)App.Current.FindResource("atv_inf_getLocalAccInfo"));
                            string steamId = Utilities.SteamId32ToSteamId64(Utilities.GetSteamRegistryActiveUser());
                            Config.Accounts[id] = new Account(
                                _login, _password, steamId,
                                Config.Accounts[id].Note,
                                Config.Accounts[id].EmailLogin,
                                Config.Accounts[id].EmailPass,
                                Config.Accounts[id].RockstarEmail,
                                Config.Accounts[id].RockstarPass,
                                Config.Accounts[id].UplayEmail,
                                Config.Accounts[id].UplayPass,
                                Config.Accounts[id].OriginEmail,
                                Config.Accounts[id].OriginPass, null,
                                Config.Accounts[id].AuthenticatorPath,
                                Config.Accounts[id].Nickname);
                            Config.SaveAccounts();
                            update = true;
                        }
                        catch
                        {
                            MessageBoxes.PopupMessageBox((string)App.Current.FindResource("atv_inf_errorWhileScanning"));
                        }
                    }
                }
                else
                {
                    MessageBoxes.PopupMessageBox((string)Application.Current.FindResource("atv_inf_steamNotFound"));
                    return;
                }

            });
            if (update) AccountsViewModel.UpdateAccountTabView(id);
        }

        public AccountTabViewModel(int id)
        {
            Account account = Config.Accounts.ElementAt(id);
            Id = id + 1;
            ContainParseInfo = account.ContainParseInfo;
            LastUpdateTime = account.LastUpdateTime;
            Note = account.Note;
            if (account.ContainParseInfo)
            {
                SteamPicture = account.AvatarFull;
                VacCount = account.VacBansCount;
                SteamId = account.SteamId64;
                SteamLevel = account.SteamLevel;
            }
            else
            {
                SteamLevel = "-";
                SteamPicture = "/Images/default_steam_profile.png";
                SteamId = "Unknown";
                VacCount = -1;
            }

            SteamNickName = account.Nickname;
            _login = account.Login;
            _password = account.Password;

            EditOrViewAccountCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountDataViewCommand.Execute(Id);
            });

            ViewAccountNoteModeCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.AccountDataViewCommand.Execute(Id * -1);
            });

            OpenUrlProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo("https://steamcommunity.com/profiles/" + SteamId.ToString()) { UseShellExecute = true })) ;
            });

            DeleteAccoundCommand = new RelayCommand(o =>
            {
              AccountsViewModel.RemoveAccount(ref id);
            });

            ConnectToSteamCommand = new AsyncRelayCommand(async (o) => await ConnectToSteam());

            ConnectToSteamRemoteCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.RemoteControlViewCommand.Execute(null);
                ((MainWindowViewModel)App.MainWindow.DataContext).RemoteControlVm.LoginViewCommand.Execute(id);
            });
        }
    }
}
