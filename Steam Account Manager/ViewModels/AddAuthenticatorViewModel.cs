using System;
using Steam_Account_Manager.Infrastructure;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using SteamAuth;
using System.Windows.Threading;
using System.Threading;
using System.Windows;

namespace Steam_Account_Manager.ViewModels
{
    internal class AddAuthenticatorViewModel : ObservableObject
    {
        public RelayCommand StatusChanged { get; set; }
        private string _login, _password, _errorMessage, _userInput;
        private bool _isReady;
        private Window _window;

        public string UserInput
        {
            get => _userInput;
            set
            {
                _userInput = value;
                OnPropertyChanged(nameof(UserInput));
            }
        }
        public string ErrorMessage
        {
            get => _errorMessage;
            set
            {
                _errorMessage = value;
                OnPropertyChanged(nameof(ErrorMessage));
            }
        }

        private async Task TryToConnect()
        {
            await Task.Factory.StartNew(() =>
            {
                UserLogin user = new UserLogin(_login, _password);
                LoginResult response = LoginResult.BadCredentials;
                ErrorMessage = "Please wait, getting data...";

                while ((response = user.DoLogin()) != LoginResult.LoginOkay)
                {
                    switch (response)
                    {
                        case LoginResult.NeedEmail:
                            ErrorMessage = "Please enter your email code";
                            while (!_isReady) Thread.Sleep(100);
                            user.EmailCode = UserInput;
                            break;

                        case LoginResult.NeedCaptcha:
                            System.Diagnostics.Process.Start(APIEndpoints.COMMUNITY_BASE + "/public/captcha.php?gid=" + user.CaptchaGID); //Open a web browser to the captcha image
                            ErrorMessage = "Please enter captcha";
                            while (!_isReady) Thread.Sleep(100);
                            user.CaptchaText = UserInput;
                            break;

                        case LoginResult.Need2FA:
                            ErrorMessage = "Please enter your 2FA code";
                            while (!_isReady) Thread.Sleep(100);
                            user.TwoFactorCode = UserInput;
                            break;

                        case LoginResult.TooManyFailedLogins:
                            ErrorMessage = "Too many attempts, try again later";
                            Thread.Sleep(2000);
                            _window.Dispatcher.Invoke(DispatcherPriority.Normal, new ThreadStart(_window.Close));
                            return;

                        case LoginResult.GeneralFailure:
                            ErrorMessage = "Account information is incorrect, edit your account data";
                            Thread.Sleep(2000);
                            _window.Dispatcher.Invoke(DispatcherPriority.Normal, new ThreadStart(_window.Close));
                            return;
                    }
                }
                ErrorMessage = "Mission passed, + respect";
            });
        }

        public RelayCommand CloseWindowCommand { get; set; }
        public AddAuthenticatorViewModel(string login, string password, object window)
        {

            _login = login;
            _password = password;
            _window = (Window)window;
            CloseWindowCommand = new RelayCommand(o =>
            {
                ExecuteWindow(window);
            });

            StatusChanged = new RelayCommand(o =>
            {
                if (_userInput != "" && _userInput != null)
                    _isReady = true;
            });

            TryToConnect(); 
        }

    }
    
}
