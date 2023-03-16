using Steam_Account_Manager.MVVM.ViewModels;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.View.Controls
{
    public partial class RemoteControlView : UserControl
    {
        public RemoteControlView()
        {
            InitializeComponent();
            this.DataContext = new RemoteControlViewModel();
        }
    }
}
