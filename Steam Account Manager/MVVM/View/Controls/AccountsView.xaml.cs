using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.ViewModels;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Effects;
using System.Windows.Media.Imaging;
using static Steam_Account_Manager.Utils.Presentation;

namespace Steam_Account_Manager.MVVM.View.Controls
{
    public partial class AccountsView : UserControl
    {
        private ListBoxItem draggedItem;
        private AdornerLayer _adornerLayer;
        private DragAdorner _dragAdorner;
        private int _targetIndex = -1, _draggedItemIndex = -1;
        private Effect _glow;
        private FrameworkElement _sender;
        private ScrollViewer scroll;

        public AccountsView()
        {
            InitializeComponent();
            this.DataContext = new AccountsViewModel();
            scroll = GetDescendantByType(accountsListBox, typeof(ScrollViewer)) as ScrollViewer;
        }

        public static Visual GetDescendantByType(Visual element, Type type)
        {
            if (element == null)
            {
                return null;
            }
            if (element.GetType() == type)
            {
                return element;
            }
            Visual foundElement = null;
            if (element is FrameworkElement)
            {
                (element as FrameworkElement).ApplyTemplate();
            }
            for (int i = 0; i < VisualTreeHelper.GetChildrenCount(element); i++)
            {
                Visual visual = VisualTreeHelper.GetChild(element, i) as Visual;
                foundElement = GetDescendantByType(visual, type);
                if (foundElement != null)
                {
                    break;
                }
            }
            return foundElement;
        }

        private void AccountItemGrab(object sender, MouseButtonEventArgs e)
        {
            _sender                             = (sender as FrameworkElement);
            _sender.Cursor                      = App.GrabbingCursor;
            accountsListBox.PreviewMouseMove += AccountItemDragMove;
            var pointOffset                     = e.GetPosition(accountsListBox);
            _draggedItemIndex                   = (int)_sender.Tag-1;
            draggedItem                         = accountsListBox.ItemContainerGenerator.ContainerFromIndex(_draggedItemIndex) as ListBoxItem;
            _glow                               = App.Current.FindResource("glow") as Effect;
            _adornerLayer                       = AdornerLayer.GetAdornerLayer(accountsListBox);
            _dragAdorner                        = new DragAdorner(accountsListBox, draggedItem, 0.4, e.GetPosition(draggedItem)) { PointOffset = pointOffset };
            _adornerLayer.Add(_dragAdorner);
        }

        private void AccountItemDragMove(object sender, MouseEventArgs e)
        {
            if (_dragAdorner == null) return;

            var pos = e.GetPosition(accountsListBox);
            _dragAdorner.PointOffset = pos;

            var tempIndex = (int)((pos.Y + scroll.VerticalOffset) / 60);
            var fakeIndex = (int)(pos.Y / 60);

            if (tempIndex >= Config.Accounts.Count || pos.Y >= 360 || pos.Y < 0 || pos.X <= 520 || pos.X >= 560)
            {
                if(_targetIndex != -1)
                      (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex) as ListBoxItem).Effect = null;
                _targetIndex = -1;
                return;
            }

            _targetIndex = tempIndex;

            if (_targetIndex == 0)
                (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex + 1) as ListBoxItem).Effect = null;
            else if (_targetIndex == Config.Accounts.Count - 1)
                (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex - 1) as ListBoxItem).Effect = null;
            else
            {
                if(fakeIndex < 5)
                  (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex + 1) as ListBoxItem).Effect = null;
                if(fakeIndex > 0)
                (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex - 1) as ListBoxItem).Effect = null;
            }

            if (_targetIndex != _draggedItemIndex)
                (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex) as ListBoxItem).Effect = _glow;
        }

        private void AccountItemDrop(object sender, MouseButtonEventArgs e)
        {
            accountsListBox.PreviewMouseMove -= AccountItemDragMove;
            if (draggedItem == null || _dragAdorner == null)
                return;

            if(_targetIndex != -1)
            {
                (accountsListBox.ItemContainerGenerator.ContainerFromIndex(_targetIndex) as ListBoxItem).Effect = null;
                Config.Accounts.Move(_draggedItemIndex, _targetIndex);
                (this.DataContext as AccountsViewModel).UpdateIndexes(refresh: true);
                Config.SaveAccounts();
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