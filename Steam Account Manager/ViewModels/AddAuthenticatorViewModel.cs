using System;
using Steam_Account_Manager.Infrastructure;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
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
        private string _login, _password, _errorMessage, _userInput, _captchaLink;
        private bool _isReady, _isCaptchaVisible;
        private Window _window;
        private int _id;

        private class RootObjectUsername
        {
            public string Account_name { get; set; }
        }


        public bool IsCaptchaVisible
        {
            get => _isCaptchaVisible;
            set
            {
                _isCaptchaVisible = value;
                OnPropertyChanged(nameof(IsCaptchaVisible));
            }
        }
        public string CaptchaLink
        {
            get => _captchaLink;
            set
            {
                _captchaLink = value;
                OnPropertyChanged(nameof(CaptchaLink));
            }
        }
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
            UserLogin user = new UserLogin(_login, _password);
            LoginResult response = LoginResult.BadCredentials;
            ErrorMessage = (string)Application.Current.FindResource("aaw_dataWait");

            while ((response = user.DoLogin()) != LoginResult.LoginOkay)
            {
                UserInput = "";
                switch (response)
                {
                    case LoginResult.NeedEmail:
                        ErrorMessage = (string)Application.Current.FindResource("aaw_emailCode");
                        while (!_isReady) Thread.Sleep(100);
                        user.EmailCode = UserInput;
                        ErrorMessage = (string)Application.Current.FindResource("aaw_installing");
                        break;

                    case LoginResult.NeedCaptcha:
                        _captchaLink = "https://api.steampowered.com/public/captcha.php?gid=" + user.CaptchaGID;
                        ErrorMessage = (string)Application.Current.FindResource("aaw_captcha");
                        IsCaptchaVisible = true;
                        while (!_isReady) Thread.Sleep(100);
                        user.CaptchaText = UserInput;
                        ErrorMessage = (string)Application.Current.FindResource("aaw_installing");
                        break;

                    case LoginResult.Need2FA:
                        ErrorMessage = (string)Application.Current.FindResource("aaw_2faCode");
                        while (!_isReady) Thread.Sleep(100);
                        user.TwoFactorCode = UserInput;
                        ErrorMessage = (string)Application.Current.FindResource("aaw_installing");
                        break;

                    case LoginResult.TooManyFailedLogins:
                        ErrorMessage = (string)Application.Current.FindResource("aaw_manyAttempts");
                        Thread.Sleep(2000);
                        _window.Dispatcher.Invoke(() => { _window.Close(); });
                        return;

                    case LoginResult.GeneralFailure:
                        ErrorMessage = (string)Application.Current.FindResource("aaw_dataIncorrect");
                        Thread.Sleep(2000);
                        _window.Dispatcher.Invoke(() => { _window.Close(); });
                        return;
                }
            }
            if (_captchaLink != null) IsCaptchaVisible = false;
            var linker = new AuthenticatorLinker(user.Session)
            {
                PhoneNumber = null
            };

            var result = linker.AddAuthenticator();
            if (result != AuthenticatorLinker.LinkResult.AwaitingFinalization)
            {
                ErrorMessage = (string)Application.Current.FindResource("aaw_addFail") + " " + result;
                Thread.Sleep(2000);
                _window.Dispatcher.Invoke(() => { _window.Close(); });
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
                Config.Accounts[_id].AuthenticatorPath = path;
            }
            catch
            {
                ErrorMessage = (string)Application.Current.FindResource("aaw_errorSave");
                Thread.Sleep(2000);
                _window.Dispatcher.Invoke(() => { _window.Close(); });
            }

            ErrorMessage = (string)Application.Current.FindResource("aaw_smsCode");
            while (!_isReady) Thread.Sleep(100);

            var linkResult = linker.FinalizeAddAuthenticator(UserInput);

            if (linkResult == AuthenticatorLinker.FinalizeResult.Success)
            {
                ErrorMessage = (string)Application.Current.FindResource("aaw_successAdd");
            }
            else
            {
                ErrorMessage = "Error! " + linkResult;
            }
            Thread.Sleep(2000);
            _window.Dispatcher.Invoke(() => { _window.Close(); });
        }

        private async Task LoadAuthenticator()
        {
            await Task.Factory.StartNew(() =>
            {
                var fileDialog = new OpenFileDialog
                {
                    Filter = "Mobile authenticator File (.maFile)|*.maFile",
                    InitialDirectory = Directory.GetCurrentDirectory()
                    
                };
                if (fileDialog.ShowDialog() == true)
                {
                    //Veryfication account
                    var list = JsonConvert.DeserializeObject<RootObjectUsername>(File.ReadAllText(fileDialog.FileName));
                    if(list.Account_name != _login)
                    {
                        ErrorMessage = "You cannot add an authenticator from another account";
                        Thread.Sleep(2000);
                        _window.Dispatcher.Invoke(() => { _window.Close(); });
                    }
                    else
                    {
                        Config.Accounts[_id].AuthenticatorPath = fileDialog.FileName;
                        if (!Directory.Exists(@".\Authenticators"))
                            Directory.CreateDirectory(@".\Authenticators");
                        
                        if(!File.Exists($@".\Authenticators\{list.Account_name}.maFile"))
                          File.Copy(fileDialog.FileName, $@".\Authenticators\{list.Account_name}.maFile", true);

                        Config.SaveAccounts();
                        ErrorMessage = (string)Application.Current.FindResource("aaw_successAdd");
                        Thread.Sleep(2000);
                    }
                }
            });
        }
        public RelayCommand CloseWindowCommand { get; set; }
        public AddAuthenticatorViewModel(string login, string password,int accountId, object window)
        {
            _login = login;
            _password = password;
            _id = accountId;
            _window = (Window)window;
            CloseWindowCommand = new RelayCommand(o =>
            {
                CloseWindow(window);
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
                CloseWindow(window);
            });

           // _ = TryToConnect(); 
        }

    }
    
}
