using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.Validators;
using Steam_Account_Manager.MVVM.Core;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal class AddAccountViewModel : ObservableObject
    {
        public AsyncRelayCommand AddAccountAsyncCommand { get; set; }
        private string _errorMessage;

        public bool DontCollectInfo { get; set; }
        public string SteamLink { get; set; }
        public string SteamPassword { get; set; }
        public string SteamLogin { get; set; }
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }

        private bool DataValidate()
        {
            if (SteamLogin == "")
                ErrorMessage = App.FindString("adv_error_login_empty");
            else if (SteamLogin.Contains(" "))
                ErrorMessage = App.FindString("adv_error_login_contain_spaces");
            else if (SteamLogin.Length < 3)
                ErrorMessage = App.FindString("adv_error_login_shortage");
            else if (SteamLogin.Length > 32)
                ErrorMessage = App.FindString("adv_error_login_overflow");
            else if (SteamPassword == "")
                ErrorMessage = App.FindString("adv_error_pass_empty");
            else if (SteamPassword.Length < 6)
                ErrorMessage = App.FindString("adv_error_pass_shortage");
            else if (SteamPassword.Length > 50)
                ErrorMessage = App.FindString("adv_error_pass_overflow");
            else if (DontCollectInfo && (SteamLink.Length < 2 || SteamLink.Length > 32))
                ErrorMessage = App.FindString("adv_error_nickError");
            else
                ErrorMessage = "";

            return string.IsNullOrEmpty(ErrorMessage);
        }

        private async Task AddAccount(object o)
        {
            if (!DataValidate())
                return;

            if (DontCollectInfo)
            {
                Config.Accounts.Add(new Account(SteamLogin, SteamPassword, SteamLink, true));
                Config.SaveAccounts();
            }
            else
            {
                await Task.Factory.StartNew(() =>
                {
                    if(!Utils.Common.CheckInternetConnection())
                    {
                        ErrorMessage = App.FindString("adat_cs_inf_noInternet");
                        return;
                    }

                    try
                    {
                        var steamValidator = new SteamLinkValidator(SteamLink);

                        if (!steamValidator.Validate())
                        {
                            ErrorMessage = App.FindString("adv_error_invalid_link");
                        }
                        else if (Config.Accounts.Exists(acc => acc.SteamId64.HasValue && acc.SteamId64.Value == steamValidator.SteamId64Ulong))
                        {
                            ErrorMessage = "The account is already in the database";
                        }
                        else
                        {
                            ErrorMessage = App.FindString("adv_info_collect_data");
                            Config.Accounts.Add(new Account(SteamLink, SteamPassword, steamValidator.SteamId64Ulong)); 
                            Config.SaveAccounts();
                            ErrorMessage = "";
                        }
                    }
                    catch
                    {
                        ErrorMessage = App.FindString("adv_error_error403");
                    }
                });
            }
        }

        public AddAccountViewModel()
        {
            DontCollectInfo = Config.Properties.TakeAccountInfo;
            AddAccountAsyncCommand = new AsyncRelayCommand(async (o) =>
            {
                await AddAccount(o);
                if (string.IsNullOrEmpty(ErrorMessage))
                {
                    (o as Window).Close();
                    Utils.Presentation.OpenPopupMessageBox(App.FindString("mv_account_added_notification"));
                    AccountsViewModel.AddAccountTabView(Config.Accounts.Count - 1);
                }
            });
        }
    }
}
