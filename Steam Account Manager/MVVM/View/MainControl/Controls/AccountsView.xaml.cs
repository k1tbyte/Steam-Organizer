using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using Steam_Account_Manager.Utils;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media.Imaging;
using static Steam_Account_Manager.Utils.Presentation;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{
    public partial class AccountsView : UserControl
    {
        private ListBoxItem _draggedItemView;
        private AdornerLayer _adornerLayer;
        private DragAdorner _dragAdorner;
        private int _targetIndex = -1;

        public AccountsView() => InitializeComponent();
        

        private void ListViewItem_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            ListBoxItem draggedItem = sender as ListBoxItem;
            _draggedItemView = (ListBoxItem)sender; 
            _adornerLayer = AdornerLayer.GetAdornerLayer(accountsListView);
            _dragAdorner = new DragAdorner(accountsListView, _draggedItemView, 0.5, e.GetPosition(draggedItem));
            _adornerLayer.Add(_dragAdorner);
        }

        private void accountsListView_PreviewMouseMove(object sender, MouseEventArgs e)
        {
/*            if (_dragAdorner == null) return;

            _dragAdorner.PointOffset = e.GetPosition(accountsListView);
            _targetIndex = (int)(e.GetPosition(accountsListView).Y / 60);

            if (_targetIndex == 0)
                AccountsViewModel.AccountTabViews[_targetIndex + 1].borderLayer.Visibility = Visibility.Collapsed;
            else if (_targetIndex == AccountsViewModel.AccountTabViews.Count - 1)
                AccountsViewModel.AccountTabViews[_targetIndex - 1].borderLayer.Visibility = Visibility.Collapsed;
            else
            {
                AccountsViewModel.AccountTabViews[_targetIndex + 1].borderLayer.Visibility = Visibility.Collapsed;
                AccountsViewModel.AccountTabViews[_targetIndex - 1].borderLayer.Visibility = Visibility.Collapsed;
            }

            AccountsViewModel.AccountTabViews[_targetIndex].borderLayer.Visibility = Visibility.Visible;*/
        }

        private void accountsListView_PreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
/*            if (_draggedItemView == null || _dragAdorner == null || _targetIndex == -1)
                return;

            var droppedData = _draggedItemView;

            _adornerLayer.Remove(_dragAdorner);
            _draggedItemView = null;
            _dragAdorner = null;
            AccountsViewModel.AccountTabViews[_targetIndex].borderLayer.Visibility = Visibility.Collapsed;

            var selectedIndex = AccountsViewModel.AccountTabViews.IndexOf(droppedData);
            Config.Accounts.Swap(selectedIndex, _targetIndex);
            Config.SaveAccounts();*/

        }

        private void AvatarImageFailed(object sender, ExceptionRoutedEventArgs e) => (sender as Image).Source = new BitmapImage(new Uri("/Images/default_steam_profile.png", UriKind.Relative));
    }
}
