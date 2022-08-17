using System;
using Steam_Account_Manager.ViewModels.View;
using Steam_Account_Manager.Infrastructure;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.Win32;

namespace Steam_Account_Manager.ViewModels
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

        private static Config _config;
        private string _accountName;
        private string _searchBoxText;
        private int _accountId;
        public static int TempId;

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
                _searchBoxText = value;
                FillAccountTabViews(_config.SearchByNickname(value), _searchBoxText);
                OnPropertyChanged();
            }
        }

        public static void FillAccountTabViews(List<int> accountIndexes = null, string searchBoxText = null)
        {
            AccountTabViews.Clear();
            ConfirmBanner = false;
            if (accountIndexes == null) accountIndexes = _config.SearchByNickname();
            foreach (var index in accountIndexes)
            {
                AccountTabViews.Add(new AccountTabView(index));
            }
            MainWindowViewModel.TotalAccounts = accountIndexes.Count;

        }

        public static void RemoveAccount(ref int id)
        {
            ConfirmBanner = true;
            TempId = id;
        }


        private async Task UpdateDatabase()
        {
            try 
            {
                MainWindowViewModel.IsEnabledForUser = false;
                await Task.Factory.StartNew(() =>
                {
                    for (int i = 0; i < _config.AccountsDb.Count; i++)
                    {
                        MainWindowViewModel.UpdatedAccountIndex = i + 1;
                        _config.AccountsDb[i] = new Infrastructure.Base.Account(
                              _config.AccountsDb[i].Login,
                             _config.AccountsDb[i].Password,
                             _config.AccountsDb[i].SteamId64,
                             _config.AccountsDb[i].Note,
                             _config.AccountsDb[i].EmailLogin,
                             _config.AccountsDb[i].EmailPass,
                             _config.AccountsDb[i].RockstarEmail,
                             _config.AccountsDb[i].RockstarPass,
                             _config.AccountsDb[i].UplayEmail,
                             _config.AccountsDb[i].UplayPass,
                             _config.AccountsDb[i].CsgoStats);
                    }
                    MainWindowViewModel.UpdatedAccountIndex = 0;
                    MainWindowViewModel.IsEnabledForUser = true;
                    Task.Run(() => MainWindowViewModel.NotificationView("Database has been updated"));
                    _config.SaveChanges();
                });
                if (SearchBoxText != null) FillAccountTabViews(_config.SearchByNickname(SearchBoxText), SearchBoxText);
                else FillAccountTabViews();
            }
            catch
            {
                MainWindowViewModel.UpdatedAccountIndex = 0;
                MainWindowViewModel.IsEnabledForUser = true;
                await Task.Run(() => MainWindowViewModel.NotificationView("Error, no internet connection..."));
            }

        }

        //Window commands
        public RelayCommand AddAccountWindowCommand
        {
            get { return _addAccountWindowCommand ?? new RelayCommand(o => { OpenAddAccountWindow(); }); }
        }

        private static void OpenAddAccountWindow()
        {
            AddAccountView addAccountWindow = new AddAccountView();
            ConfirmBanner = false;
            ShowDialogWindow(addAccountWindow);
        }

        public AccountsViewModel()
        {
            _config = Config.GetInstance();
            AccountTabViews = new ObservableCollection<AccountTabView>();
            AccountName = "";
            AccountId = -1;
            UpdateDatabaseCommand = new AsyncRelayCommand(async (o) => await UpdateDatabase());
            NoButtonCommand = new RelayCommand(o =>
            {
                ConfirmBanner = false;
            });

            YesButtonCommand = new RelayCommand(o =>
            {
                _config.AccountsDb.RemoveAt(TempId);
                _config.SaveChanges();
                FillAccountTabViews();
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
                        _config.AccountsDb.Add((Infrastructure.Base.Account)Config.Deserialize(fileDialog.FileName));
                        FillAccountTabViews();
                        Task.Run(() => MainWindowViewModel.NotificationView("Account restored from file"));
                        _config.SaveChanges();
                    }
                    catch
                    {
                        Task.Run(() => MainWindowViewModel.NotificationView("File decryption error"));
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
                    Config.Serialize(_config.AccountsDb, fileDialog.FileName);
                    Task.Run(() => MainWindowViewModel.NotificationView("Database saved to file"));
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
                        _config.AccountsDb = (List<Infrastructure.Base.Account>)Config.Deserialize(fileDialog.FileName);
                        FillAccountTabViews();
                        Task.Run(() => MainWindowViewModel.NotificationView("Database restored from file"));
                        _config.SaveChanges();
                    }
                    catch
                    {
                        Task.Run(() => MainWindowViewModel.NotificationView("File decryption error"));
                    }
                }

            });


            FillAccountTabViews();
        }

    }
}
