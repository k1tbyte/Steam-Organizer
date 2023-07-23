using FlaUI.Core.Tools;
using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
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

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountsViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand OpenProfileCommand { get; }
        public RelayCommand ClearSearchBar { get; }
        public AsyncRelayCommand RemoveAccountCommand { get; }
        public RelayCommand UpdateAccountsCommand { get; }
        public RelayCommand PinAccountCommand { get; }
        public RelayCommand AddAccountCommand { get; }
        public RelayCommand OpenAccountPageCommand { get; }
        #endregion

        #region Properties
        public ObservableCollection<Account> Accounts => App.Config.Database;
        private ICollectionView AccountsCollectionView;
        private CancellationTokenSource updateCancellation;
        private DateTime buttonSpamStub;

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

        private int? _remainingUpdateCount;
        public int? RemainingUpdateCount
        {
            get => _remainingUpdateCount;
            set => SetProperty(ref _remainingUpdateCount, value);
        }

        #region Global DB Actions
        private void OnFailedDatabaseLoading(object sender, EventArgs e)
        {
            // request password for exists db
            if (System.IO.File.Exists(App.DatabasePath))
            {
                App.MainWindowVM.OpenPopupWindow(new AuthenticationView(App.DatabasePath, OnSuccessDecrypt, true), App.FindString("av_title"), OnInstallationCanceled);
            }
            // request password for new db
            else if (App.Config.DatabaseKey == null)
            {
                App.MainWindowVM.OpenPopupWindow(new AuthenticationView(), App.FindString("word_registration"), OnInstallationCanceled);
            }


            void OnSuccessDecrypt(object content, byte[] key)
            {
                if (content is ObservableCollection<Account> db)
                {
                    App.Config.Database = db;
                    App.Config.DatabaseKey = key;
                    App.Config.Save();
                    App.Config.SaveDatabase();
                }
            }

            void OnInstallationCanceled()
            {
                if (App.Config.DatabaseKey == null)
                {
                    App.Shutdown();
                }
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
               await planned[0].RetrieveInfo(true);
               return;
            }

            using (updateCancellation = new CancellationTokenSource())
            {
                if (await SteamParser.ParseInfo(planned, updateCancellation.Token) == SteamParser.EParseResult.OK)
                {
                    App.MainWindowVM.Notification(MahApps.Metro.IconPacks.PackIconMaterialKind.DatabaseClockOutline,
                        $"Some accounts have not been updated for a long time and were updated in the background. ({planned.Count})");
                    App.Config.SaveDatabase();
                    App.Config.LastDatabaseUpdateTime = Utils.GetUnixTime();
                    App.Config.Save();
                }
            }

        }

        private async void OnDatabaseLoaded()
        {
            await CheckPlannedDatabaseUpdate();
            //We load images in another thread so as not to block the UI thread
            Utils.InBackground(() =>
            {
                foreach (var account in Accounts)
                {
                    if(account.AvatarBitmap == null)
                        account.LoadImage();
                }

                App.STAInvoke(() =>
                {
                    AccountsCollectionView = CollectionViewSource.GetDefaultView(Accounts);
                   // AccountsCollectionView.Refresh();
                });
            });
        } 
        #endregion

        private bool OnCollectionFiltering(object param)
        {
            if (!(param is Account acc))
            {
                return false;
            }

            return acc.Nickname.IndexOf(_searchBarText, System.StringComparison.InvariantCultureIgnoreCase) >= 0;
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


        private async void OnUpdatingAccounts(object param)
        {
            if (updateCancellation != null)
            {
                if(!updateCancellation.IsCancellationRequested)
                {
                    updateCancellation.Cancel();
                }

                return;
            }

            if((DateTime.Now - buttonSpamStub).Ticks < 50000000)
            {
                return;
            }

            if((Utils.GetUnixTime() - App.Config.LastDatabaseUpdateTime) < 83200)
            {
                PushNotification.Open("The accounts have already been updated recently");
                buttonSpamStub = DateTime.Now;
                return;
            }

            var accsWithError = new List<Account>();
            int availableAccounts = 0;
            
            using (updateCancellation = new CancellationTokenSource())
            {
                var result = await SteamParser.ParseInfo(App.Config.Database, updateCancellation.Token, (account, remainings, success) =>
                {
                    if(!success)
                    {
                        accsWithError.Add(account);
                    }

                    if(availableAccounts == 0)
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
                    App.Config.Save();
                    AccountsCollectionView.Refresh();
                } 
                #endregion
            }

            RemainingUpdateCount = null;
            updateCancellation = null;
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
            OpenAccountPageCommand = new RelayCommand((o) => App.MainWindowVM.OpenAccountPage(o as Account));
            OpenProfileCommand     = new RelayCommand((o) => (o as Account).OpenInBrowser());

            App.Config.DatabaseLoaded += OnDatabaseLoaded;
            if (!App.Config.LoadDatabase())
            {
                App.Current.MainWindow.SourceInitialized += OnFailedDatabaseLoading;
                return;
            }
        }

    }
}


      