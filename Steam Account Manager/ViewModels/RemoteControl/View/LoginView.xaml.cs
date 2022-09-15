using Newtonsoft.Json;
using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class LoginView : UserControl
    {
        public LoginView()
        {
            InitializeComponent();
            this.DataContext = new LoginViewModel();
        }

        private void state_box_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            Infrastructure.Base.SteamRemoteClient.ChangeCurrentPersonaState((SteamKit2.EPersonaState)state_box.SelectedIndex);
        }

        private void ui_box_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            switch (ui_box.SelectedIndex)
            {
                case 0:
                    Infrastructure.Base.SteamRemoteClient.UIMode(0);
                    Infrastructure.Base.SteamRemoteClient.ChangePersonaFlags(0);
                    break;
                case 1:
                    Infrastructure.Base.SteamRemoteClient.ChangePersonaFlags(1024); //BP
                    break;
                case 2:
                    Infrastructure.Base.SteamRemoteClient.ChangePersonaFlags(2048); //VR
                    break;
                case 3:
                    Infrastructure.Base.SteamRemoteClient.ChangePersonaFlags(512); // phone
                    break;
            }
        }

        private void RecentlyDelete_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            LoginViewModel.RecentlyLoggedIn.RemoveAt(Recently.SelectedIndex);

            var ConvertedJson = JsonConvert.SerializeObject(LoginViewModel.RecentlyLoggedIn, new JsonSerializerSettings
            {
                DefaultValueHandling = DefaultValueHandling.Populate,
                Formatting = Formatting.Indented
            });

            System.IO.File.WriteAllText(@".\RecentlyLoggedUsers.json", ConvertedJson);
        }

        private void logoutButton_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = logoutButton;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)App.Current.FindResource("rc_lv_logout");
        }

        private void Popup_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.Visibility = System.Windows.Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void editNick_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = editNick;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)App.Current.FindResource("rc_lv_editNick");
        }

        private void RecentlyDelete_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = RecentlyDelete;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)App.Current.FindResource("rc_lv_recentlyDelete");
        }

        private void RecentlyLogOn_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = RecentlyDelete;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)App.Current.FindResource("rc_lv_recentlyLogin");
        }
    }
}
