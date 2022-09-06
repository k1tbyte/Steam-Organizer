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
    }
}
