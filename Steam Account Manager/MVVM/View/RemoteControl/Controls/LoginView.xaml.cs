using Newtonsoft.Json;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using System.Windows;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
{
    public partial class LoginView : UserControl
    {
        public LoginView() => InitializeComponent();
        

        private void state_box_SelectionChanged(object sender, SelectionChangedEventArgs e) =>
            Infrastructure.SteamRemoteClient.SteamRemoteClient.ChangeCurrentPersonaState((SteamKit2.EPersonaState)state_box.SelectedIndex);
        private void IdCopyButton_Click(object sender, RoutedEventArgs e) => Utils.Win32.Clipboard.SetText(steamIDbox.Text);


        private void ui_box_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            switch (ui_box.SelectedIndex)
            {
                case 0:
                    Infrastructure.SteamRemoteClient.SteamRemoteClient.UIMode(0);
                    Infrastructure.SteamRemoteClient.SteamRemoteClient.ChangePersonaFlags(0);
                    break;
                case 1:
                    Infrastructure.SteamRemoteClient.SteamRemoteClient.ChangePersonaFlags(1024); //BP
                    break;
                case 2:
                    Infrastructure.SteamRemoteClient.SteamRemoteClient.ChangePersonaFlags(2048); //VR
                    break;
                case 3:
                    Infrastructure.SteamRemoteClient.SteamRemoteClient.ChangePersonaFlags(512); // phone
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

            System.IO.File.WriteAllText($@"{App.WorkingDirectory}\RecentlyLoggedUsers.json", ConvertedJson);
        }
    }
}
