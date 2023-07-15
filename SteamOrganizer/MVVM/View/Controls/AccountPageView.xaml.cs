using SteamOrganizer.MVVM.ViewModels;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Controls
{
    public partial class AccountPageView : ScrollViewer
    {
        public AccountPageView()
        {
            InitializeComponent();
            this.DataContext = new AccountPageViewModel();
        }
    }
}
