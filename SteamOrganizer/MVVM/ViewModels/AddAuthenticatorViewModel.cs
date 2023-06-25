using Microsoft.Win32;
using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.MVVM.Core;
using System.IO;
using System.Threading.Tasks;

namespace SteamOrganizer.MVVM.ViewModels
{
    internal class AddAuthenticatorViewModel : ObservableObject
    {
        #region Commands

        #endregion


        private string _errorMessage, _userInput, _captchaLink;

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
        }

        private async Task LoadAuthenticator()
        {
            var fileDialog = new OpenFileDialog
            {
                Filter = "Mobile authenticator File (.maFile)|*.maFile",
                InitialDirectory = Directory.GetCurrentDirectory()
            };

            if (fileDialog.ShowDialog() != true)
                return;


/*                if (!Directory.Exists($@"{App.WorkingDirectory}\Authenticators"))
                    Directory.CreateDirectory($@"{App.WorkingDirectory}\Authenticators");

                var authenticatorName = $@"{App.WorkingDirectory}\Authenticators\{list.AccountName.ToLower()}.maFile";

                if (!File.Exists(authenticatorName))
                    File.Copy(fileDialog.FileName, authenticatorName, true);

                currentAccount.AuthenticatorPath = authenticatorName;

                Config.SaveAccounts();
                ErrorMessage = App.FindString("aaw_successAdd");
                await Task.Delay(2000);*/
            

        }

        public AddAuthenticatorViewModel(Account acc, object ownerWindow)
        {

        }
    }
}
