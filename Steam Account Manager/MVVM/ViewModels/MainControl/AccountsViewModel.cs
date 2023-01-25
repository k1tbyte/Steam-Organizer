﻿using Microsoft.Win32;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.MainControl.Controls;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using System.Windows.Data;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{

    internal class AccountsViewModel : ObservableObject
    {
        public AsyncRelayCommand UpdateDatabaseCommand { get; set; }
        private RelayCommand _addAccountWindowCommand;
        public RelayCommand NoButtonCommand { get; set; }
        public RelayCommand YesButtonCommand { get; set; }
        public RelayCommand RestoreAccountCommand { get; set; }
        public RelayCommand RestoreAccountDatabaseCommand { get; set; }
        public RelayCommand StoreAccountDatabaseCommand { get; set; }

        private string _accountName;
        private string _searchBoxText;
        private int _accountId;
        public static int TempId;

        private static bool _isDatabaseEmpty;
        public static event EventHandler IsDatabaseEmptyChanged;
        public static bool IsDatabaseEmpty
        {
            get => _isDatabaseEmpty;
            set
            {
                _isDatabaseEmpty = value;
                IsDatabaseEmptyChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public static event EventHandler ConfirmBannerChanged;
        private static bool _confirmBanner;
        public static bool ConfirmBanner
        {
            get => _confirmBanner;
            set
            {
                _confirmBanner = value;
                ConfirmBannerChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public string AccountName
        {
            get => _accountName;
            set
            {
                _accountName = value;
                OnPropertyChanged();
            }
        }

        public int AccountId
        {
            get => _accountId;
            set
            {
                _accountId = value;
                OnPropertyChanged();
            }
        }

        private ICollectionView ByNicknameSearch;

        public static event EventHandler AccountTabViewsChanged;
        private static ObservableCollection<AccountTabView> _accountTabViews;

        public static ObservableCollection<AccountTabView> AccountTabViews
        {
            get => _accountTabViews;
            set
            {
                _accountTabViews = value;
                AccountTabViewsChanged?.Invoke(null, EventArgs.Empty);
            }
        }


        public string SearchBoxText
        {
            get => _searchBoxText;
            set
            {
                if (value != _searchBoxText)
                {
                    _searchBoxText = value;
                    ByNicknameSearch.Refresh();
                    OnPropertyChanged();
                }
            }
        }

        private byte _searchModeIndex = 0;
        public byte SearchModeIndex
        {
            get => _searchModeIndex;
            set
            {
                if(value != _searchModeIndex)
                {
                    _searchModeIndex = value;
                    SearchBoxText = "";
                    OnPropertyChanged(nameof(SearchModeIndex));
                }

            }
        }

        public static void FillAccountTabViews()
        {
            ConfirmBanner = false;
            if (AccountTabViews.Count == 0)
            {
                for (int i = 0; i < Config.Accounts.Count; i++)
                {
                    AccountTabViews.Add(new AccountTabView(i));
                }
                MainWindowViewModel.TotalAccounts = Config.Accounts.Count;
                IsDatabaseEmpty = AccountTabViews.Count == 0;
            }
        }


        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static void UpdateAccountTabView(int id)
        {
            AccountTabViews[id] = new AccountTabView(id);
        }

        [MethodImpl(MethodImplOptions.AggressiveInlining)]
        public static void AddAccountTabView(int id)
        {
            AccountTabViews.Add(new AccountTabView(id));
            MainWindowViewModel.TotalAccounts++;
            IsDatabaseEmpty = false;
        }


        public static void RemoveAccount(ref int id)
        {
            TempId = id;
            if (Config.Properties.NoConfirmMode)
            {
                (App.MainWindow.DataContext as MainWindowViewModel).AccountsVm.YesButtonCommand.Execute(null);
                return;
            }

            ConfirmBanner = true;

        }


        private async Task UpdateDatabase()
        {
            try
            {
                MainWindowViewModel.IsEnabledForUser = false;
                var ids = new List<int>()
                {
                    Capacity = Config.Accounts.Count
                };

                await Task.Factory.StartNew(() =>
                {
                    for (int i = 0; i < Config.Accounts.Count; i++)
                    {
                        if (!Config.Accounts[i].ContainParseInfo) continue;
                        MainWindowViewModel.UpdatedAccountIndex = i + 1;
                        Config.Accounts[i] = new Account(
                              Config.Accounts[i].Login,
                             Config.Accounts[i].Password,
                             Config.Accounts[i].SteamId64,
                             Config.Accounts[i].Note,
                             Config.Accounts[i].EmailLogin,
                             Config.Accounts[i].EmailPass,
                             Config.Accounts[i].RockstarEmail,
                             Config.Accounts[i].RockstarPass,
                             Config.Accounts[i].UplayEmail,
                             Config.Accounts[i].UplayPass,
                             Config.Accounts[i].OriginEmail,
                             Config.Accounts[i].OriginPass,
                             Config.Accounts[i].CsgoStats,
                             Config.Accounts[i].AuthenticatorPath,
                             Config.Accounts[i].Nickname);

                        ids.Add(i);
                    }
                    MainWindowViewModel.UpdatedAccountIndex = 0;
                    MainWindowViewModel.IsEnabledForUser = true;
                    Utils.Presentation.OpenPopupMessageBox("Database has been updated!");
                    Config.SaveAccounts();
                });

                if (ids != null)
                {
                    for (short i = 0; i < ids.Count; i++)
                        UpdateAccountTabView(ids[i]);
                }
            }
            catch
            {
                MainWindowViewModel.UpdatedAccountIndex = 0;
                MainWindowViewModel.IsEnabledForUser = true;
                Utils.Presentation.OpenPopupMessageBox("Error! No Internet connection...", true);
            }

        }

        public RelayCommand AddAccountWindowCommand
        {
            get { return _addAccountWindowCommand ?? new RelayCommand(o => { OpenAddAccountWindow(); }); }
        }

        private static void OpenAddAccountWindow()
        {
            AddAccountWindow addAccountWindow = new AddAccountWindow();
            ConfirmBanner = false;
            Utils.Presentation.OpenDialogWindow(addAccountWindow);
        }

        private static bool? OpenCryptoKeyWindow(string path)
        {
            CryptoKeyWindow cryptoKeyWindow = new CryptoKeyWindow(false, path);
            cryptoKeyWindow.Owner = App.MainWindow;
            cryptoKeyWindow.WindowStartupLocation = System.Windows.WindowStartupLocation.CenterOwner;
            return cryptoKeyWindow.ShowDialog();
        }

        private void RestoreAccountFromFile(string fileName, string crypto)
        {
            var acc = (Account)Config.Deserialize(fileName, crypto);
            if(Config.Accounts.Exists(o => o.SteamId64?.GetHashCode() == acc.SteamId64?.GetHashCode()))
            {
                Utils.Presentation.OpenPopupMessageBox("An account with this SteamID already exists in the database...", true);
                return;
            }
            Config.Accounts.Add(acc);
            FillAccountTabViews();
            AccountTabViews.Add(new AccountTabView(Config.Accounts.IndexOf(acc)));
            Utils.Presentation.OpenPopupMessageBox("Account restored from file.");
            Config.SaveAccounts();
        }

        private bool FilterPredicate(object value)
        {
            if (String.IsNullOrEmpty(SearchBoxText))
                return true;

            if(value is AccountTabView tab)
            {
                if (SearchModeIndex == 0 && (tab.DataContext as AccountTabViewModel).SteamNickName?.ToLower().Contains(SearchBoxText.ToLower()) == true)
                    return true;
                else if (SearchModeIndex == 1 && (tab.DataContext as AccountTabViewModel).Note?.ToLower().Contains(SearchBoxText.ToLower()) == true)
                    return true;
            }

            return false;
        }

        public AccountsViewModel()
        {
            Config.LoadAccounts();

            AccountTabViews = new ObservableCollection<AccountTabView>();
            ByNicknameSearch = CollectionViewSource.GetDefaultView(AccountTabViews);
            ByNicknameSearch.Filter += FilterPredicate;

            //String.IsNullOrEmpty(SearchBoxText) ? true : ((AccountTabView)o).SteamNickname.Text.ToLower().Contains(SearchBoxText.ToLower());
            AccountName = "";
            AccountId = -1;
            UpdateDatabaseCommand = new AsyncRelayCommand(async (o) => await UpdateDatabase());
            NoButtonCommand = new RelayCommand(o =>
            {
                ConfirmBanner = false;
            });

            YesButtonCommand = new RelayCommand(o =>
            {
                var acc = Config.Accounts[TempId];
                var trayAccount = Config.Properties.RecentlyLoggedUsers.Find(obj => obj.SteamID64 == acc.SteamId64);
                if (trayAccount != null)
                    Config.Properties.RecentlyLoggedUsers.Remove(trayAccount);

                if (acc.SteamId64 == Config.Properties.AutoLoginUserID)
                    Config.Properties.AutoLoginUserID = null;

                Config.Accounts.Remove(acc);
                AccountTabViews.RemoveAt(TempId);
                MainWindowViewModel.TotalAccounts--;
                Config.SaveAccounts();
                IsDatabaseEmpty = AccountTabViews.Count == 0;
                ConfirmBanner = false;

            });

            RestoreAccountCommand = new RelayCommand(o =>
            {
                var fileDialog = new OpenFileDialog
                {
                    Filter = "Steam Account (.sa)|*.sa"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    try
                    {
                        RestoreAccountFromFile(fileDialog.FileName, Config.Properties.UserCryptoKey);
                    }
                    catch
                    {
                        if (OpenCryptoKeyWindow(fileDialog.FileName) == true)
                        {
                            RestoreAccountFromFile(fileDialog.FileName, Config.TempUserKey);
                        }
                    }
                }
            });

            StoreAccountDatabaseCommand = new RelayCommand(o =>
            {
                var fileDialog = new SaveFileDialog
                {
                    Filter = "Steam Account Database (.sadb)|*.sadb"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    Config.Serialize(Config.Accounts, fileDialog.FileName, Config.Properties.UserCryptoKey);
                    Utils.Presentation.OpenPopupMessageBox("The database of accounts has been saved to a file.");
                }
            });

            RestoreAccountDatabaseCommand = new RelayCommand(o =>
            {
                var fileDialog = new OpenFileDialog
                {
                    Filter = "Steam Account (.sadb)|*.sadb"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    try
                    {
                        Config.Accounts = (List<Account>)Config.Deserialize(fileDialog.FileName, Config.Properties.UserCryptoKey);
                        FillAccountTabViews();
                        Utils.Presentation.OpenPopupMessageBox("The database of accounts was restored from a file");
                        Config.SaveAccounts();
                    }
                    catch
                    {
                        if (OpenCryptoKeyWindow(fileDialog.FileName) == true)
                        {
                            Config.Accounts = (List<Account>)Config.Deserialize(fileDialog.FileName, Config.TempUserKey);
                            FillAccountTabViews();
                            Utils.Presentation.OpenPopupMessageBox("The database of accounts was restored from a file");
                            Config.SaveAccounts();
                            IsDatabaseEmpty = AccountTabViews.Count == 0;
                        }
                    }
                }

            });


            FillAccountTabViews();

            IsDatabaseEmpty = AccountTabViews.Count == 0;
        }

    }
}