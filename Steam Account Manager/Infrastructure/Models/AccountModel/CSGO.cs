using System;

namespace Steam_Account_Manager.Infrastructure.Models.AccountModel
{
    [Serializable]
    internal sealed class CSGO
    {
        //ranks 5x5
        private string _currentRank, _bestRank;

        //global stats
        private string _kills, _deaths, _playedMatches, _matchesWon, _totalShots,
            _headshots, _shotsHit, _roundsPlayed, _kd, _winrate, _headshotPercent, _accuracy;

        public string Accuracy
        {
            get => _accuracy;
            set => _accuracy = value;

        }
        public string HeadshotPercent
        {
            get => _headshotPercent ?? "-";
            set => _headshotPercent = value;
        }
        public string Winrate
        {
            get => _winrate ?? "-";
            set => _winrate = value;
        }
        public string KD
        {
            get => _kd ?? "-";
            set => _kd = value;
        }
        public string RoundsPlayed
        {
            get => _roundsPlayed ?? "-";
            set => _roundsPlayed = value;
        }
        public string PlayedMatches
        {
            get => _playedMatches ?? "-";
            set => _playedMatches = value;

        }
        public string MatchesWon
        {
            get => _matchesWon ?? "-";
            set => _matchesWon = value;

        }
        public string Headshots
        {
            get => _headshots ?? "-";
            set => _headshots = value;

        }

        public string ShotsHit
        {
            get => _shotsHit ?? "-";
            set => _shotsHit = value;

        }

        public string TotalShots
        {
            get => _totalShots ?? "-";
            set => _totalShots = value;
        }
        public string Kills
        {
            get => _kills ?? "-";
            set => _kills = value;

        }
        public string Deaths
        {
            get => _deaths ?? "-";
            set => _deaths = value;
        }

        public string CurrentRank
        {
            get => $"/Images/Ranks/CSGO/{_currentRank ?? "skillgroup_none"}.png";
            set => _currentRank = value;
        }


        public string BestRank
        {
            get => $"/Images/Ranks/CSGO/{_bestRank ?? "skillgroup_none"}.png";
            set => _bestRank = value;
        }

    }
}
