using System.Windows;
using System.Windows.Media.Animation;

namespace Steam_Account_Manager.Themes
{
    internal static class Animations
    {
        internal static void ShakingAnimation(FrameworkElement element, bool opacity = false)
        {
            var marginAnim = new ThicknessAnimation(element.Margin,
                new Thickness(element.Margin.Left + 5d, element.Margin.Top, element.Margin.Right, element.Margin.Bottom), System.TimeSpan.FromSeconds(0.2d))
            {
                RepeatBehavior = new RepeatBehavior(3d),
                AutoReverse = true
            };

            element.BeginAnimation(FrameworkElement.MarginProperty, marginAnim);

            if (!opacity) return;

            var opacityAnim = new DoubleAnimation(0, 1d, System.TimeSpan.FromSeconds(1.2d))
            {
                AutoReverse = true
            };

            element.BeginAnimation(FrameworkElement.OpacityProperty, opacityAnim);
        }
    }
}
