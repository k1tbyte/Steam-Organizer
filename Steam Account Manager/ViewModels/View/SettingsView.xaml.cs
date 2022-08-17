using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Steam_Account_Manager.ViewModels.View
{
    /// <summary>
    /// Логика взаимодействия для SettingsView.xaml
    /// </summary>
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
            Header.PopupText.Text = "This key allows you to use the\nSteam web API and get Steam data.\nIf the main key does not work,\nyou can use your own key - <Click>";
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
            Header.PopupText.Text = "Key length can only be 32 characters";
        }
    }
}
