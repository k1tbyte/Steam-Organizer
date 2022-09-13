using Steam_Account_Manager.Infrastructure.JsonModels;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Shapes;

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
