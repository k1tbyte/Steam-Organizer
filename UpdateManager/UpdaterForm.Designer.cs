namespace UpdateManager
{
    partial class UpdaterForm
    {
        /// <summary>
        ///  Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        ///  Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(UpdaterForm));
            this.ProgressBar = new CircularProgressBar.CircularProgressBar();
            this.label1 = new System.Windows.Forms.Label();
            this.label3 = new System.Windows.Forms.Label();
            this.SubtitleProgress = new System.Windows.Forms.Label();
            this.ProgressTitle = new System.Windows.Forms.Label();
            this.SuspendLayout();
            // 
            // ProgressBar
            // 
            this.ProgressBar.AnimationFunction = WinFormAnimation.KnownAnimationFunctions.Liner;
            this.ProgressBar.AnimationSpeed = 0;
            this.ProgressBar.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(42)))), ((int)(((byte)(40)))), ((int)(((byte)(60)))));
            this.ProgressBar.Font = new System.Drawing.Font("Cascadia Mono PL", 26F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point);
            this.ProgressBar.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(67)))), ((int)(((byte)(55)))), ((int)(((byte)(147)))));
            this.ProgressBar.InnerColor = System.Drawing.Color.FromArgb(((int)(((byte)(42)))), ((int)(((byte)(40)))), ((int)(((byte)(60)))));
            this.ProgressBar.InnerMargin = 2;
            this.ProgressBar.InnerWidth = -1;
            this.ProgressBar.Location = new System.Drawing.Point(69, 145);
            this.ProgressBar.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            this.ProgressBar.MarqueeAnimationSpeed = 0;
            this.ProgressBar.Name = "ProgressBar";
            this.ProgressBar.OuterColor = System.Drawing.Color.FromArgb(((int)(((byte)(28)))), ((int)(((byte)(26)))), ((int)(((byte)(43)))));
            this.ProgressBar.OuterMargin = -25;
            this.ProgressBar.OuterWidth = 26;
            this.ProgressBar.ProgressColor = System.Drawing.Color.FromArgb(((int)(((byte)(67)))), ((int)(((byte)(55)))), ((int)(((byte)(147)))));
            this.ProgressBar.ProgressWidth = 6;
            this.ProgressBar.SecondaryFont = new System.Drawing.Font("Cascadia Mono PL", 36F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.ProgressBar.Size = new System.Drawing.Size(187, 185);
            this.ProgressBar.StartAngle = 270;
            this.ProgressBar.Style = System.Windows.Forms.ProgressBarStyle.Continuous;
            this.ProgressBar.SubscriptColor = System.Drawing.Color.FromArgb(((int)(((byte)(166)))), ((int)(((byte)(166)))), ((int)(((byte)(166)))));
            this.ProgressBar.SubscriptMargin = new System.Windows.Forms.Padding(10, -35, 0, 0);
            this.ProgressBar.SubscriptText = "";
            this.ProgressBar.SuperscriptColor = System.Drawing.Color.FromArgb(((int)(((byte)(166)))), ((int)(((byte)(166)))), ((int)(((byte)(166)))));
            this.ProgressBar.SuperscriptMargin = new System.Windows.Forms.Padding(10, 35, 0, 0);
            this.ProgressBar.SuperscriptText = "";
            this.ProgressBar.TabIndex = 0;
            this.ProgressBar.Text = "0 %";
            this.ProgressBar.TextMargin = new System.Windows.Forms.Padding(5);
            this.ProgressBar.Value = 68;
            // 
            // label1
            // 
            this.label1.Font = new System.Drawing.Font("Cascadia Mono PL", 20.75F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point);
            this.label1.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(67)))), ((int)(((byte)(55)))), ((int)(((byte)(147)))));
            this.label1.Location = new System.Drawing.Point(50, 28);
            this.label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(225, 85);
            this.label1.TabIndex = 1;
            this.label1.Text = "Steam Account\r\n   Manager";
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Font = new System.Drawing.Font("Microsoft Sans Serif", 11.25F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.label3.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(85)))), ((int)(((byte)(213)))), ((int)(((byte)(219)))));
            this.label3.Location = new System.Drawing.Point(56, 420);
            this.label3.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(212, 18);
            this.label3.TabIndex = 1;
            this.label3.Text = "Wait for the installation to finish";
            // 
            // SubtitleProgress
            // 
            this.SubtitleProgress.AutoSize = true;
            this.SubtitleProgress.Font = new System.Drawing.Font("Microsoft Sans Serif", 12F, System.Drawing.FontStyle.Regular, System.Drawing.GraphicsUnit.Point);
            this.SubtitleProgress.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(123)))), ((int)(((byte)(92)))), ((int)(((byte)(214)))));
            this.SubtitleProgress.Location = new System.Drawing.Point(132, 366);
            this.SubtitleProgress.Margin = new System.Windows.Forms.Padding(117, 0, 4, 0);
            this.SubtitleProgress.Name = "SubtitleProgress";
            this.SubtitleProgress.Size = new System.Drawing.Size(49, 20);
            this.SubtitleProgress.TabIndex = 1;
            this.SubtitleProgress.Text = "0b/0b";
            this.SubtitleProgress.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // ProgressTitle
            // 
            this.ProgressTitle.AutoSize = true;
            this.ProgressTitle.Font = new System.Drawing.Font("Microsoft Sans Serif", 15F, System.Drawing.FontStyle.Bold, System.Drawing.GraphicsUnit.Point);
            this.ProgressTitle.ForeColor = System.Drawing.Color.FromArgb(((int)(((byte)(67)))), ((int)(((byte)(55)))), ((int)(((byte)(147)))));
            this.ProgressTitle.Location = new System.Drawing.Point(104, 335);
            this.ProgressTitle.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            this.ProgressTitle.Name = "ProgressTitle";
            this.ProgressTitle.Size = new System.Drawing.Size(107, 25);
            this.ProgressTitle.TabIndex = 1;
            this.ProgressTitle.Text = "Loading...";
            this.ProgressTitle.TextAlign = System.Drawing.ContentAlignment.MiddleCenter;
            // 
            // UpdaterForm
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(7F, 15F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.BackColor = System.Drawing.Color.FromArgb(((int)(((byte)(42)))), ((int)(((byte)(40)))), ((int)(((byte)(60)))));
            this.ClientSize = new System.Drawing.Size(323, 474);
            this.Controls.Add(this.SubtitleProgress);
            this.Controls.Add(this.ProgressTitle);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.ProgressBar);
            this.Cursor = System.Windows.Forms.Cursors.WaitCursor;
            this.FormBorderStyle = System.Windows.Forms.FormBorderStyle.None;
            this.Icon = ((System.Drawing.Icon)(resources.GetObject("$this.Icon")));
            this.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            this.Name = "UpdaterForm";
            this.Opacity = 0.95D;
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = "Update Manager";
            this.Load += new System.EventHandler(this.OnFormLoad);
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private CircularProgressBar.CircularProgressBar ProgressBar;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label SubtitleProgress;
        private System.Windows.Forms.Label ProgressTitle;
    }
}