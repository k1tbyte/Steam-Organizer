﻿using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace Steam_Account_Manager.UIExtensions
{
    public enum MboxStyle : byte
    {
        None,
        Ok,
        YesNo,
    }
    public enum MboxType : byte
    {
        Default,
        Error,
        Query
    }
    public partial class MessageWindow : Window
    {
        public double MaxWindowBoxHeight
        {
            get => MaxHeight;
            set
            {
                if (value > 0)
                    this.MaxWidth = value;
            }
        }
        public double MaxWindowBoxWidth
        {
            get => MaxHeight;
            set
            {
                if (value > 0)
                    this.MaxWidth = value;
            }
        }
        public object WindowBoxContent
        {
            set => contentArea.Content = value;
        }
        public MboxStyle WindowBoxStyle
        {
            set
            {
                no.Content = "No";
                if (value == MboxStyle.None)
                {
                    ActionPanel.Visibility = Visibility.Collapsed;
                }
                else if (value == MboxStyle.Ok)
                {
                    yes.Visibility = Visibility.Collapsed;
                    no.Content = "OK";
                }
                else if (value == MboxStyle.YesNo)
                {
                    yes.Visibility = no.Visibility = Visibility.Visible;
                }
            }
        }

        public MboxType WindowBoxType
        {
            set
            {
                errorIcon.Visibility = Visibility.Collapsed;
                if (value == MboxType.Default)
                {
                    mainBorder.BorderBrush = Title.Foreground = (Brush)App.Current.FindResource("second_main_color");
                }
                else if (value == MboxType.Error)
                {
                    mainBorder.BorderBrush = Title.Foreground = Brushes.PaleVioletRed;
                    errorIcon.Visibility = Visibility.Visible;
                }
                else if (value == MboxType.Query)
                {
                    mainBorder.BorderBrush = Title.Foreground = Brushes.Orange;
                    queryIcon.Visibility = Visibility.Visible;
                }

            }
        }

        public string WindowBoxTitle
        {
            set => Title.Text = value;
        }

        public MessageWindow()                                            =>InitializeComponent();
        private void DragMoveEvent(object sender, MouseButtonEventArgs e) => this.DragMove();
        private void no_Click(object sender, RoutedEventArgs e)           => DialogResult = false;
        private void yes_Click(object sender, RoutedEventArgs e)          => DialogResult = true;
        
    }
}