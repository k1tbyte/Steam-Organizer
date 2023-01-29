using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
{
    public partial class MainRemoteControlView : UserControl
    {
        public MainRemoteControlView()
        {
            InitializeComponent();
            this.DataContext = new MainRemoteControlViewModel();
        }
    }
}
