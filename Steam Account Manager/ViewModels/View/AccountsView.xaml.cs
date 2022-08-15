using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows;

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
               new CustomPopupPlacement(new Point(x,-33), PopupPrimaryAxis.Vertical);

            CustomPopupPlacement[] customPlacements =
                    new CustomPopupPlacement[] { customPlacement1 };
            return customPlacements;
        }

        private void saveDb_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = saveDb;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Save accounts database to file";
        }

        private void Popup_leave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void restoreDb_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = restoreDb;
            x = -215;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Restore accounts database from file";
        }

        private void restoreAcc_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = restoreAcc;
            x = -155;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Restore account from file";
        }

        private void refreshDb_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = refreshDb;
            x = -175;
            Popup.CustomPopupPlacementCallback = new CustomPopupPlacementCallback(placementForPopup);
            Popup.Placement = PlacementMode.Custom;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Update database information";
        }

    }
}
