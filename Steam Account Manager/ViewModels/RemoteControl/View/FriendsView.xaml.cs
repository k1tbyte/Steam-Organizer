using Steam_Account_Manager.Infrastructure.JsonModels;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class FriendsView : UserControl
    {
        int index;
        public FriendsView()
        {
            InitializeComponent();
            this.DataContext = new FriendsViewModel();
        }

    }
}
