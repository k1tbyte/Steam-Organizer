using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace Steam_Account_Manager.ViewModels.View
{
    public partial class SettingsView : UserControl
    {
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


    }
}
