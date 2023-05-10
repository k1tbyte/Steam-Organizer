using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.View.Windows;
using SteamOrganizer.MVVM.ViewModels;
using System.Diagnostics;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class SettingsView : UserControl
    {
        private readonly Regex CharsDigitsRegex = new Regex("^[a-zA-Z0-9]+\\z");
        public static new bool IsLoaded { get; private set; }
        public SettingsView()
        {
            InitializeComponent();
            this.DataContext = new SettingsViewModel();
            IsPassword.IsChecked = !string.IsNullOrEmpty(Config.Properties.Password);
            CryptoKey.Text = Config.Properties.UserCryptoKey == Config.GetDefaultCryptoKey ? "" : Config.Properties.UserCryptoKey;
            Loaded += (sender, e) => IsLoaded = true;
        }


        #region Encryption key events
        private void ApiKey_TextChanged(object sender, TextChangedEventArgs e)
        {
            var box = (sender as TextBox);
            if (!CharsDigitsRegex.IsMatch(box.Text))
            {
                box.Text = Regex.Replace(box.Text, "[^0-9a-zA-Z]+", string.Empty);
                box.CaretIndex = box.Text.Length;
            }


            if (!string.IsNullOrEmpty(box.Text) && box.Text.Length < 32)
            {
                ErrorApiKey.Visibility = Visibility.Visible;
                return;
            }

            ErrorApiKey.Visibility = Visibility.Collapsed;
            Config.Properties.WebApiKey = box.Text;
        }
        private void GenerateKey_Click(object sender, RoutedEventArgs e)
        {
            if(Utils.Presentation.OpenQueryMessageBox(App.FindString("sv_cryptoKeyConfirm"), App.FindString("mv_confirmAction")))
            {
                Config.UpdateEncryption(Utils.Common.GenerateCryptoKey());
                CryptoKey.Text = Config.Properties.UserCryptoKey;
            }

        }
        private void ResetKey_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty(CryptoKey.Text) && Config.Properties.UserCryptoKey == Config.GetDefaultCryptoKey)
                return;

            CryptoKey.Text = "";
            Config.UpdateEncryption(Config.GetDefaultCryptoKey);
        } 
        #endregion

        #region App password events
        private void IsPassword_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            e.Handled = true;

            if (string.IsNullOrEmpty(Config.Properties.Password))
            {
                if (IsPassword.IsChecked == false)
                {
                    IsPassword.IsChecked = true;
                    PasswordError.Visibility = PasswordPanel.Visibility = Visibility.Visible;
                }
                else
                {
                    IsPassword.IsChecked = false;
                    PasswordPanel.Visibility = Visibility.Collapsed;
                    (this.DataContext as SettingsViewModel).Password = null;
                }
            }
            else
            {
                var result = Utils.Presentation.OpenDialogWindow(new AuthenticationWindow(false));

                if (result == null || result == false)
                    return;

                Config.Properties.Password = null;
                IsPassword.IsChecked = false;
                Config.SaveProperties();
            }


        }
        private void SetPassword_Click(object sender, RoutedEventArgs e)
        {
            if (string.IsNullOrEmpty((this.DataContext as SettingsViewModel).Password))
                return;

            Config.Properties.Password = Utils.Common.Sha256((this.DataContext as SettingsViewModel).Password + Config.GetDefaultCryptoKey);
            (this.DataContext as SettingsViewModel).Password = null;
            PasswordPanel.Visibility = Visibility.Collapsed;
            Config.SaveProperties();
        }
        #endregion

        private void OpenRootFolder(object sender, RoutedEventArgs e) => Process.Start(new ProcessStartInfo { Arguments = App.WorkingDirectory, FileName = "explorer.exe" }).Dispose();

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            System.IO.File.WriteAllText("Config.json",JsonConvert.SerializeObject(Config.Properties));
            System.IO.File.WriteAllText("Accounts.json", JsonConvert.SerializeObject(Config.Accounts));
        }

        private void Button_Click_1(object sender, RoutedEventArgs e)
        {

        }
    }
}
