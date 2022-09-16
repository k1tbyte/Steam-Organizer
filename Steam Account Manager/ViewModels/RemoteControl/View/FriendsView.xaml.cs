using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class FriendsView : UserControl
    {
        public FriendsView()
        {
            InitializeComponent();
            this.DataContext = new FriendsViewModel();
        }


    }
}
