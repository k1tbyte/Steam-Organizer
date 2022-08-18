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
using Newtonsoft.Json;
using Microsoft.Win32;
using System.IO;

namespace Steam_Account_Manager.ViewModels
{
    internal class AddAuthenticatorViewModel : ObservableObject
    {
        public RelayCommand StatusChanged { get; set; }
        public AsyncRelayCommand AuthenticatorLoadCommand { get; set; }
        public AsyncRelayCommand AddNewCommand { get; set; }
        private string _login, _password, _errorMessage, _userInput;
        private bool _isReady;
        private Window _window;
        private int _id;

        Config config;

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
                    UserInput = "";
                    switch (response)
                    {
                        case LoginResult.NeedEmail:
                            ErrorMessage = "Please enter your email code";
                            while (!_isReady) Thread.Sleep(100);
                            user.EmailCode = UserInput;
                            ErrorMessage = "Installing an Authenticator...";
                            break;

                        case LoginResult.NeedCaptcha:
                            System.Diagnostics.Process.Start(APIEndpoints.COMMUNITY_BASE + "/public/captcha.php?gid=" + user.CaptchaGID); //Open a web browser to the captcha image
                            ErrorMessage = "Please enter captcha";
                            while (!_isReady) Thread.Sleep(100);
                            user.CaptchaText = UserInput;
                            ErrorMessage = "Installing an Authenticator...";
                            break;

                        case LoginResult.Need2FA:
                            ErrorMessage = "Please enter your 2FA code";
                            while (!_isReady) Thread.Sleep(100);
                            user.TwoFactorCode = UserInput;
                            ErrorMessage = "Installing an Authenticator...";
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

                var linker = new AuthenticatorLinker(user.Session)
                {
                    PhoneNumber = null
                };

                var result = linker.AddAuthenticator();
                if (result != AuthenticatorLinker.LinkResult.AwaitingFinalization)
                {
                    ErrorMessage = "Failed to add authenticator: " + result;
                    Thread.Sleep(2000);
                    _window.Dispatcher.Invoke(DispatcherPriority.Normal, new ThreadStart(_window.Close));
                }

                try
                {
                    string path = Directory.GetCurrentDirectory() + "\\Authenticators\\";
                    if (!Directory.Exists(path))
                    {
                        Directory.CreateDirectory(path);
                    }
                    string sgFile = JsonConvert.SerializeObject(linker.LinkedAccount, Formatting.Indented);
                    path += linker.LinkedAccount.AccountName + ".maFile";
                    System.IO.File.WriteAllText(path, sgFile);
                    config.AccountsDb[_id].AuthenticatorPath = path;
                }
                catch
                {
                    ErrorMessage = "Error saving authenticator file, authenticator not added.";
                    Thread.Sleep(2000);
                    _window.Dispatcher.Invoke(DispatcherPriority.Normal, new ThreadStart(_window.Close));
                }

                ErrorMessage = "Please enter SMS-code";
                while (!_isReady) Thread.Sleep(100);

                var linkResult = linker.FinalizeAddAuthenticator(UserInput);

                if (linkResult == AuthenticatorLinker.FinalizeResult.Success)
                {
                    ErrorMessage = "Authenticator successfully added";
                }
                else
                {
                    ErrorMessage = "Error! " + linkResult;
                }
                Thread.Sleep(2000);
                _window.Dispatcher.Invoke(DispatcherPriority.Normal, new ThreadStart(_window.Close));
            });
        }

        private async Task LoadAuthenticator()
        {
            await Task.Factory.StartNew(() =>
            {
                var fileDialog = new OpenFileDialog
                {
                    Filter = "Mobile authenticator File (.maFile)|*.maFile"
                };
                if (fileDialog.ShowDialog() == true)
                {
                    config.AccountsDb[_id].AuthenticatorPath = fileDialog.FileName;
                    config.SaveChanges();
                    ErrorMessage = "Authenticator successfully added";
                    Thread.Sleep(2000);
                }
            });
        }
        public RelayCommand CloseWindowCommand { get; set; }
        public AddAuthenticatorViewModel(string login, string password,int accountId, object window)
        {
            config = Config.GetInstance();
            _login = login;
            _password = password;
            _id = accountId;
            _window = (Window)window;
            CloseWindowCommand = new RelayCommand(o =>
            {
                ExecuteWindow(window);
            });

            StatusChanged = new RelayCommand(o =>
            {
                if (_userInput != "" && _userInput != null)
                {
                    _isReady = true;
                    Thread.Sleep(120);
                    _isReady = false;
                }

            });

            AddNewCommand = new AsyncRelayCommand(async (o) =>
            {
                await TryToConnect();
            });

            AuthenticatorLoadCommand = new AsyncRelayCommand(async (o) =>
            {
                await LoadAuthenticator();
                ExecuteWindow(window);
            });

           // _ = TryToConnect(); 
        }

    }
    
}
