using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.MainControl.Controls;
using Steam_Account_Manager.MVVM.View.RemoteControl.Controls;
using Steam_Account_Manager.UIExtensions;
using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
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
        public MainRemoteControlView RemoteControlV;
        public AccountDataView AccountDataV;

        public static event EventHandler TotalAccountsChanged;
        public static event EventHandler NowLoginUserImageChanged;
        public static event EventHandler NowLoginUserNicknameChanged;
        public static bool CancellationFlag = false;
        private static string _nowLoginUserImage = "/Images/user.png", _nowLoginUserNickname = "Username";
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
        public static async Task<bool> NowLoginUserParse(ushort awaitingMs = 0)
        {
            if (IsParsing) 
                return false;
            IsParsing = true;
            bool accountDetected = false;
            await Task.Factory.StartNew(() =>
            {
                Thread.Sleep(awaitingMs);
                var steamID = Utils.Common.GetSteamRegistryActiveUser();
                if (steamID != 0)
                {
                    NowLoginUserImage = Utils.Common.GetSteamAvatarUrl(steamID + 76561197960265728UL) ?? "/Images/user.png";
                    NowLoginUserNickname = Utils.Common.GetSteamNickname(steamID + 76561197960265728UL) ?? "Username";
                    accountDetected = true;
                }
                else if(awaitingMs != 0)
                {
                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });
            IsParsing = false;
            return accountDetected;
        }

        private async Task CheckUpdate()
        {
            if (App.OfflineMode) return;
            await Task.Factory.StartNew(() =>
            {
                try
                {
                    using (var wc = new WebClient { Encoding = System.Text.Encoding.UTF8})
                    {
                        var version = Version.Parse(Utils.Common.BetweenStr(
                            wc.DownloadString("https://raw.githubusercontent.com/Explynex/Steam_Account_Manager/master/Steam%20Account%20Manager/Properties/AssemblyInfo.cs"),
                            "[assembly: AssemblyVersion(\"", "\")]", true).Replace("*", "0"));
                        if (version <= App.Version)
                            return;

                        App.Current.Dispatcher.Invoke(async () =>
                        {
                            if (new ServiceWindow(true)
                            {
                                AppendTitleText = version.ToString(3) + (version.Revision == 0 ? "" : " Beta"),
                                InnerText = await wc.DownloadStringTaskAsync("https://raw.githubusercontent.com/Explynex/Steam_Account_Manager/master/CHANGELOG.md")
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
            RemoteControlV = new MainRemoteControlView();
            SettingsV      = new SettingsView();

            CurrentView = AccountsV;

            _ = NowLoginUserParse().ConfigureAwait(false);
#if !DEBUG
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

                    if (!String.IsNullOrEmpty(Utils.Common.GetSteamRegistryRememberUser()))
                    {
                        Utils.Common.SetSteamRegistryRememberUser(String.Empty);
                    }

                    NowLoginUserImage = "/Images/user.png";
                    NowLoginUserNickname = "Username";
                }
            });

        }
    }
}
