using System;


namespace Steam_Account_Manager.Infrastructure.GamesModels
{
    [Serializable]
    internal class CsgoStats
    {
        //ranks 5x5
        private string _currentRank, _bestRank;

        //global stats
        private string _kills, _deaths, _playedMatches, _matchesWon, _totalShots, _headshots, _shotsHit, _roundsPlayed; 

        public string RoundsPlayed
        {
            get => _roundsPlayed ?? "-";
            set
            {
                _roundsPlayed = value;
            }
        }
        public string PlayedMatches
        {
            get => _playedMatches ?? "-";
            set
            {
                _playedMatches = value;
            }
        }
        public string MatchesWon
        {
            get => _matchesWon ?? "-";
            set
            {
                _matchesWon = value;
            }
        }
        public string Headshots
        {
            get => _headshots ?? "-";
            set
            {
                _headshots = value;
            }
        }

        public string ShotsHit
        {
            get => _shotsHit ?? "-";
            set
            {
                _shotsHit = value;
            }
        }

        public string TotalShots
        {
            get => _totalShots ?? "-";
            set
            {
                _totalShots = value;
            }
        }
        public string Kills
        {
            get => _kills ?? "-";
            set
            {
                _kills = value;
            }
        }
        public string Deaths
        {
            get => _deaths ?? "-";
            set
            {
                _deaths = value;
            }
        }
        public string Winrate =>
            _matchesWon != "-" ? (float.Parse(_matchesWon.Replace(",", string.Empty)) / float.Parse(_playedMatches.Replace(",", string.Empty)) * 100).ToString("#.##") + "%" : "-";
        public string HeadshotPercent => 
            _headshots != "-" ? (float.Parse(_headshots.Replace(",",string.Empty))/ float.Parse(_kills.Replace(",",string.Empty))*100).ToString("#.#") + "%" : "-";
        public string KD =>
            _kills  != "-" ? (float.Parse(_kills.Replace(",", string.Empty)) / float.Parse(_deaths.Replace(",", string.Empty))).ToString("#.#") : "-";
        public string Accuracy => 
           _shotsHit != "-" ? (float.Parse(_shotsHit.Replace(",", string.Empty)) / float.Parse(_totalShots.Replace(",", string.Empty)) * 100).ToString("#.#")+"%" : "-";

        public string CurrentRank
        {
            get => $"/Images/Ranks/CSGO/{_currentRank ?? "skillgroup_none"}.png";
            set
            {
                _currentRank = value;
            }
        }

         
        public string BestRank
        {
            get => $"/Images/Ranks/CSGO/{_bestRank ?? "skillgroup_none"}.png";
            set
            {
                _bestRank = value;
            }
        }

        public CsgoStats()
        {
            CurrentRank = "skillgroup_none";
            BestRank = "skillgroup_none";
            Kills = Deaths  = PlayedMatches = MatchesWon = TotalShots = Headshots  = ShotsHit = RoundsPlayed  = "-";
        }

    }
}
