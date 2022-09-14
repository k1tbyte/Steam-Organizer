using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Runtime.InteropServices;

namespace UpdateManager
{
    public partial class UpdaterForm : Form
    {
        [DllImport("Gdi32.dll", EntryPoint = "CreateRoundRectRgn")]
        private static extern IntPtr CreateRoundRectRgn
            (
            int nLeftRect,
            int nTopRect,
            int RightRect,
            int nBottomRect,
            int nWidthEllipse,
            int nHeightEllipse

            );

        private void SetProgressTitle(string Title)
        {
            ProgressTitle.Text = Title;
            ProgressTitle.Left = ((ClientSize.Width - ProgressTitle.Width) / 2) + 5;
        }

        private async Task ProgrammUpdate()
        {
            string URL = "https://drive.google.com/uc?export=download&id=11mSIJZeTQhUHtnDVwa74iQuAQXJ8WH5Q";
            SetProgressTitle("Downloading...");

            using (WebClient webClient = new WebClient())
            {
                webClient.Proxy = null;
                try
                {
                    webClient.OpenRead(URL);
                }
                catch
                {
                    SetProgressTitle("No internet connection!");
                    Thread.Sleep(1200);
                    this.Close();
                }

                string size = (Convert.ToDouble(webClient.ResponseHeaders["Content-Length"]) / 1048576).ToString("#.# MB");

                webClient.DownloadProgressChanged += (s, e) =>
                {
                    ProgressBar.Value = e.ProgressPercentage;
                    ProgressBar.Text = e.ProgressPercentage.ToString() + "%";
                    SubtitleProgress.Text = $"{(double)e.BytesReceived / 1048576:#.# MB}/{size}";
                    SubtitleProgress.Left = (ClientSize.Width - SubtitleProgress.Width) / 2;
                };

                await webClient.DownloadFileTaskAsync(URL, @"LastUpd.zip");

                Thread.Sleep(800);
                SetProgressTitle("Extracting...");
                ProgressBar.Value = 0;
                Thread.Sleep(600);

                SubtitleProgress.Text = "";
                SubtitleProgress.Left = (ClientSize.Width - SubtitleProgress.Width) / 2;

                for (int i = 0; i < 50; i++)
                {
                    ProgressBar.Value += 1;
                    ProgressBar.Text = ProgressBar.Value.ToString() + "%";
                    Thread.Sleep(50);
                }

                Directory.CreateDirectory(@".\Temp");
                ZipFile.ExtractToDirectory(@".\LastUpd.zip", @".\Temp");

                if (File.Exists(@".\Temp\UpdateManager.exe"))
                    File.Delete(@".\Temp\UpdateManager.exe");

                var updateFiles = Directory.GetFiles(@".\Temp").Select(a => Path.GetFileName(a));

                foreach (var item in updateFiles)
                {
                    File.Move($@".\Temp\{item}", $@".\{item}", true);
                }

                var dirs = Directory.GetDirectories(@".\Temp", "*", SearchOption.TopDirectoryOnly);
                foreach (var item in dirs)
                {
                    var tmpDir = item.Split('\\');
                    var clearDir = tmpDir[tmpDir.Length - 1];

                    if (Directory.Exists($@".\{clearDir}"))
                    {
                        Directory.Delete($@".\{clearDir}", true);

                        Directory.CreateDirectory($@".\{clearDir}");
                    }
                    else
                    {
                        Directory.CreateDirectory($@".\{clearDir}");
                    }

                    try
                    {

                        var files = Directory.GetFiles(item).Select(a => Path.GetFileName(a));
                        foreach (var copied in files)
                        {
                            File.Copy($@".\Temp\{clearDir}\{copied}", $@".\{clearDir}\{copied}");
                        }
                    }
                    catch { }
                }
                for (int i = 50; i < 100; i++)
                {
                    ProgressBar.Value += 1;
                    ProgressBar.Text = ProgressBar.Value.ToString() + "%";
                    Thread.Sleep(50);
                }

                Directory.Delete(@".\Temp", true);
                File.Delete(@".\LastUpd.zip");

                Process.Start(@".\Steam Account Manager.exe");
                this.Close();
            }



        }

        public UpdaterForm()
        {
            InitializeComponent();
            Region = System.Drawing.Region.FromHrgn(CreateRoundRectRgn(0, 0, Width, Height, 25, 25));
            ProgressBar.Value = 0;
            SubtitleProgress.Text = "";


        }

        private void OnFormLoad(object sender, EventArgs e)
        {
            Task.Factory.StartNew(() =>
            {
                ProgrammUpdate();
            });


        }
    }
}
