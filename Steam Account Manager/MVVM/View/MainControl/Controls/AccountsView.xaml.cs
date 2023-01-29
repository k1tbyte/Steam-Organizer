using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media.Effects;
using System.Windows.Media.Imaging;
using static Steam_Account_Manager.Utils.Presentation;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{
    public partial class AccountsView : UserControl
    {
        private ListBoxItem draggedItem;
        private AdornerLayer _adornerLayer;
        private DragAdorner _dragAdorner;
        private int _targetIndex = -1, _draggedItemIndex = -1;
        private Effect _glow;
        private FrameworkElement _sender;

        public AccountsView()
        {
            InitializeComponent();
            this.DataContext = new AccountsViewModel();
        }


        private void AccountItemGrab(object sender, MouseButtonEventArgs e)
        {
            _sender                             = (sender as FrameworkElement);
            _sender.Cursor                      = App.GrabbingCursor;
            accountsListView.PreviewMouseMove += AccountItemDragMove;
            var pointOffset                     = e.GetPosition(accountsListView);
            _draggedItemIndex                   = (int)(pointOffset.Y / 60);
            draggedItem                         = accountsListView.ItemContainerGenerator.ContainerFromIndex(_draggedItemIndex) as ListBoxItem;
            _glow                               = App.Current.FindResource("glow") as Effect;
            _adornerLayer                       = AdornerLayer.GetAdornerLayer(accountsListView);
            _dragAdorner                        = new DragAdorner(accountsListView, draggedItem, 0.4, e.GetPosition(draggedItem)) { PointOffset = pointOffset };
            _adornerLayer.Add(_dragAdorner);
        }

        private void AccountItemDragMove(object sender, MouseEventArgs e)
        {
            if (_dragAdorner == null) return;

            var pos = e.GetPosition(accountsListView);
            _dragAdorner.PointOffset = pos;
            _targetIndex = (int)(pos.Y / 60);

            if (_targetIndex >= Config.Accounts.Count || _targetIndex < 0) return;

            if (_targetIndex == 0)
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex + 1) as ListBoxItem).Effect = null;
            else if (_targetIndex == Config.Accounts.Count - 1)
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex - 1) as ListBoxItem).Effect = null;
            else
            {
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex + 1) as ListBoxItem).Effect = null;
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex - 1) as ListBoxItem).Effect = null;
            }

            if (_targetIndex != _draggedItemIndex && pos.X >= 520 && pos.X <= 560 && pos.Y > 0)
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex) as ListBoxItem).Effect = _glow;
            else
            {
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex) as ListBoxItem).Effect = null;
                _targetIndex = -1;
            }
        }

        private void AccountItemDrop(object sender, MouseButtonEventArgs e)
        {
            accountsListView.PreviewMouseMove -= AccountItemDragMove;
            if (draggedItem == null || _dragAdorner == null)
                return;

            if(_targetIndex != -1)
            {
                (accountsListView.ItemContainerGenerator.ContainerFromIndex(_targetIndex) as ListBoxItem).Effect = null;
                Config.Accounts.Move(_draggedItemIndex, _targetIndex);
                (this.DataContext as AccountsViewModel).SearchFilter.Refresh();
            }

            if(_sender != null)
                _sender.Cursor = App.GrabCursor;

            _targetIndex = -1;
            _adornerLayer.Remove(_dragAdorner);
            _sender = _dragAdorner = null;
            draggedItem = null;
        }


        private void AvatarImageFailed(object sender, ExceptionRoutedEventArgs e) => (sender as Image).Source = new BitmapImage(new Uri("/Images/default_steam_profile.png", UriKind.Relative));
    }
}