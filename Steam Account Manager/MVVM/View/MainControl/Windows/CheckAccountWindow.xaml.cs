using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Validators;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System;
using System.Windows;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Windows
{
    public partial class CheckAccountWindow : Window
    {
        public CheckAccountWindow() => InitializeComponent();
       
        private void CloseEvent(object sender, RoutedEventArgs e) => Close();

        private async void CheckAccountAction(object sender, RoutedEventArgs e)
        {
            if(!Utils.Common.CheckInternetConnection())
            {
                Error.Text = App.FindString("adat_cs_inf_noInternet");
                return;
            }

            if (String.IsNullOrWhiteSpace(id.Text)) return;
            Error.Text = App.FindString("adv_info_collect_data");

            var steamValidator = new SteamLinkValidator(id.Text);

            if (!await steamValidator.Validate())
            {
                Error.Text = App.FindString("adv_error_invalid_link");
                return;
            }

            var account = new Account("", "", steamValidator.SteamId64Ulong);
            if (await account.ParseInfo() == false)
            {
                Error.Text = App.FindString("adv_parse_error");
                return;
            }
            (App.MainWindow.DataContext as MainWindowViewModel).AccountDataV.DataContext = new AccountDataViewModel(account, true);
            MainWindowViewModel.AccountDataViewCommand.Execute(null);
            Close();
        }

        private void BorderDragMove(object sender, MouseButtonEventArgs e) => DragMove();
    }
}
