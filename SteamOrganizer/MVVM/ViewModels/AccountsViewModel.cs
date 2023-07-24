using Microsoft.Win32;
using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Utils;
using System;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Data;
using System.Windows.Input;

namespace SteamOrganizer.MVVM.ViewModels
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
        public RelayCommand CheckAccountCommand { get; set; }
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
        public void UpdateIndexes(int startWith = 0,bool refresh = false)
        {
            for (int i = startWith; i < Accounts.Count; i++)
                Config.Accounts[i].Index = i + 1;

            if (refresh)
            {
                OnPropertyChanged(nameof(Accounts));
                SearchFilter.Refresh();
            }
                
        }

        private async Task UpdateDatabase()
        {
            App.MainWindow.UpdTitle.Text = App.FindString("av_dbAccsUpdate");
            App.MainWindow.UpdArea.Visibility = System.Windows.Visibility.Visible;
            try
            {
                for (int i = 0; i < Config.Accounts.Count; i++)
                {
                    if (MainWindowViewModel.CancellationFlag)
                        break;

                    App.MainWindow.UpdCounterTitle.Text = $"{i + 1}/{Config.Accounts.Count}";
                    App.MainWindow.UpdProgressBar.Percentage = (i + 1) * 100 / Config.Accounts.Count;
                    if (!Config.Accounts[i].ContainParseInfo) continue;
                    await Config.Accounts[i].ParseInfo();
                }
                if(!MainWindowViewModel.CancellationFlag)
                  Presentation.OpenPopupMessageBox(App.FindString("av_dbSuccessUpdated"));

                Config.SaveAccounts();
                SearchFilter.Refresh();
            }
            catch
            {
                Presentation.OpenPopupMessageBox(App.FindString("adat_cs_inf_noInternet"), true);
            }
            App.MainWindow.UpdArea.Visibility = System.Windows.Visibility.Collapsed;
            MainWindowViewModel.CancellationFlag = false;
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
            UpdateIndexes();
            SearchFilter = CollectionViewSource.GetDefaultView(Accounts);
            SearchFilter.Filter += FilterPredicate;

            UpdateDatabaseCommand = new AsyncRelayCommand(async (o) => await UpdateDatabase());

            RestoreAccountCommand = new RelayCommand(o =>
            {
                var fileDialog = new OpenFileDialog
                {
                    Filter = "Steam Account (.sa)|*.sa"
                };

                if (fileDialog.ShowDialog() != true)
                    return;

                var json = Config.Deserialize(fileDialog.FileName, Config.Properties.UserCryptoKey);

                if (json?.GetType() != typeof(string) && (Presentation.OpenDialogWindow(new CryptoKeyWindow(false, fileDialog.FileName)) != true || (json = Config.Deserialize(fileDialog.FileName, Config.TempUserKey)).GetType() != typeof(string)))
                    return;

                var acc = JsonConvert.DeserializeObject<Account>(json as string);

                acc.Index = Config.Accounts.Count + 1;
                Config.Accounts.Add(acc);
                Presentation.OpenPopupMessageBox(App.FindString("av_accRestoredFromFile"));
                Config.SaveAccounts();

            });

            StoreAccountDatabaseCommand = new RelayCommand(o =>
            {
                var fileDialog = new SaveFileDialog
                {
                    Filter = "Steam Account Database (.sadb)|*.sadb"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    if (Utils.Presentation.OpenQueryMessageBox(App.FindString("av_exportEncryptMsg"), App.FindString("av_exportEncryptTitle")))
                    {
                        Config.Serialize(JsonConvert.SerializeObject(Config.Accounts), fileDialog.FileName, Config.Properties.UserCryptoKey);
                    }
                    else Utils.Common.BinarySerialize(JsonConvert.SerializeObject(Config.Accounts), fileDialog.FileName);
                    
                }
            });

            RestoreAccountDatabaseCommand = new RelayCommand(o =>
            {
                var fileDialog = new OpenFileDialog
                {
                    Filter = "Steam Account (.sadb)|*.sadb"
                };
                if (fileDialog.ShowDialog() != true)
                    return;

                var db = Config.Deserialize(fileDialog.FileName, Config.Properties.UserCryptoKey);

                if (db?.GetType() != typeof(string) && 
                (Presentation.OpenDialogWindow(new CryptoKeyWindow(false, fileDialog.FileName)) != true || (db = Config.Deserialize(fileDialog.FileName, Config.TempUserKey)).GetType() != typeof(string)))
                    return;

                Config.Accounts = JsonConvert.DeserializeObject<ObservableCollection<Account>>(db as string);
                Presentation.OpenPopupMessageBox(App.FindString("av_dbRestoredFromFile"));
                UpdateIndexes(refresh: true);
                Config.SaveAccounts();

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
                    var acc = o as Account;

                    var tray = Config.Properties.RecentlyLoggedUsers.Find(obj => obj.SteamID64 == acc.SteamId64);
                    if (tray != null)
                        Config.Properties.RecentlyLoggedUsers.Remove(tray);

                    if (acc.SteamId64 == Config.Properties.AutoLoginUserID)
                    {
                        Config.Properties.AutoLoginUserID = null;
                        ((App.MainWindow.DataContext as MainWindowViewModel).SettingsV.DataContext as SettingsViewModel).AutoLoginAccount = null;
                    }

                    var index = acc.Index;
                    Config.Accounts.Remove(acc);
                    UpdateIndexes(index-1,true);
                    (App.MainWindow.DataContext as MainWindowViewModel).TotalAccounts = -1;
                    Config.SaveAccounts();
                }
            });

            AddAccountCommand = new RelayCommand(o => Presentation.OpenDialogWindow(new AddAccountWindow()));

            ConnectToSteamCommand = new AsyncRelayCommand(async (o) => await SteamHandler.ConnectToSteam(o as Account));

            ConnectToSteamRemotelyCommand = new RelayCommand(o =>
            {
                MainWindowViewModel.RemoteControlViewCommand.Execute(null); 
                (((MainWindowViewModel)App.MainWindow.DataContext).RemoteControlV.DataContext as RemoteControlViewModel).LogOnCommand.Execute(o as Account);
            });

            CheckAccountCommand = new RelayCommand(o => Presentation.OpenDialogWindow(new CheckAccountWindow()));

        }

    }
}
