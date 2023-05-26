using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.UIExtensions;
using SteamOrganizer.Utils;
using System;
using System.Diagnostics;
using System.IO;
using System.Management;
using System.Net;
using System.Security.Principal;
using System.Threading.Tasks;
using System.Windows;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class MainWindowViewModel : ObservableObject
    {
        #region Commands
        public static RelayCommand CloseCommand { get; set; }
        public static RelayCommand MinimizeCommand { get; set; }
        public static RelayCommand AccountsViewCommand { get; set; }
        public static RelayCommand SettingsViewCommand { get; set; }
        public static RelayCommand AccountDataViewCommand { get; set; }
        public static RelayCommand RemoteControlViewCommand { get; set; }
        public RelayCommand LogoutCommand { get; set; } 
        #endregion

        public AccountsView AccountsV;
        public SettingsView SettingsV;
        public RemoteControlView RemoteControlV;
        public AccountDataView AccountDataV;

        public static event EventHandler TotalAccountsChanged;
        public static event EventHandler NowLoginUserImageChanged;
        public static event EventHandler NowLoginUserNicknameChanged;
        public static ManagementEventWatcher RegistrySteamUserWatcher;
        public static bool CancellationFlag          = false;
        public static Account CollectInfoAcc         = null;
        public static DateTime CollectInfoTimeStamp;
        private static string _nowLoginUserImage     = "/Images/user.png", _nowLoginUserNickname = "Username";
        private WindowState _windowState;

        #region Properties
        public WindowState WindowState
        {
            get => _windowState;
            set => SetProperty(ref _windowState, value);
        }

        public static string NowLoginUserNickname
        {
            get => _nowLoginUserNickname;
            set
            {
                _nowLoginUserNickname = value;
                NowLoginUserNicknameChanged?.Invoke(null, EventArgs.Empty);
            }
        }
        public static string NowLoginUserImage
        {
            get => _nowLoginUserImage;
            set
            {
                _nowLoginUserImage = value;
                NowLoginUserImageChanged?.Invoke(null, EventArgs.Empty);
            }
        }
        public int TotalAccounts
        {
            get => Config.Accounts.Count;
            set => OnPropertyChanged(nameof(TotalAccounts));
        }

        public static event EventHandler NotificationVisibleChanged;
        private static bool _notificationVisible = false;
        public static bool NotificationVisible
        {
            get { return _notificationVisible; }
            set
            {
                _notificationVisible = value;
                NotificationVisibleChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        private object _currentView;
        public object CurrentView
        {
            get => _currentView;
            set => SetProperty(ref _currentView, value);
        } 
        #endregion

        private static bool IsParsing = false;
        public static async void CurrentUserChanged(object sender,EventArrivedEventArgs e)
        {
            if (IsParsing) 
                return;
            IsParsing = true;

            await Task.Factory.StartNew(async() =>
            {

                var steamID = Common.GetSteamRegistryActiveUser();
                if(steamID == 0)
                {
                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                    return;
                }

                var id64 = steamID + 76561197960265728UL;

                #region If need to get info from anonym
                if (CollectInfoAcc != null && (DateTime.Now - CollectInfoTimeStamp).Ticks < 600000000)
                {
                    try
                    {
                        if (!Config.Accounts.Exists(o => o.SteamId64 == id64))
                        {
                            Presentation.OpenPopupMessageBox(App.FindString("atv_inf_getLocalAccInfo"));
                            CollectInfoAcc.SteamId64 = id64;
                            await CollectInfoAcc.ParseInfo();
                            App.Current.Dispatcher.Invoke(() => ((App.MainWindow.DataContext as MainWindowViewModel).AccountsV.DataContext as AccountsViewModel).SearchFilter.Refresh());
                            Config.SaveAccounts();

                            NowLoginUserImage = CollectInfoAcc.AvatarFull;
                            NowLoginUserNickname = CollectInfoAcc.Nickname;
                        }
                        else goto m;
                    }
                    catch
                    {
                        Presentation.OpenPopupMessageBox((string)App.Current.FindResource("atv_inf_errorWhileScanning"));
                    }
                    CollectInfoAcc = null;
                    return;
                } 
                #endregion
              m:
                CollectInfoAcc = null;
                NowLoginUserImage    = await Common.GetSteamAvatarUrl(id64) ?? "/Images/user.png";
                NowLoginUserNickname = await Common.GetSteamNickname(id64) ?? "Username";

            });
            IsParsing = false;
        }
        private async Task CheckUpdate()
        {
            if (App.OfflineMode) return;
            await Task.Run(() =>
            {
                try
                {
                    using (var wc = new WebClient { Encoding = System.Text.Encoding.UTF8})
                    {
                        var version = Version.Parse(Common.BetweenStr(
                            wc.DownloadString("https://raw.githubusercontent.com/k1tbyte/Steam-Organizer/master/SteamOrganizer/Properties/AssemblyInfo.cs"),
                            "[assembly: AssemblyVersion(\"", "\")]", true).Replace("*", "0"));
                        if (version <= App.Version)
                            return;

                        App.Current.Dispatcher.Invoke(async () =>
                        {
                            if (new ServiceWindow(true)
                            {
                                AppendTitleText = version.ToString(3) + (version.Revision == 0 ? "" : " Beta"),
                                InnerText = await wc.DownloadStringTaskAsync("https://raw.githubusercontent.com/k1tbyte/Steam-Organizer/master/CHANGELOG.md")
                            }.ShowDialog() != true)
                                return;

                            App.MainWindow.UpdTitle.Text = App.FindString("mv_downloading");
                            App.MainWindow.UpdArea.Visibility = Visibility.Visible;

                            var URL = "https://dl.dropboxusercontent.com/s/fjoc5t8dwz5d6yq/LastUpd.zip?dl=0";
                            var downloadPath = App.WorkingDirectory + "\\downloadcache.zip";

                            await wc.OpenReadTaskAsync(URL);
                            var size = (Convert.ToDouble(wc.ResponseHeaders["Content-Length"]) / 1048576).ToString("#.# MB");

                            wc.DownloadProgressChanged += (s, e) =>
                            {
                                if (CancellationFlag)
                                    wc.CancelAsync();

                                App.MainWindow.UpdProgressBar.Percentage = e.ProgressPercentage;
                                App.MainWindow.UpdCounterTitle.Text = $"{(double)e.BytesReceived / 1048576:#.# MB}/{size}";
                            };

                            wc.DownloadFileCompleted += (s, e) =>
                            {
                                App.MainWindow.UpdArea.Visibility = Visibility.Collapsed;

                                if (e.Cancelled)
                                {
                                    if (File.Exists(downloadPath))
                                        File.Delete(downloadPath);
                                    CancellationFlag = false;
                                    return;
                                }

                                File.WriteAllText(App.WorkingDirectory + "\\update.vbs", Properties.Resources.UpdateScript);
                                Process.Start(App.WorkingDirectory + "\\update.vbs").Dispose();
                                App.Shutdown();
                            };

                            await wc.DownloadFileTaskAsync(URL, downloadPath);

                        }, System.Windows.Threading.DispatcherPriority.ApplicationIdle);
                    }
                }
                catch { }
            });
        }

        public MainWindowViewModel()
        {

            AccountsV      = new AccountsView();
            AccountDataV   = new AccountDataView();
            SettingsV      = new SettingsView();

            CurrentView = AccountsV;

            //Installation steam active user watcher
            RegistrySteamUserWatcher = new ManagementEventWatcher(new WqlEventQuery($"SELECT * FROM RegistryValueChangeEvent WHERE Hive = 'HKEY_USERS'" +
                    $@"AND KeyPath = '{WindowsIdentity.GetCurrent().User.Value}\\SOFTWARE\\Valve\\Steam\\ActiveProcess' AND ValueName='ActiveUser'"));
            RegistrySteamUserWatcher.EventArrived += new EventArrivedEventHandler(CurrentUserChanged);
            RegistrySteamUserWatcher.Start();

#if !DEBUG
            CurrentUserChanged(null, null);
            _ = CheckUpdate().ConfigureAwait(false);
#endif

            AccountsViewCommand = new RelayCommand(o =>  CurrentView = AccountsV);

            SettingsViewCommand = new RelayCommand(o => CurrentView = SettingsV);

            MinimizeCommand     = new RelayCommand(o => WindowState = WindowState.Minimized);

            AccountDataViewCommand = new RelayCommand(o =>
            {
                if(o != null)
                 AccountDataV.DataContext = new AccountDataViewModel((Account)o);
                CurrentView = AccountDataV;
            });

            RemoteControlViewCommand = new RelayCommand(o =>
            {
                App.MainWindow.RemoteControlMenu.IsChecked = true;
                RemoteControlV = RemoteControlV ?? new RemoteControlView();
                CurrentView = RemoteControlV;
            });

            CloseCommand = new RelayCommand(o =>
            {
                if (Config.Properties.MinimizeToTray)
                {
                    App.MainWindow.Hide();
                    return;
                }

                App.Shutdown();
            });

            LogoutCommand = new RelayCommand(o =>
            {
                if (NowLoginUserNickname != "Username")
                {
                    Utils.Common.KillSteamProcess();
                    Utils.Common.SetSteamRegistryRememberUser(String.Empty);

                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });

        }
    }
}
