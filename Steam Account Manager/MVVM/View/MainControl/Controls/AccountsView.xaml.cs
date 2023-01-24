using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using Steam_Account_Manager.Utils;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Documents;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{
    public partial class AccountsView : UserControl
    {
        private double x;
        public AccountsView()
        {
            InitializeComponent();
        }


        private CustomPopupPlacement[] placementForPopup(Size popupSize, Size targetSize, Point offset)
        {
            CustomPopupPlacement customPlacement1 =
               new CustomPopupPlacement(new Point(x, -33), PopupPrimaryAxis.Vertical);

            CustomPopupPlacement[] customPlacements =
                    new CustomPopupPlacement[] { customPlacement1 };
            return customPlacements;
        }

        private void saveDb_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = saveDb;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_saveDatabase"); ;
        }

        private void Popup_leave(object sender, MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void restoreDb_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = restoreDb;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_restoreDatabase");
        }

        private void restoreAcc_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = restoreAcc;
            x = -155;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_restoreAccount");
        }

        private void refreshDb_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = refreshDb;
            x = -175;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_updAccounts");
        }


        private AccountTabView _draggedItemView;
        private AdornerLayer _adornerLayer;
        private DragAdorner _dragAdorner;
        private int _targetIndex = -1;

        private void ListViewItem_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            ListBoxItem draggedItem = sender as ListBoxItem;
            _draggedItemView = ((ListBoxItem)(sender)).DataContext as AccountTabView;
            _adornerLayer = AdornerLayer.GetAdornerLayer(accountsListView);
            _dragAdorner = new DragAdorner(accountsListView, _draggedItemView, 0.5, e.GetPosition(draggedItem));
            _adornerLayer.Add(_dragAdorner);
        }

        private void accountsListView_PreviewMouseMove(object sender, MouseEventArgs e)
        {
            if (_dragAdorner == null) return;

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

            AccountsViewModel.AccountTabViews[_targetIndex].borderLayer.Visibility = Visibility.Visible;
        }

        private void accountsListView_PreviewMouseLeftButtonUp(object sender, MouseButtonEventArgs e)
        {
            if (_draggedItemView == null || _dragAdorner == null || _targetIndex == -1)
                return;

            var droppedData = _draggedItemView;

            _adornerLayer.Remove(_dragAdorner);
            _draggedItemView = null;
            _dragAdorner = null;
            AccountsViewModel.AccountTabViews[_targetIndex].borderLayer.Visibility = Visibility.Collapsed;

            var selectedIndex = AccountsViewModel.AccountTabViews.IndexOf(droppedData);
            Config.Accounts.Swap(selectedIndex, _targetIndex);
            Config.SaveAccounts();

        }
    }
}
