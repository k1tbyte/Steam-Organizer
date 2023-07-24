using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.View.Extensions;
using System;

namespace SteamOrganizer.MVVM.View.Controls
{
    public sealed partial class TextInputView : System.Windows.Controls.StackPanel
    {
        private readonly Action<string> OnSubmit;
        private readonly PasswordBox TextField;
        public TextInputView(Action<string> onSubmitTextAction,string tipMsg,bool password = false)
        {
            onSubmitTextAction.ThrowIfNull();
            OnSubmit = onSubmitTextAction;

            InitializeComponent();

            TextField = Decorator.Children[Children.Count - 1] as PasswordBox;
            Tip.Text = tipMsg;
            if(password)
            {
                TextField.IsPasswordShown      = false;
                TextField.ShowButtonVisibility = System.Windows.Visibility.Visible;
            }
        }

        private void SubmitClick(object sender, System.Windows.RoutedEventArgs e)
        {
            OnSubmit.Invoke(TextField.Password);
            App.MainWindowVM.ClosePopupWindow();
        }
    }
}
