using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Core;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.View.Controls;
using SteamOrganizer.MVVM.View.Extensions;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Diagnostics;
using System.Windows;
using System.Windows.Data;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal sealed class AccountsViewModel : ObservableObject
    {
        public RelayCommand OpenProfileCommand { get; private set; }
        public RelayCommand ClearSearchBar { get; private set; }
        public RelayCommand RemoveAccountCommand { get; private set; }
        public ObservableCollection<Account> Accounts => App.Config.Database;
        private ICollectionView AccountsCollectionView;

        private string _searchBarText;
        public string SearchBarText
        {
            get => _searchBarText;
            set => SetProperty(ref _searchBarText, value);
        }

        #region Global DB Actions
        private void OnFailedDatabaseLoading(object sender, System.EventArgs e)
        {
            // request password for exists db
            if (System.IO.File.Exists(App.DatabasePath))
            {
                App.MainWindowVM.OpenPopupWindow(new AuthenticationView(App.DatabasePath, OnSuccessDecrypt, true), App.FindString("av_title"), OnInstallationCanceled);
            }
#if !DEBUG
            // request password for new db
            else if (Config.DatabaseKey == null)
            {
                MainWindow.OpenPopupWindow(new MVVM.View.Controls.AuthenticationView(), FindString("word_registration"), OnInstallationCanceled);
            }
#endif


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
                    App.Shutdown();
            }
        }
        private void OnDatabaseLoaded()
        {
            //We load images in another thread so as not to block the UI thread
            Utils.InBackground(() =>
            {
                for (int i = 0; i < Accounts.Count; i++)
                {
                    Accounts[i].LoadImage();
                }

                App.STAInvoke(() =>
                {
                    AccountsCollectionView = CollectionViewSource.GetDefaultView(Accounts);
              //      AccountsCollectionView.Refresh();
                });
            });
        } 
        #endregion

        public void OnRemovingAccount(object param)
        {
            var acc = (param as FrameworkElement).DataContext as Account;
            QueryPopup.GetPopup($"{App.FindString("acv_confirmDel")} {acc.Nickname}", () => Accounts.Remove(acc))
                .OpenPopup(param as FrameworkElement,System.Windows.Controls.Primitives.PlacementMode.Bottom);
        }

        public AccountsViewModel()
        {
            OpenProfileCommand = new RelayCommand((o) 
                => Process.Start($"{WebBrowser.SteamProfilesHost}{SteamIdConverter.SteamID32ToID64((uint)o)}").Dispose());

            ClearSearchBar = new RelayCommand((o) => SearchBarText = null);
            RemoveAccountCommand = new RelayCommand(OnRemovingAccount);

            App.Config.DatabaseLoaded += OnDatabaseLoaded;
            if(!App.Config.LoadDatabase())
            {
                App.Current.MainWindow.SourceInitialized += OnFailedDatabaseLoading;
                return;
            }

            for (uint i = 0; i < 18; i++)
            {
                Accounts.Add(new Account() { AccountID = i + 1, Nickname = "Test account" });
            }

            OnDatabaseLoaded();
        }

    }
}


      