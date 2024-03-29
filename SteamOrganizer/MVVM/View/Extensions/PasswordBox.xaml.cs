﻿using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class PasswordBox : Border
    {
        public static readonly DependencyProperty ForegroundProperty =
            DependencyProperty.Register("Foreground", typeof(Brush), typeof(PasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.Gray)));

        public static readonly DependencyProperty SelectionBrushProperty =
          DependencyProperty.Register("SelectionBrush", typeof(Brush), typeof(PasswordBox), new PropertyMetadata(new SolidColorBrush(Colors.White)));

        public static readonly DependencyProperty IsPasswordShownProperty =
         DependencyProperty.Register("IsPasswordShown", typeof(bool), typeof(PasswordBox), new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, OnPasswordStateChanged));

        public static readonly DependencyProperty PasswordProperty =
            DependencyProperty.Register("Password", typeof(string), typeof(PasswordBox), new FrameworkPropertyMetadata(null,FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, new PropertyChangedCallback(OnPasswordPropertyChanged)));

        private static bool AllowCallback = true;

   //     public Action<object, TextCompositionEventArgs> PasswordChanged { get; set; }
        public string Password
        {
            get => (string)GetValue(PasswordProperty);
            set => SetValue(PasswordProperty, value);
        }

        public int MaxLength
        {
            get => PassBox.MaxLength;
            set => PassBox.MaxLength = PassTextBox.MaxLength = value;
        }

        public Visibility ShowButtonVisibility
        {
            get => ShowButton.Visibility;
            set => ShowButton.Visibility = value;
        }

        public Brush Foreground
        {
            get => (Brush)GetValue(ForegroundProperty);
            set => SetValue(ForegroundProperty, value);
        }

        public Brush SelectionBrush
        {
            get => (Brush)GetValue(SelectionBrushProperty);
            set => SetValue(SelectionBrushProperty, value);
        }


        public bool IsPasswordShown
        {
            get => (bool)GetValue(IsPasswordShownProperty);
            set => SetValue(IsPasswordShownProperty, value);
        }

        public void Clear() => PassBox.Clear();
        

        private static void OnPasswordStateChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            var passBox = (PasswordBox)d;

            
            if(e.NewValue is bool show)
            {
                if (show)
                {
                    passBox.PassTextBox.Visibility = Visibility.Visible;
                    passBox.PassBox.Visibility = Visibility.Collapsed;
                }
                else
                {
                    passBox.PassTextBox.Visibility = Visibility.Collapsed;
                    passBox.PassBox.Visibility = Visibility.Visible;
                }
            }
        }

        private static void OnPasswordPropertyChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            var passBox = d as PasswordBox;
          //  passBox.PasswordChanged?.Invoke(passBox,null);

            if (!AllowCallback)
                return;

            AllowCallback = false;
            passBox.PassBox.Password = e.NewValue as string;
            AllowCallback = true;
            return;
        }

        public PasswordBox()
        {
            InitializeComponent();
            Area.DataContext = this;

            PassBox.PasswordChanged += (sender,e) =>
            {
                if (!AllowCallback)
                    return;

                AllowCallback = false;
                Password = PassBox.Password;
                AllowCallback = true;
            };
        }
    }
}
