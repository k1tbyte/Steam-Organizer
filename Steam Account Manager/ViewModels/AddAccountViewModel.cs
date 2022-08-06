using System;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Parsers;
using Steam_Account_Manager.Infrastructure.Validators;
using System.Threading.Tasks;
using System.Net;
using System.Threading;

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
            get { return _infoMessage; }
            set
            { 
                _infoMessage = value;
                OnPropertyChanged(nameof(InfoMessage));
            } 
        }

        
        public string SteamLink
        {
            get { return _steamLink; }
            set
            {
                _steamLink = value;
                OnPropertyChanged(nameof(SteamLink));
            }
        }

        public string SteamPassword
        {
            get { return _steamPassword; }
            set
            {
                _steamPassword = value;
                OnPropertyChanged(nameof(SteamPassword));
            }
        }

        public string SteamLogin
        {
            get { return _steamLogin; }
            set
            {
                _steamLogin = value;
                OnPropertyChanged(nameof(SteamLogin));
            }
        }

        public string ErrorMessage
        {
            get { return _errorMessage; }
            set
            {
                _errorMessage = value;
                OnPropertyChanged(nameof(ErrorMessage));
            }
        }

        private async Task AddAccount(object o)
        {
            var task = Task.Factory.StartNew(() =>
            {
                ErrorMessage = "Network check in progress...";
                if (NetworkConnectivityCheck())
                {
                    SteamValidator steamValidator = new SteamValidator(_steamLink);
                    if (steamValidator.GetSteamLinkType() == SteamValidator.steamLinkTypes.errorType) ErrorMessage = "Invalid steam profile link!";

                    else if (SteamLogin == "") ErrorMessage = "The login field is empty!";

                    else if (SteamLogin.Contains(" ")) ErrorMessage = "Login cannot contain spaces!";

                    else if (SteamLogin.Length < 3) ErrorMessage = "The minimum login length is 3 characters!";

                    else if (SteamLogin.Length > 20) ErrorMessage = "The maximum login length is 20 characters!";

                    else if (SteamPassword == "") ErrorMessage = "The password field is empty!";

                    else if (SteamPassword.Length < 8) ErrorMessage = "The minimum password length is 8 characters!";

                    else if (SteamPassword.Length > 50) ErrorMessage = "The maximum password length is 50 characters!";

                    else
                    {
                        ErrorMessage = "Gathering account information...";
                        Config config = Config.GetInstance();

                        string nickname, avatarFull;
                        int vacBansCount;
                        DateTime accCreatedDate;
                        uint steamLevel, purchasedGamesCount;

                        SteamParser steamParser = new SteamParser(steamValidator.GetSteamID64());
                        steamParser.AccountParse();
                        nickname = steamParser.GetNickname();
                        avatarFull = steamParser.GetSteamPicture();
                        vacBansCount = steamParser.GetVacCount();
                        accCreatedDate = steamParser.GetAccCreatedDate();
                        steamLevel = steamParser.GetSteamLevel();
                        purchasedGamesCount = steamParser.GetOwnedGamesCount();
                        config.accountsDB.Add(new Infrastructure.Base.Account(SteamLogin, SteamPassword, nickname, steamValidator.GetSteamID64(), avatarFull, steamLevel,
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
            MainWindowViewModel.NotifycationContent = "New account added!";
            Thread.Sleep(2300);
            MainWindowViewModel.NotificationVisible = false;
        }


        public static bool NetworkConnectivityCheck()
        {
            try
            {
                var client = new WebClient();
                var stream = client.OpenRead("http://www.google.com");
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
