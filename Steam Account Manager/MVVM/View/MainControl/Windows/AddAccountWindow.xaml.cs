using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System.Windows;
using System.Windows.Controls.Primitives;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Windows
{
    public partial class AddAccountWindow : Window
    {
        public AddAccountWindow()
        {
            InitializeComponent();
            DataContext = new AddAccountViewModel();
        }

        private void CloseEvent(object sender, RoutedEventArgs e)          => this.Close();
        private void BorderDragMove(object sender, MouseButtonEventArgs e) => this.DragMove();

        private void ToggleButton_Checked(object sender, RoutedEventArgs e)
        {
            urlIcon.Kind  = (sender as ToggleButton).IsChecked == true ? MahApps.Metro.IconPacks.PackIconMaterialKind.InformationVariant : MahApps.Metro.IconPacks.PackIconMaterialKind.Link;
            SteamURL.Tag  = (sender as ToggleButton).IsChecked == true ? App.FindString("adv_nickname") : App.FindString("adv_anySteamAccoutId");
        }
    }
}
