using SteamKit2;
using SteamKit2.Internal;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.Base
{
    internal class GamesHandler : ClientMsgHandler
    {
        internal const byte MaxGamesPlayed = 32;

        public override void HandleMsg(IPacketMsg PacketMsg)
        {
            if (Client == null)
                throw new InvalidOperationException(nameof(Client));

            switch (PacketMsg.MsgType)
            {
                case EMsg.ClientPlayingSessionState:
                    var playingSessionState = new ClientMsgProtobuf<CMsgClientPlayingSessionState>(PacketMsg);
                    Client.PostCallback(new PlayingSessionStateCallback(PacketMsg.TargetJobID, playingSessionState.Body));

                    break;
            }

        }

        
        internal async Task PlayGames(IReadOnlyCollection<uint> GameIDs, string gameName = null)
        {
            if (Client == null)
                throw new InvalidOperationException(nameof(Client));

            if (!Client.IsConnected)
                return;

            var request = new ClientMsgProtobuf<CMsgClientGamesPlayed>(EMsg.ClientGamesPlayedWithDataBlob)
            {
                Body =
                {
                    client_os_type = unchecked((uint)SteamRemoteClient.OSType)
                }
            };

            if (!String.IsNullOrEmpty(gameName))
            {
                Client.Send(request);
                await Task.Delay(SteamRemoteClient.CallbackSleep).ConfigureAwait(false);

                request.Body.games_played.Add(
                    new CMsgClientGamesPlayed.GamePlayed
                    {
                        game_extra_info = gameName,
                        game_id = new GameID
                        {
                            AppType = GameID.GameType.Shortcut,
                            ModID = uint.MaxValue
                        }
                    });
            }

            if(GameIDs != null && GameIDs.Count > 0)
            {
                IEnumerable<uint> uniqueValidGameIDs = (GameIDs as ISet<uint> ?? GameIDs.Distinct()).Where(gameID => gameID > 0);

                foreach (uint gameID in uniqueValidGameIDs)
                {
                    if(request.Body.games_played.Count >= MaxGamesPlayed)
                    {
                        if (String.IsNullOrEmpty(gameName))
                            throw new ArgumentOutOfRangeException(nameof(GameIDs));

                        gameName = null;

                        request.Body.games_played.RemoveAt(0);
                    }

                    request.Body.games_played.Add(
                        new CMsgClientGamesPlayed.GamePlayed
                        {
                            game_id = new GameID(gameID)
                        });
                }
            }
            
            Client.Send(request);
        }

        internal sealed class PlayingSessionStateCallback : CallbackMsg
        {
            internal readonly bool PlayingBlocked;

            internal PlayingSessionStateCallback(JobID jobID, CMsgClientPlayingSessionState msg)
            {
                if (msg == null || jobID == null)
                    new ArgumentNullException();

                JobID = jobID;
                PlayingBlocked = msg.playing_blocked;
            }
        }
    }
}
