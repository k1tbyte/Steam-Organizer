    using System;
using System.Windows;
using Steam_Account_Manager.ViewModels.View;
using Steam_Account_Manager.Infrastructure;
using System.Collections.ObjectModel;
using System.Threading.Tasks;
using System.Collections.Generic;

namespace Steam_Account_Manager.ViewModels
{

    internal class AccountsViewModel : ObservableObject
    {
        public AsyncRelayCommand AddAccountViewOrUpdateCommand { get; set; }
        private RelayCommand _addAccountWindowCommand;
        public RelayCommand NoButtonCommand { get; set; }
        public RelayCommand YesButtonCommand { get; set; }

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

        public RelayCommand AddAccountWindowCommand
        {
            get { return _addAccountWindowCommand ?? new RelayCommand(o => { OpenAddAccountWindow(); }); }
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

        private static void OpenAddAccountWindow()
        {
            AddAccountView addAccountWindow = new AddAccountView();
            ConfirmBanner = false;
            ShowDialogWindow(addAccountWindow);
        }

        private async Task AddOrUpdate(object o)
        {
            if ((bool)o)
            {
                if (MainWindowViewModel.NetworkConnectivityCheck())
                {
                    var task = Task.Factory.StartNew(() =>
                    {
                        for (int i = 0; i < _config.AccountsDb.Count; i++)
                        {
                            //прогрессбар обновления данных об аккаунтах
                            _config.AccountsDb[i] = new Infrastructure.Base.Account(_config.AccountsDb[i].Login, _config.AccountsDb[i].Password, _config.AccountsDb[i].SteamId64);
                        }
                        _config.SaveChanges();
                    });
                    await task;
                    if (SearchBoxText != null) FillAccountTabViews(_config.SearchByNickname(SearchBoxText), SearchBoxText);
                    else FillAccountTabViews();
                }
                else
                {
                    //уведомление об отсутствии инета
                }
            }
        }


        public AccountsViewModel()
        {
            _config = Config.GetInstance();
            AccountTabViews = new ObservableCollection<AccountTabView>();
            AccountName = "";
            AccountId = -1;
            AddAccountViewOrUpdateCommand = new AsyncRelayCommand(async (o) => await AddOrUpdate(o));
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
            FillAccountTabViews();
        }

    }
}
