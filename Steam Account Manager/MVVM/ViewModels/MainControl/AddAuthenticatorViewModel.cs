using Microsoft.Win32;
using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.Core;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Threading;

namespace Steam_Account_Manager.MVVM.ViewModels.MainControl
{
    internal class AddAuthenticatorViewModel : ObservableObject
    {
        #region Commands
        public RelayCommand StatusChanged { get; set; }
        public RelayCommand CloseWindowCommand { get; set; }
        public AsyncRelayCommand AuthenticatorLoadCommand { get; set; }
        public AsyncRelayCommand AddNewCommand { get; set; } 
        #endregion


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
            set => SetProperty(ref _isCaptchaVisible, value);
        }
        public string CaptchaLink
        {
            get => _captchaLink;
            set => SetProperty(ref _captchaLink, value);
        }
        public string UserInput
        {
            get => _userInput;
            set => SetProperty(ref _userInput, value);
        }
        public string ErrorMessage
        {
            get => _errorMessage;
            set => SetProperty(ref _errorMessage, value);
        }


        private async Task TryToConnect()
        {
            await Task.Run(() =>
            {
                UserLogin user       = new UserLogin(_login, _password);
                LoginResult response = LoginResult.BadCredentials;
                ErrorMessage         = (string)Application.Current.FindResource("aaw_dataWait");

                while ((response = user.DoLogin()) != LoginResult.LoginOkay)
                {
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
                    string path = App.WorkingDirectory + "\\Authenticators\\";
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
            });
            
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
                    if (list.Account_name != _login)
                    {
                        ErrorMessage = "You cannot add an authenticator from another account";
                        Thread.Sleep(2000);
                        _window.Dispatcher.Invoke(() => { _window.Close(); });
                    }
                    else
                    {
                        Config.Accounts[_id].AuthenticatorPath = fileDialog.FileName;
                        if (!Directory.Exists($@"{App.WorkingDirectory}\Authenticators"))
                            Directory.CreateDirectory($@"{App.WorkingDirectory}\Authenticators");

                        if (!File.Exists($@"{App.WorkingDirectory}\Authenticators\{list.Account_name}.maFile"))
                            File.Copy(fileDialog.FileName, $@"{App.WorkingDirectory}\Authenticators\{list.Account_name}.maFile", true);

                        Config.SaveAccounts();
                        ErrorMessage = (string)Application.Current.FindResource("aaw_successAdd");
                        Thread.Sleep(2000);
                    }
                }
            });
        }

        public AddAuthenticatorViewModel(string login, string password, int accountId, object window)
        {
            _login = login;
            _password = password;
            _id = accountId;
            _window = (Window)window;
            CloseWindowCommand = new RelayCommand(o =>
            {
                (window as Window).Close();
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
                (window as Window).Close();
            });

        }

    }

}
