using System.Collections.Generic;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;

namespace Steam_Account_Manager.ViewModels.View
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

        private void saveDb_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = saveDb;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_saveDatabase"); ;
        }

        private void Popup_leave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void restoreDb_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = restoreDb;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_restoreDatabase");
        }

        private void restoreAcc_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = restoreAcc;
            x = -155;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_restoreAccount");
        }

        private void refreshDb_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = refreshDb;
            x = -175;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)Application.Current.FindResource("av_popup_updAccounts");
        }

    }
}
