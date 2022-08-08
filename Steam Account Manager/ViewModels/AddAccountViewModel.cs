using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Parsers;
using Steam_Account_Manager.Infrastructure.Validators;
using System.Net;
using System.Threading;
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
                if (NetworkConnectivityCheck())
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
                        ErrorMessage = (string)App.Current.FindResource("adv_info_collect_data");
                        var config = Config.GetInstance();

                        var steamParser = new SteamParser(steamValidator.GetSteamId64());
                        steamParser.AccountParse();
                        var nickname = steamParser.GetNickname();
                        var avatarFull = steamParser.GetSteamPicture();
                        var vacBansCount = steamParser.GetVacCount();
                        var accCreatedDate = steamParser.GetAccCreatedDate();
                        var steamLevel = steamParser.GetSteamLevel();
                        var purchasedGamesCount = steamParser.GetOwnedGamesCount();
                        config.AccountsDb.Add(new Infrastructure.Base.Account(SteamLogin, SteamPassword, nickname, steamValidator.GetSteamId64(), avatarFull, steamLevel,
                            purchasedGamesCount, vacBansCount, accCreatedDate));
                        config.SaveChanges();
                        MainWindowViewModel.AccountsViewCommand.Execute(null);
                        ErrorMessage = "";
                    }
                }

                else
                {
                    //no internet connection resource
                }
            });
            await task;
        }

        private async Task NotificationView()
        {
            MainWindowViewModel.NotificationVisible = true;
            MainWindowViewModel.NotificationContent = (string)Application.Current.FindResource("mv_account_added_notification");
            Thread.Sleep(2300);
            MainWindowViewModel.NotificationVisible = false;
        }


        public static bool NetworkConnectivityCheck()
        {
            try
            {
                var client = new WebClient();
                client.OpenRead("http://www.google.com");
                return true;
            }
            catch
            {
                return false;
            }
        }

        public AddAccountViewModel()
        {
            AddAccountAsyncCommand = new AsyncRelayCommand(async (o) =>
            {
                await AddAccount(o);
                if (ErrorMessage == "")
                {
                    ExecuteWindow(o);
                    Task.Run(() => NotificationView());
                    AccountsViewModel.FillAccountTabViews();
                }
                
            });
        }
    }
}
