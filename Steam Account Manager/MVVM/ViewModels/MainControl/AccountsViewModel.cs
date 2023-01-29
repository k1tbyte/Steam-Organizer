using Microsoft.Win32;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using Steam_Account_Manager.Utils;
using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Data;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{

    internal class AccountsViewModel : ObservableObject
    {
        #region Commands
        public AsyncRelayCommand UpdateDatabaseCommand { get; set; }
        public AsyncRelayCommand ConnectToSteamCommand { get; set; }
        public RelayCommand ConnectToSteamRemotelyCommand { get; set; }
        public RelayCommand AddAccountCommand { get; set; }
        public RelayCommand RestoreAccountCommand { get; set; }
        public RelayCommand RestoreAccountDatabaseCommand { get; set; }
        public RelayCommand StoreAccountDatabaseCommand { get; set; }
        public RelayCommand OpenProfileLinkCommand { get; set; }
        public RelayCommand OpenAccountDataCommand { get; set; }
        public RelayCommand OpenAccountNoteCommand { get; set; }
        public RelayCommand RemoveAccountCommand { get; set; } 
        #endregion

        #region Properties
        public ObservableCollection<Account> Accounts => Config.Accounts;
        public ICollectionView SearchFilter { get; }
        public Cursor GrabCursor => App.GrabCursor;

        private string _searchBoxText;
        public string SearchBoxText
        {
            get => _searchBoxText;
            set
            {
                if (value == _searchBoxText)
                    return;

                SetProperty(ref _searchBoxText, value);
                SearchFilter.Refresh();
            }
        }

        private byte _searchModeIndex = 0;
        public byte SearchModeIndex
        {
            get => _searchModeIndex;
            set
            {
                if (value == _searchModeIndex)
                    return;

                _searchModeIndex = value;
                SearchBoxText = "";
            }
        }

        private bool _changesAviable;
        public bool ChangesAviable
        {
            get => _changesAviable;
            set => SetProperty(ref _changesAviable, value);
        }

        #endregion

        #region Helpers
        private async Task UpdateDatabase()
        {
            try
            {
                App.MainWindow.IsHitTestVisible = false;

                for (int i = 0; i < Config.Accounts.Count; i++)
                {
                    if (!Config.Accounts[i].ContainParseInfo) continue;
                    MainWindowViewModel.UpdatedAccountIndex = i + 1;
                    await Config.Accounts[i].ParseInfo();
                }
                MainWindowViewModel.UpdatedAccountIndex = 0;
                Presentation.OpenPopupMessageBox("Database has been updated!");
                Config.SaveAccounts();
                SearchFilter.Refresh();
                App.MainWindow.IsHitTestVisible = true;
            }
            catch
            {
                MainWindowViewModel.UpdatedAccountIndex = 0;
                App.MainWindow.IsHitTestVisible = true;
                Presentation.OpenPopupMessageBox("Error! No Internet connection...", true);
            }
        }
        private void RestoreAccountFromFile(string fileName, string crypto)
        {
            var acc = (Account)Config.Deserialize(fileName, crypto);
            if (Config.Accounts.Exists(o => o.SteamId64.HasValue && o.SteamId64 == acc.SteamId64))
            {
                Presentation.OpenPopupMessageBox("An account with this SteamID already exists in the database...", true);
                return;
            }
            Config.Accounts.Add(acc);
            Presentation.OpenPopupMessageBox("Account restored from file.");
            Config.SaveAccounts();
        }
        private bool FilterPredicate(object value)
        {
            if (String.IsNullOrEmpty(SearchBoxText))
                return true;

            if (value is Account acc)
            {
                if (SearchModeIndex == 0 && acc.Nickname.ToLower().Contains(SearchBoxText.ToLower()) == true)
                    return true;
                else if (SearchModeIndex == 1 && acc.Note?.ToLower().Contains(SearchBoxText.ToLower()) == true)
                    return true;
            }

            return false;
        }
        #endregion

        public AccountsViewModel()
        {
            Config.LoadAccounts();

            SearchFilter = CollectionViewSource.GetDefaultView(Accounts);
            SearchFilter.Filter += FilterPredicate;

            UpdateDatabaseCommand = new AsyncRelayCommand(async (o) => await UpdateDatabase());

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
                        if (Presentation.OpenDialogWindow(new CryptoKeyWindow(false, fileDialog.FileName)) == true)
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
                    Presentation.OpenPopupMessageBox("The database of accounts has been saved to a file.");
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
                        Config.Accounts = (ObservableCollection<Account>)Config.Deserialize(fileDialog.FileName, Config.Properties.UserCryptoKey);
                        Presentation.OpenPopupMessageBox("The database of accounts was restored from a file");
                        Config.SaveAccounts();
                    }
                    catch
                    {
                        if (Presentation.OpenDialogWindow(new CryptoKeyWindow(false,fileDialog.FileName)) == true)
                        {
                            Config.Accounts = (ObservableCollection<Account>)Config.Deserialize(fileDialog.FileName, Config.TempUserKey);
                            Presentation.OpenPopupMessageBox("The database of accounts was restored from a file");
                            Config.SaveAccounts();
                        }
                    }
                }

            });


            OpenProfileLinkCommand = new RelayCommand(o => Process.Start(new ProcessStartInfo((o as Account).ProfileURL)).Dispose());

            OpenAccountDataCommand = new RelayCommand(o =>
            {
                (App.MainWindow.DataContext as MainWindowViewModel).AccountDataV.SetAsDefault();
                MainWindowViewModel.AccountDataViewCommand.Execute(o);
            });

            OpenAccountNoteCommand = new RelayCommand(o =>
            {
                (App.MainWindow.DataContext as MainWindowViewModel).AccountDataV.SetAsDefault(true);
                MainWindowViewModel.AccountDataViewCommand.Execute(o);
            });
           
            RemoveAccountCommand = new RelayCommand(o =>
            {
                if(Config.Properties.NoConfirmMode || Presentation.OpenQueryMessageBox($"{App.FindString("av_confirmation_delete1")} \"{(o as Account).Nickname}\" ? {App.FindString("av_confirmation_delete2")}", App.FindString("mv_confirmAction")))
                {
                    Config.Accounts.Remove(o as Account);
                    (App.MainWindow.DataContext as MainWindowViewModel).TotalAccounts = -1;
                    Config.SaveAccounts();
                }
            });

            AddAccountCommand = new RelayCommand(o => Presentation.OpenDialogWindow(new AddAccountWindow()));

            ConnectToSteamCommand = new AsyncRelayCommand(async (o) => await SteamHandler.ConnectToSteam(o as Account));

            ConnectToSteamRemotelyCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.RemoteControlViewCommand.Execute(null);
                (((MainWindowViewModel)App.MainWindow.DataContext).RemoteControlV.DataContext as MainRemoteControlViewModel).LoginViewCommand.Execute(o as Account);
            });

        }

    }
}
