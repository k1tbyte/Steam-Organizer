using System.Windows;
using System.Windows.Data;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class AchievementsView : Window
    {
        public AchievementsView(ulong appID)
        {
            InitializeComponent();
            this.Header.Text = $"Achievements AppID: {appID}";
            this.DataContext = new AchievementsViewModel(appID);
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void Border_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            this.DragMove();
        }
    }
}
