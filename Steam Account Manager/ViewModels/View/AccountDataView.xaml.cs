using System.Windows.Controls;
using Steam_Account_Manager.ViewModels;

namespace Steam_Account_Manager.ViewModels.View
{

    public partial class AccountDataView : UserControl
    {
        private AccountDataViewModel currentViewModel;
        public AccountDataView()
        {
            InitializeComponent();
            currentViewModel = new AccountDataViewModel();
            this.DataContext = currentViewModel;
        }
    }
}
