using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class GamesView : UserControl
    {
        private GamesViewModel currentViewModel;
        public GamesView()
        {
            InitializeComponent();
            currentViewModel = new GamesViewModel();
            this.DataContext = currentViewModel;
        }

        private void games_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (games.SelectedItems.Count == 0)
            {
                SelectsText.Text = "Selected: 0";
            }
            else if (games.SelectedItems.Count == 1)
            {
                SelectsText.Text = "Selected\nAppID: " + currentViewModel.Games[games.SelectedIndex].AppID +
                    "\nPlaytime: " + currentViewModel.Games[games.SelectedIndex].PlayTime_Forever / 60 + "h";
            }
            else
                SelectsText.Text = "Selected: " + games.SelectedItems.Count;
        }
    }
}
