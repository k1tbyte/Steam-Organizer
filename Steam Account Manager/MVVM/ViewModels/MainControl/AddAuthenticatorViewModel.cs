using Microsoft.Win32;
using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient.Authenticator;
using Steam_Account_Manager.MVVM.Core;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using System.Windows;

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


        private string _errorMessage, _userInput, _captchaLink;
        private bool _isReady;
        private readonly Window _window;
        private readonly Account currentAccount;

        private class RootObjectUsername
        {
            public string Account_name { get; set; }
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
                UserLogin user       = new UserLogin(currentAccount.Login, currentAccount.Password);
                LoginResult response = LoginResult.BadCredentials;
                ErrorMessage         = App.FindString("aaw_dataWait");

                while ((response = user.DoLogin()) != LoginResult.LoginOkay)
                {
                    switch (response)
                    {
                        case LoginResult.NeedEmail:
                            ErrorMessage = App.FindString("aaw_emailCode");
                            while (!_isReady) Thread.Sleep(100);
                            user.EmailCode = UserInput;
                            ErrorMessage = App.FindString("aaw_installing");
                            break;

                        case LoginResult.NeedCaptcha:
                            _captchaLink = "https://api.steampowered.com/public/captcha.php?gid=" + user.CaptchaGID;
                            ErrorMessage = App.FindString("aaw_captcha");
                            while (!_isReady) Thread.Sleep(100);
                            user.CaptchaText = UserInput;
                            ErrorMessage = App.FindString("aaw_installing");
                            break;

                        case LoginResult.Need2FA:
                            ErrorMessage = App.FindString("aaw_2faCode");
                            while (!_isReady) Thread.Sleep(100);
                            user.TwoFactorCode = UserInput;
                            ErrorMessage = App.FindString("aaw_installing");
                            break;

                        case LoginResult.TooManyFailedLogins:
                            ErrorMessage = App.FindString("aaw_manyAttempts");
                            Thread.Sleep(2000);
                            _window.Dispatcher.Invoke(() => _window.Close());
                            return;

                        case LoginResult.GeneralFailure:
                            ErrorMessage = App.FindString("aaw_dataIncorrect");
                            Thread.Sleep(2000);
                            _window.Dispatcher.Invoke(() => _window.Close());
                            return;
                    }
                }
                if (_captchaLink != null) CaptchaLink = null;
                var linker = new AuthenticatorLinker(user.Session)
                {
                    PhoneNumber = null
                };

                var result = linker.AddAuthenticator();
                if (result != AuthenticatorLinker.LinkResult.AwaitingFinalization)
                {
                    ErrorMessage = App.FindString("aaw_addFail") + " " + result;
                    Thread.Sleep(2000);
                    _window.Dispatcher.Invoke(() =>  _window.Close());
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
                    File.WriteAllText(path, sgFile);
                    currentAccount.AuthenticatorPath = path;
                }
                catch
                {
                    ErrorMessage = App.FindString("aaw_errorSave");
                    Thread.Sleep(2000);
                    _window.Dispatcher.Invoke(() =>  _window.Close());
                }

                ErrorMessage = App.FindString("aaw_smsCode");
                while (!_isReady) Thread.Sleep(100);

                var linkResult = linker.FinalizeAddAuthenticator(UserInput);

                if (linkResult == AuthenticatorLinker.FinalizeResult.Success)
                {
                    ErrorMessage = App.FindString("aaw_successAdd");
                }
                else
                {
                    ErrorMessage = "Error! " + linkResult;
                }
                Thread.Sleep(2000);
                _window.Dispatcher.Invoke(() => _window.Close());
            });
            
        }

        private async Task LoadAuthenticator()
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
                if (list.Account_name != currentAccount.Login)
                {
                    ErrorMessage = App.FindString("aaw_linkFromAnotherAcc");
                    await Task.Delay(2500);
                    _window.Dispatcher.Invoke(() => _window.Close());
                }
                else
                {

                    if (!Directory.Exists($@"{App.WorkingDirectory}\Authenticators"))
                        Directory.CreateDirectory($@"{App.WorkingDirectory}\Authenticators");

                    var authenticatorName = $@"{App.WorkingDirectory}\Authenticators\{list.Account_name}.maFile";

                    if (!File.Exists(authenticatorName))
                    {
                        File.Delete(authenticatorName);
                    }

                    File.Copy(fileDialog.FileName, authenticatorName, true);

                    currentAccount.AuthenticatorPath = authenticatorName;

                    Config.SaveAccounts();
                    ErrorMessage = App.FindString("aaw_successAdd");
                    await Task.Delay(2000);
                }
            }
        }

        public AddAuthenticatorViewModel(Account acc, object ownerWindow)
        {
            currentAccount = acc;
            _window = (Window)ownerWindow;
            CloseWindowCommand = new RelayCommand(o =>
            {
                (ownerWindow as Window).Close();
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
                (ownerWindow as Window).Close();
            });

        }

    }

}
