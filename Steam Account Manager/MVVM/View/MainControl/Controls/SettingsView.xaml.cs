using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.View.MainControl.Windows;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using Steam_Account_Manager.Themes;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{
    public partial class SettingsView : UserControl
    {
        private readonly Regex CharsDigitsRegex = new Regex("^[a-zA-Z0-9]+\\z");
        public SettingsView() => InitializeComponent();
        
        private void UserControl_Loaded(object sender, RoutedEventArgs e)
        {
            IsPassword.IsChecked = !string.IsNullOrEmpty(Config.Properties.Password);
            CryptoKey.Text = Config.Properties.UserCryptoKey == Config.GetDefaultCryptoKey ? "" : Config.Properties.UserCryptoKey;
        }

        private void apiKeyInfo_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = apiKeyInfo;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)FindResource("sv_popup_apiKeyInfo");
        }

        private void PopupLeave_MouseLeave(object sender, MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void ErrorApiKey_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = ErrorApiKey;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)FindResource("sv_popup_maxApiKeyLength");
        }

        private void CryptoKeyInfo_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = CryptoKeyInfo;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text =
                (string)FindResource("sv_popup_cryptoKeyInfo");
        }

        private void GenerateKey_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = GenerateKey;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)FindResource("sv_popup_generateCryptoKey");
        }

        private void ResetKey_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = ResetKey;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)FindResource("sv_popup_resetCrypto");
        }

        private void PasswordError_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = PasswordError;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)FindResource("sv_popup_passwordError");
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
            Config.UpdateEncryption(Utils.Common.GenerateCryptoKey());
            CryptoKey.Text = Config.Properties.UserCryptoKey;
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
                var result = Utils.Common.ShowDialogWindow(new AuthenticationWindow(false));

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

    }
}
