using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Validators;
using System.Net;
using System.Threading.Tasks;
using System.Windows;

namespace Steam_Account_Manager.ViewModels
{
    internal class AddAccountViewModel : ObservableObject
    {
        public AsyncRelayCommand AddAccountAsyncCommand { get; set; }
        public RelayCommand AccountsViewCommand { get; set; }
        private string _steamLogin;
        private string _steamLink="";
        private string _steamPassword;
        private string _errorMessage;
        private string _infoMessage;

        public string InfoMessage
        {
            get => _infoMessage;
            set
            {
                _infoMessage = value;
                OnPropertyChanged();
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

        private async Task AddAccount(object o)
        {
            var task = Task.Factory.StartNew(() =>
            {
                ErrorMessage = (string)App.Current.FindResource("adv_info_connection_check");
                try
                {
                    var steamValidator = new SteamValidator(_steamLink);
                    if (steamValidator.GetSteamLinkType() == SteamValidator.SteamLinkTypes.ErrorType)
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_invalid_link");
                    }

                    else if (SteamLogin == "")
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_login_empty");
                    }

                    else if (SteamLogin.Contains(" "))
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_login_contain_spaces");
                    }

                    else if (SteamLogin.Length < 3)
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_login_shortage");
                    }

                    else if (SteamLogin.Length > 20)
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_login_overflow");
                    }

                    else if (SteamPassword == "")
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_pass_empty");
                    }

                    else if (SteamPassword.Length < 8)
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_pass_shortage");
                    }

                    else if (SteamPassword.Length > 50)
                    {
                        ErrorMessage = (string)Application.Current.FindResource("adv_error_pass_overflow");
                    }

                    else
                    {
                        try
                        {
                            ErrorMessage = (string)App.Current.FindResource("adv_info_collect_data");
                            var config = Config.GetInstance();
                            config.AccountsDb.Add(new Infrastructure.Base.Account(_steamLogin, _steamPassword, steamValidator.GetSteamId64()));
                            config.SaveChanges();
                            MainWindowViewModel.AccountsViewCommand.Execute(null);
                            ErrorMessage = "";
                        }
                        catch
                        {
                            ErrorMessage = "Error: (503) Steam is not responding";
                        }

                    }
                }
                catch { ErrorMessage = "Network error, please check your connection"; }
            });
            await task;
        }


        public AddAccountViewModel()
        {
            AddAccountAsyncCommand = new AsyncRelayCommand(async (o) =>
            {
                await AddAccount(o);
                if (ErrorMessage == "")
                {
                    ExecuteWindow(o);
                    Task.Run(() => MainWindowViewModel.NotificationView((string)Application.Current.FindResource("mv_account_added_notification")));
                    AccountsViewModel.FillAccountTabViews();
                }
                
            });
        }
    }
}
