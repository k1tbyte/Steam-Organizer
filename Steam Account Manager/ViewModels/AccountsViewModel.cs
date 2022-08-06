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

        private static Config config;
        private string _accountName;
        private string _searchBoxText;
        private int _accountId;
        public static int _tempId;

        public static event EventHandler ConfirmBannerChanged;
        private static bool _confirmBanner = false;
        public static bool ConfirmBanner
        {
            get { return _confirmBanner; }
            set
            {
                _confirmBanner = value;
                ConfirmBannerChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public string AccountName
        {
            get { return _accountName; }
            set
            {
                _accountName = value;
                OnPropertyChanged(nameof(AccountName));
            }
        }

        public int AccountId
        {
            get { return _accountId; }
            set
            {
                _accountId = value;
                OnPropertyChanged(nameof(AccountId));
            }
        }

        public RelayCommand AddAccountWindowCommand
        {
            get
            {
                return _addAccountWindowCommand ?? new RelayCommand(o =>
                {
                    OpenAddAccountWindow();
                });
            }
        }

        static public event EventHandler AccountTabViewsChanged;
        private static ObservableCollection<AccountTabView> _accountTabViews;
        public static ObservableCollection<AccountTabView> AccountTabViews
        {
            get { return _accountTabViews; }
            set
            {
                _accountTabViews = value;
                AccountTabViewsChanged?.Invoke(null, EventArgs.Empty);
            }
        }


        public string SearchBoxText
        {
            get { return _searchBoxText; }
            set
            {
                _searchBoxText = value;
                FillAccountTabViews(config.searchByNickname(value), _searchBoxText);
                OnPropertyChanged(nameof(SearchBoxText));
            }
        }

        public static void FillAccountTabViews(List<int> accountIndexes = null, string SearchBoxText = null)
        {
            AccountTabViews.Clear();
            ConfirmBanner = false;
            if (accountIndexes == null) accountIndexes = config.searchByNickname();
            foreach (var index in accountIndexes)
            {
                AccountTabViews.Add(new AccountTabView(index));
            }
            MainWindowViewModel.TotalAccounts = accountIndexes.Count;

        }

        public static void RemoveAccount(int ID)
        {
            ConfirmBanner = true;
            _tempId = ID;
        }

        private void OpenAddAccountWindow()
        {
            AddAccountView addAccountWindow = new AddAccountView();
            ConfirmBanner = false;
            ShowDialogWindow(addAccountWindow);
        }

        private async Task addOrUpdate(object o)
        {
            if ((bool)o)
            {
                if (MainWindowViewModel.NetworkConnectivityCheck())
                {
                    var task = Task.Factory.StartNew(() =>
                    {
                        for (int i = 0; i < config.accountsDB.Count; i++)
                        {
                            //прогрессбар обновления данных об аккаунтах
                            config.accountsDB[i] = new Infrastructure.Base.Account(config.accountsDB[i].login, config.accountsDB[i].password, config.accountsDB[i].steamID64);
                        }
                        config.SaveChanges();
                    });
                    await task;
                    if (SearchBoxText != null) FillAccountTabViews(config.searchByNickname(SearchBoxText), SearchBoxText);
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
            config = Config.GetInstance();
            AccountTabViews = new ObservableCollection<AccountTabView>();
            AccountName = "";
            AccountId = -1;
            AddAccountViewOrUpdateCommand = new AsyncRelayCommand(async (o) => await addOrUpdate(o));
            NoButtonCommand = new RelayCommand(o =>
            {
                ConfirmBanner = false;
            });

            YesButtonCommand = new RelayCommand(o =>
            {
                config.accountsDB.RemoveAt(_tempId);
                FillAccountTabViews();
            });
            FillAccountTabViews();
        }

    }
}
