using Steam_Account_Manager.Infrastructure.Converters;
using Steam_Account_Manager.Infrastructure.Models;
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

            var id64 = await SteamIDConverter.ToSteamID64(id.Text);

            if (id64 == 0)
            {
                Error.Text = App.FindString("adv_error_invalid_link");
                return;
            }

            var account = new Account("", "", id64);
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
