using Microsoft.Win32;
using Newtonsoft.Json;
using SteamOrganizer.Helpers;
using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Parsers.Vdf;
using SteamOrganizer.Infrastructure.Steam;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.View.Extensions;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Data;
using static SteamKit2.GC.CSGO.Internal.CMsgGCCStrike15_v2_MatchmakingGC2ClientUpdate;
using Steam = SteamOrganizer.Infrastructure.Steam;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountsViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand OpenProfileCommand { get; }
        public RelayCommand ClearSearchBar { get; }
        public AsyncRelayCommand RemoveAccountCommand { get; }
        public AsyncRelayCommand LoginCommand { get; }
        public RelayCommand UpdateAccountsCommand { get; }
        public RelayCommand PinAccountCommand { get; }
        public RelayCommand AddAccountCommand { get; }
        public RelayCommand OpenAccountPageCommand { get; }
        public RelayCommand ImportDatabaseCommand { get; }
        public RelayCommand ExportDatabaseCommand { get; }
        #endregion

        #region Properties
        public ObservableCollection<Account> Accounts => App.Config.Database;
        private ICollectionView AccountsCollectionView;
        private CancellationTokenSource updateCancellation;
        private DateTime buttonSpamStub;
        private DateTime loginSpamStub;

        private readonly AccountsView View;

        private string _searchBarText;
        public string SearchBarText
        {
            get => _searchBarText;
            set
            {
                if (string.IsNullOrEmpty(value))
                {
                    AccountsCollectionView.Filter = null;
                }

                else if (AccountsCollectionView.Filter == null)
                {
                    AccountsCollectionView.Filter = OnCollectionFiltering;
                }

                _searchBarText = value;

                if (value == null)
                {
                    OnPropertyChanged();
                }

                AccountsCollectionView.Refresh();
            }
        }

        private int? _remainingUpdateCount;
        public int? RemainingUpdateCount
        {
            get => _remainingUpdateCount;
            set => SetProperty(ref _remainingUpdateCount, value);
        }
        #endregion

        #region Sorting

        private readonly string[] SortTypes = new string[]
{
            nameof(Account.SteamID64), nameof(Account.AddedDate), nameof(Account.LastUpdateDate), nameof(Account.SteamLevel)
};

        private bool _sortDirection;
        public bool SortDirection
        {
            get => _sortDirection;
            set
            {
                _sortDirection = value;
                Sort();
            }

        }
        private int _sortByIndex = -1;
        public int SortByIndex
        {
            set
            {
                if (value.Equals(_sortByIndex))
                {
                    return;
                }

                if (value == 0)
                {
                    View.SortComboBox.SelectedIndex = -1;
                    return;
                }

                _sortByIndex = value;
                Sort();
            }
        }

        private void Sort()
        {
            if (AccountsCollectionView.SortDescriptions.Count != 0)
            {
                AccountsCollectionView.SortDescriptions.Clear();
            }

            if (_sortByIndex == -1)
            {
                return;
            }

            AccountsCollectionView.SortDescriptions.Add(new SortDescription(SortTypes[_sortByIndex - 1], _sortDirection ? ListSortDirection.Descending : ListSortDirection.Ascending));
        }

        #endregion

        #region Global DB Actions
        private void OnFailedDatabaseLoading()
        {
            if(!App.MainWindowVM.View.IsShown)
            {
                App.MainWindowVM.View.Show();
            }

            // request password for exists db
            if (System.IO.File.Exists(App.DatabasePath))
            {
                App.MainWindowVM.OpenPopupWindow(new AuthenticationView(App.DatabasePath, OnSuccessDecrypt, true), App.FindString("av_title"), App.Shutdown);
            }
            // request password for new db
            else if (App.Config.DatabaseKey == null)
            {
                App.MainWindowVM.OpenPopupWindow(new AuthenticationView(CheckLocalAccunts), App.FindString("word_registration"), App.Shutdown);
            }

            void OnSuccessDecrypt(object content, byte[] key)
            {
                if (content is ObservableCollection<Account> db)
                {
                    App.Config.DatabaseKey = key;
                    App.Config.Database    = db;
                    App.Config.Save();
                    OnDatabaseLoaded();
                    OnPropertyChanged(nameof(Accounts));
                }
            }
        }

        private void CheckLocalAccunts()
        {
            try
            {
                var steamPath = SteamRegistry.GetSteamDirectoryPath();

                if (steamPath == null || steamPath.Length == 0 || !WebBrowser.IsNetworkAvailable)
                    return;

                var steamCfg = new VdfDeserializer(System.IO.File.ReadAllText($"{steamPath}\\config\\config.vdf")).Deserialize() as VdfTable;
                var accountsTable = steamCfg
                    .TryGetTable("Software")
                    .TryGetTable("valve")
                    .TryGetTable("Steam")
                    .TryGetTable("Accounts");

                if (accountsTable == null || accountsTable.Count == 0)
                    return;

                var uniqueAccs = new Dictionary<ulong, string>();
                foreach (var item in accountsTable.Cast<VdfTable>())
                {
                    var id64 = (ulong)(item[0] as VdfDecimal).Content;
                    if (uniqueAccs.ContainsKey(id64))
                        continue;

                    uniqueAccs.Add(id64, item.Name);
                }

                App.MainWindowVM.OpenPopupWindow(
                    new QueryModal(
                        $"Previously authorized accounts have been found on your computer ({uniqueAccs.Count}). Passwords will need to be entered manually after import. Import these accounts?",
                        () =>
                        {
                            App.Config.Database             = new ObservableCollection<Account>(uniqueAccs.Select(o => new Account(o.Value, null, o.Key)));
                            AccountsCollectionView          = CollectionViewSource.GetDefaultView(Accounts);
                            OnPropertyChanged(nameof(Accounts));
                            OnUpdatingAccounts(null);
                        }),"Accounts import");
            }
            catch(Exception e)
            {
                App.Logger.Value.LogHandledException(e);
            }
        }

        private async Task CheckPlannedDatabaseUpdate()
        {
            if (App.Config.AutoUpdateDbDelay == 0 || Accounts.Count == 0)
                return;

            var delay = App.Config.AutoUpdateDbDelay == 1 ? 1 : App.Config.AutoUpdateDbDelay == 2 ? 7 : 30;

            var now = DateTime.Now;

            var planned = Accounts.Where(o => o.SteamID64 != null &&
            ((o.LastUpdateDate != null && (now - o.LastUpdateDate.Value).Days >= delay) ||
            (o.LastUpdateDate == null && (now - o.AddedDate).Days >= delay))).ToList();

            if (planned.Count == 0)
                return;

            if(planned.Count == 1)
            {
                if (!await planned[0].RetrieveInfo(true))
                    return;
            }
            else
            {
                using (updateCancellation = new CancellationTokenSource())
                {
                    if (await SteamParser.ParseInfo(planned, updateCancellation.Token) != SteamParser.EParseResult.OK)
                        return;

                    App.MainWindowVM.Notification(MahApps.Metro.IconPacks.PackIconMaterialKind.DatabaseClockOutline,
                        $"Some accounts ({planned.Count}) have not been updated for a long time and were updated in the background");
                    App.Config.SaveDatabase();
                    AccountsCollectionView.Refresh();
                }
            }

            if(App.TrayMenu.UpdateTrayAccounts(planned))
            {
                App.Config.Save();  
            }
        }

        private async void OnUpdatingAccounts(object param)
        {
            if (updateCancellation != null)
            {
                if (!updateCancellation.IsCancellationRequested)
                {
                    updateCancellation.Cancel();
                }

                return;
            }

            if ((DateTime.Now - buttonSpamStub).Ticks < 50000000)
            {
                return;
            }

            buttonSpamStub = DateTime.Now;

            if (!WebBrowser.IsNetworkAvailable)
            {
                App.WebBrowser.OpenNeedConnectionPopup();
                return;
            }

            if ((Utils.GetUnixTime() - App.Config.LastDatabaseUpdateTime) < 21600)
            {
                PushNotification.Open("The accounts have already been updated recently");
                return;
            }

            var accsWithError = new List<Account>();
            int availableAccounts = 0;

            using (updateCancellation = new CancellationTokenSource())
            {
                var result = await SteamParser.ParseInfo(App.Config.Database, updateCancellation.Token, (account, remainings, success) =>
                {
                    if (!success)
                    {
                        accsWithError.Add(account);
                    }

                    if (availableAccounts == 0)
                    {
                        availableAccounts = remainings;
                    }

                    RemainingUpdateCount = remainings;
                });

                #region Check result
                if (result == SteamParser.EParseResult.NoAccountsWithID)
                {
                    PushNotification.Open("There are no accounts available to update");
                }
                else if (result == SteamParser.EParseResult.AttemptsExceeded)
                {
                    App.MainWindowVM.Notification(MahApps.Metro.IconPacks.PackIconMaterialKind.DatabaseAlertOutline,
                        "The maximum number of attempts was exceeded when updating the account database, please try again later");
                }
                else if (result == SteamParser.EParseResult.InternalError)
                {
                    App.MainWindowVM.Notification(MahApps.Metro.IconPacks.PackIconMaterialKind.DatabaseRemoveOutline,
                        "An unexpected error occurred while updating the account database");
                }
                else
                {
                    var msg = new StringBuilder("Account database update completed. Total accounts updated: ")
                        .Append(availableAccounts);

                    if (accsWithError.Count > 0)
                    {
                        msg.Append(". The following accounts have only been partially updated: ");

                        if (accsWithError.Count <= 10)
                        {
                            msg.Append(string.Join(", ", accsWithError.Select(o => o.Nickname)));
                        }
                        else
                        {
                            msg.Append(string.Join(", ", accsWithError.Take(10).Select(o => o.Nickname)))
                                .Append("... and more (").Append(accsWithError.Count - 10).Append(')');
                        }
                    }

                    App.MainWindowVM.Notification(MahApps.Metro.IconPacks.PackIconMaterialKind.DatabaseCheckOutline, msg.ToString());
                    App.Config.SaveDatabase();
                    App.Config.LastDatabaseUpdateTime = Utils.GetUnixTime();
                    App.TrayMenu.UpdateTrayAccounts(App.Config.Database);
                    App.Config.Save();
                    AccountsCollectionView.Refresh();
                }
                #endregion
            }

            RemainingUpdateCount = null;
            updateCancellation = null;
        }

        private async void OnDatabaseLoaded()
        {
            AccountsCollectionView = CollectionViewSource.GetDefaultView(Accounts);

            if (WebBrowser.IsNetworkAvailable)
            {
                await CheckPlannedDatabaseUpdate();
                return;
            }

            #region Postpone cheking for later
            WebBrowser.OnNetworkConnection += CheckPlannedWhenConnected;
            async void CheckPlannedWhenConnected()
            {
                WebBrowser.OnNetworkConnection -= CheckPlannedWhenConnected;
                await CheckPlannedDatabaseUpdate();
            } 
            #endregion
        } 
        #endregion

        private bool OnCollectionFiltering(object param)
        {
            if (!(param is Account acc))
            {
                return false;
            }

            return acc.Nickname.IndexOf(_searchBarText, StringComparison.InvariantCultureIgnoreCase) >= 0;
        }

        private async Task OnRemovingAccount(object param)
        {
            var acc = (param as FrameworkElement).DataContext as Account;

            if(acc.IsCurrentlyUpdating || _remainingUpdateCount != null)
            {
                await Utils.OpenAutoClosableToolTip(param as FrameworkElement, "Account is being updated...", 2000);
                return;
            }

            QueryPopup.GetPopup($"{App.FindString("acv_confirmDel")} {acc.Nickname}",Removed)
                .OpenPopup(param as FrameworkElement,System.Windows.Controls.Primitives.PlacementMode.Bottom);

            void Removed()
            {
                Accounts.Remove(acc);
                App.Config.SaveDatabase();
                if(App.Config.RecentlyLoggedIn.Exists(o => o.Item2 == acc.SteamID64,out Tuple<string,ulong> element))
                {
                    App.Config.RecentlyLoggedIn.Remove(element);
                }
                App.Config.Save();
            }
        }

        private void OnPinningAccount(object param)
        {
            var acc = param as Account;

            var index = Accounts.IndexOf(acc);

            #region Pinning

            if (!acc.Pinned)
            {
                //Since there is a fixed element in front of it - the current one is already in its place and does not require moving
                if (index != 0 && !Accounts[index - 1].Pinned)
                {
                    for (int i = 0, pinnedCount = 0; i < index; i++)
                    {
                        if (!Accounts[i].Pinned)
                        {
                            acc.UnpinIndex = index - pinnedCount;
                            Accounts.Move(index, i);
                            break;
                        }
                        pinnedCount++;
                    }
                }

                acc.Pinned = true;
                return;
            }

            #endregion

            #region Unpin

            int? minAllowedIndex = null;

            for (int i = index + 1; i < Accounts.Count; i++)
            {
                if (!Accounts[i].Pinned)
                {
                    minAllowedIndex = i;
                    break;
                }
            }

            try
            {
                // If there is only 1 element in the collection or only 1 is pinned and it was the first item before pinning
                if (Accounts.Count == 1 || (minAllowedIndex.HasValue && minAllowedIndex.Value - 1 == 0 && acc.UnpinIndex == 0))
                {
                    return;
                }

                //No places/all items are pinned or unpinning index greater than items count
                if (!minAllowedIndex.HasValue || acc.UnpinIndex >= Accounts.Count)
                {
                    Accounts.Move(index, Accounts.Count - 1);
                    return;
                }

                Accounts.Move(index, acc.UnpinIndex < minAllowedIndex.Value - 1 ? minAllowedIndex.Value - 1 : acc.UnpinIndex);
            }
            finally
            {
                acc.Pinned = false;
                acc.UnpinIndex = 0;
            } 

            #endregion
        }

        private void OnAddingAccount(object param)
        {
            App.MainWindowVM.OpenPopupWindow(new AccountAddingView(),"New account");
        }

        private void OnDatabaseImport(object param)
        {
            var fileDialog = new OpenFileDialog
            {
                Filter = "Steam organizer database (.sodb)|*.sodb",
            };

            if (fileDialog.ShowDialog() != true)
                return;

            if(!FileCryptor.Deserialize(fileDialog.FileName, out string json))
            {
                App.MainWindowVM.OpenPopupWindow(
                    new AuthenticationView(
                        fileDialog.FileName, OnImporting, false, "Enter the password to import the database"), App.FindString("av_title"));
                return;
            }

            OnImporting(json, null);

            void OnImporting(object content, byte[] keyCallback)
            {
                try
                {
                    var accounts = JsonConvert.DeserializeObject<ObservableCollection<Account>>(content as string, new JsonSerializerSettings()
                    { NullValueHandling = NullValueHandling.Ignore });

                    if (accounts == null || accounts.Count == 0)
                        return;

                    int skipped      = 0;
                    var tray         = new List<Tuple<string, ulong>>();
                    foreach (var acc in accounts)
                    {
                        if (string.IsNullOrEmpty(acc.Login) || string.IsNullOrEmpty(acc.Nickname))
                        {
                            accounts.Remove(acc);
                            skipped++;
                            continue;
                        }

                        if (acc.AddedDate == default)
                        {
                            acc.AddedDate = DateTime.Now;
                        }

                        #region Encryption

                        // !!! We don't need to decrypt the strings since they were already decrypted before being exported !!!
                        // Encrypt with local key
                        StringEncryption.EncryptAllStrings(App.Config.DatabaseKey, acc);

                        if (acc.Authenticator != null)
                        {
                            //Encrypt with local key
                            StringEncryption.EncryptAllStrings(App.Config.DatabaseKey, acc.Authenticator);
                        } 
                        #endregion

                        if (App.Config.RecentlyLoggedIn.Count > 0 && tray.Count < 5 && App.Config.RecentlyLoggedIn.Exists(o => o.Item2.Equals(acc.SteamID64)))
                        {
                            tray.Add(new Tuple<string, ulong>(acc.Nickname,acc.SteamID64.Value));
                        }
                    }

                    App.Config.RecentlyLoggedIn = new ObservableCollection<Tuple<string, ulong>>(tray);
                    FileCryptor.Serialize(accounts, App.DatabasePath, App.Config.DatabaseKey);
                    App.Config.LoadDatabase();
                    App.Config.Save();
                    OnPropertyChanged(nameof(Accounts));

                    if(skipped != 0)
                    {
                        PushNotification.Open($"Some accounts ({skipped}) cannot be imported because they do not have required data");
                    }
                }
                catch (Exception e)
                {
                    App.Logger.Value.LogHandledException(e);
                    PushNotification.Open("The selected database could not be loaded, the data may be corrupted", type: PushNotification.EPushNotificationType.Error);
                }
            }
        }

        private void OnDatabaseExport(object param)
        {
            App.MainWindowVM.OpenPopupWindow(
                new TextInputView(OnExporting, App.FindString("acv_exportTip"), true), "Export accounts");

            void OnExporting(string password)
            {
                var withCrypt = !string.IsNullOrEmpty(password);
                var fileDialog = new SaveFileDialog
                {
                    Filter = withCrypt ? "Steam Organizer Database (.sodb)|*.sodb" : "Java Script Object Notation (.json)|*.json",
                    FileName = $"DatabaseBackup {DateTime.Now:yyyy-MM-dd HH\\-mm\\-ss}"
                };

                if (fileDialog.ShowDialog() != true)
                    return;

                var jObject = JsonConvert.SerializeObject(App.Config.Database,new JsonSerializerSettings
                {
                    DefaultValueHandling = DefaultValueHandling.Ignore,
                    NullValueHandling    = NullValueHandling.Ignore,
                    Formatting           = withCrypt ? Formatting.None : Formatting.Indented,
                    ContractResolver     = new StringEncryption.EncryptionContractResolver()
                });

                if (!withCrypt)
                {
                    System.IO.File.WriteAllText(fileDialog.FileName,jObject);
                }
                else
                {
                    Utils.InBackground(() =>
                    {
                        var key = FileCryptor.GenerateEncryptionKey(password, App.EncryptionKey);
                        FileCryptor.Serialize(jObject, fileDialog.FileName, key);
                    });
                }

                PushNotification.Open(
                    "Account database successfully exported, click to open in explorer",
                    () => Process.Start(new ProcessStartInfo { Arguments = System.IO.Path.GetPathRoot(fileDialog.FileName),FileName = "explorer.exe" }).Dispose());
            }
        }

        private async Task OnLoginAccount(object param)
        {
            if (!(param is Account acc))
                return;

            if (string.IsNullOrEmpty(acc.Password))
            {
                PushNotification.Open($"Set a password to log into this account");
                await Task.Delay(3000);
                return;
            }
            if (await new Steam.LoginEmulator(acc).Login() != Steam.LoginEmulator.ELoginResult.Success)
            {
                PushNotification.Open($"Failed to login to account: \"{acc.Nickname}\"");
                return;
            }

            PushNotification.Open($"Successfully logged in to account: \"{acc.Nickname}\"");

            if (!acc.SteamID64.HasValue)
                return;

            if (!App.Config.RecentlyLoggedIn.Exists(o => o.Item2.Equals(acc.SteamID64),out int index))
            {
                if (App.Config.RecentlyLoggedIn.Count + 1 > 5)
                {
                    App.Config.RecentlyLoggedIn.RemoveAt(App.Config.RecentlyLoggedIn.Count - 1);
                }

                App.Config.RecentlyLoggedIn.Insert(0, new Tuple<string, ulong>(acc.Nickname, acc.SteamID64.Value));
            }
            else if(App.Config.RecentlyLoggedIn.Count > 1 && index != 0)
            {
                App.Config.RecentlyLoggedIn.Move(index, 0);
            }

            App.Config.Save();

            if (App.Config.ActionAfterLogin == 1)
            {
                App.MainWindowVM.View.Hide();
            }
            else if(App.Config.ActionAfterLogin == 2)
            {
                App.Shutdown();
            }
        }

        private void CancelAccountsUpdate()
        {
            if (updateCancellation == null)
                return;

            updateCancellation.Cancel();
            updateCancellation = null;
            App.MainWindowVM.Notification(
                MahApps.Metro.IconPacks.PackIconMaterialKind.WebRemove, "Internet connection lost, some accounts were not updated");
        }

        internal void RefreshCollection() => AccountsCollectionView.Refresh();

        public AccountsViewModel(AccountsView owner)
        {
            View = owner;

            ClearSearchBar         = new RelayCommand((o) => SearchBarText = null);
            RemoveAccountCommand   = new AsyncRelayCommand(OnRemovingAccount);
            UpdateAccountsCommand  = new RelayCommand(OnUpdatingAccounts);
            PinAccountCommand      = new RelayCommand(OnPinningAccount);
            AddAccountCommand      = new RelayCommand(OnAddingAccount);
            ImportDatabaseCommand  = new RelayCommand(OnDatabaseImport);
            ExportDatabaseCommand  = new RelayCommand(OnDatabaseExport);
            OpenAccountPageCommand = new RelayCommand((o) => App.MainWindowVM.OpenAccountPage(o as Account));
            OpenProfileCommand     = new RelayCommand((o) => (o as Account).OpenInBrowser());
            LoginCommand           = new AsyncRelayCommand(OnLoginAccount);

            App.Config.DatabaseLoaded += OnDatabaseLoaded;
            WebBrowser.OnNetworkDisconnection += CancelAccountsUpdate;

            if (!App.Config.LoadDatabase())
            {
                App.OnStartupFinalized += OnFailedDatabaseLoading;
                return;
            }
        }

    }
}


      