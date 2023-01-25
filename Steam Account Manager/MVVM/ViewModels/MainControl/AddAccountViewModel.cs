using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models.AccountModel;
using Steam_Account_Manager.Infrastructure.Validators;
using Steam_Account_Manager.MVVM.Core;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal class AddAccountViewModel : ObservableObject
    {
        public AsyncRelayCommand AddAccountAsyncCommand { get; set; }
        public RelayCommand AccountsViewCommand { get; set; }
        private string _steamLogin;
        private string _steamLink = "";
        private string _steamPassword;
        private string _errorMessage;
        private bool _dontCollectInfo;
        public bool DontCollectInfo
        {
            get => _dontCollectInfo;
            set
            {
                _dontCollectInfo = value;
                OnPropertyChanged(nameof(DontCollectInfo));
            }
        }

        public string SteamLink
        {
            get => _steamLink;
            set
            {
                _steamLink = value;
                OnPropertyChanged();
            }
        }

        public string SteamPassword
        {
            get => _steamPassword;
            set
            {
                _steamPassword = value;
                OnPropertyChanged();
            }
        }

        public string SteamLogin
        {
            get => _steamLogin;
            set
            {
                _steamLogin = value;
                OnPropertyChanged();
            }
        }

        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                _errorMessage = value;
                OnPropertyChanged();
            }
        }
        private bool DataValidate()
        {
            if (SteamLogin == "")
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_login_empty");
                return false;
            }

            else if (SteamLogin.Contains(" "))
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_login_contain_spaces");
                return false;
            }

            else if (SteamLogin.Length < 3)
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_login_shortage");
                return false;
            }

            else if (SteamLogin.Length > 32)
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_login_overflow");
                return false;
            }

            else if (SteamPassword == "")
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_pass_empty");
                return false;
            }

            else if (SteamPassword.Length < 6)
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_pass_shortage");
                return false;
            }

            else if (SteamPassword.Length > 50)
            {
                ErrorMessage = (string)Application.Current.FindResource("adv_error_pass_overflow");
                return false;
            }
            else if (DontCollectInfo)
            {
                if (SteamLink.Length < 2 || SteamLink.Length > 32)
                {
                    ErrorMessage = (string)Application.Current.FindResource("adv_error_nickError");
                    return false;
                }
            }
            return true;
        }

        private async Task AddAccount(object o)
        {
            if (DontCollectInfo)
            {
                if (DataValidate())
                {
                    Config.Accounts.Add(new Account(_steamLogin, _steamPassword, _steamLink, true));
                    Config.SaveAccounts();
                    MainWindowViewModel.AccountsViewCommand.Execute(null);
                    ErrorMessage = "";
                }
            }
            else
            {
                await Task.Factory.StartNew(() =>
                {
                    ErrorMessage = (string)App.Current.FindResource("adv_info_connection_check");

                    try
                    {
                        var steamValidator = new SteamValidator(_steamLink);

                        if (steamValidator.SteamLinkType == SteamValidator.SteamLinkTypes.ErrorType)
                        {
                            ErrorMessage = (string)Application.Current.FindResource("adv_error_invalid_link");
                        }
                        else if(Config.Accounts.Exists(acc => acc.SteamId64.GetHashCode() == steamValidator.SteamId64.GetHashCode()))
                        {
                            ErrorMessage = "The account is already in the database";
                        }
                        else if (!DataValidate()) { }
                        else
                        {
                            ErrorMessage = (string)App.Current.FindResource("adv_info_collect_data");
                            Config.Accounts.Add(new Account(_steamLogin, _steamPassword, steamValidator.SteamId64));
                            Config.SaveAccounts();
                            MainWindowViewModel.AccountsViewCommand.Execute(null);
                            ErrorMessage = "";
                        }
                    }
                    catch
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_error403");
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
                if (ErrorMessage == "")
                {
                    (o as Window).Close();
                    Utils.Presentation.OpenPopupMessageBox((string)Application.Current.FindResource("mv_account_added_notification"));
                    AccountsViewModel.AddAccountTabView(Config.Accounts.Count - 1);
                }

            });
        }
    }
}
