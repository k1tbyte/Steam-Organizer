using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
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
