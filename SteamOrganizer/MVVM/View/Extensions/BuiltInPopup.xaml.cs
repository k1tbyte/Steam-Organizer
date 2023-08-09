using SteamKit2.Internal;
using SteamOrganizer.Infrastructure;
using System;
using System.Threading;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class BuiltInPopup : Grid
    {
        internal Action Closed;

        public static readonly DependencyProperty PopupContentProperty =
          DependencyProperty.Register("PopupContent", typeof(object), typeof(BuiltInPopup), new PropertyMetadata(null));

        public static readonly DependencyProperty CornerRadiusProperty =
          DependencyProperty.Register("CornerRadius", typeof(CornerRadius), typeof(BuiltInPopup));

        internal readonly SemaphoreSlim OpenedSemaphore = new SemaphoreSlim(1, 1);

        private DoubleAnimation OpeningAnimation;
        private DoubleAnimation ClosingAnimation;


        public bool IsOpen
        {
            get => this.Visibility == Visibility.Visible;
            set
            {
                if (value)
                {
                    if(OpenedSemaphore.CurrentCount == 0)
                        return;
                    

                    Visibility            = Visibility.Visible;
                    cancel.Focus();
                    PopupPresenter.BeginAnimation(OpacityProperty, OpeningAnimation);
                    OpenedSemaphore.Wait();
                }
                else
                {
                    PopupPresenter.BeginAnimation(OpacityProperty, ClosingAnimation);
                }

            }
        }

        public object PopupContent
        {
            get => GetValue(PopupContentProperty);
            set => SetValue(PopupContentProperty, value);
        }

        public CornerRadius CornerRadius
        {
            get => (CornerRadius)GetValue(CornerRadiusProperty);
            set => SetValue(CornerRadiusProperty, value);
        }

        private void OnClosing(object sender, EventArgs e)
        {
            if (PopupContent == null)
                return;

            Visibility   = Visibility.Collapsed;
            Closed?.Invoke();
            PopupContent = null;
            Closed       = null;
            OpenedSemaphore.Release();
        }

        public BuiltInPopup()
        {
            InitializeComponent();

            PreviewKeyDown += (sender, e) =>
            {
                if (e.Key == Key.Escape)
                {
                    HidePopup(null, null);
                    e.Handled = true;
                }
            };

#if !DEBUG
            Utils.InBackground(() =>
            {
#endif
                OpeningAnimation = new DoubleAnimation(0, 1, new Duration(TimeSpan.FromSeconds(0.4))) { EasingFunction = App.Current.FindResource("BaseAnimationFunction") as IEasingFunction };
                OpeningAnimation.Freeze();

                ClosingAnimation = new DoubleAnimation(1, 0, new Duration(TimeSpan.FromSeconds(0.2)));
                ClosingAnimation.Completed += OnClosing;
                ClosingAnimation.Freeze();
#if !DEBUG
            });
#endif


            this.Splash.DataContext         = this;
            this.PopupPresenter.DataContext = this;
        }

        private void HidePopup(object sender, MouseButtonEventArgs e)
        {
            if (OpenedSemaphore.CurrentCount == 1)
                return;

            IsOpen = false;
        }
    }
}
