using Steam_Account_Manager.Infrastructure;
using System.Linq;
using System.Text.RegularExpressions;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{
    public partial class SettingsView : UserControl
    {
        private Regex CharsDigitsRegex = new Regex("^[a-zA-Z0-9]+\\z");
        public SettingsView()
        {
            InitializeComponent();
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
    }
}
