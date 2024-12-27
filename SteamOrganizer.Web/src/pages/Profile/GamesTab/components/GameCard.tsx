import { FC, memo } from "react";
import { type SteamGameInfo } from "@/types/steamPlayerSummary";
import styles from "./GameCard.module.css";

const getPlaytimeColor = (playtime: number) => {
    if (playtime === 0) return 'bg-transparent text-foreground-muted';
    if (playtime < 24) return 'bg-green-400';
    if (playtime < 100) return 'bg-orange-400';
    return 'bg-red-400';
};

const formatPlaytime = (playtime: number) => {
    if (playtime === 0) return '—';
    if (playtime < 1) return `${(playtime * 60).toFixed(0)} m`;
    return `${playtime.toFixed(1)} h`;
};

const Card: FC<{ game: SteamGameInfo }> = ({ game }) => (
    <div className={styles.gameRow}>
        <div className={styles.leftContainer}>
            <img className={styles.image}
                 src={`https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps/${game.appId}/capsule_231x87.jpg`} />
            <div className={styles.price}>{game.formattedPrice}</div>
        </div>
        <span className={styles.name}>{game.name}</span>
        <div className={styles.appId}>{game.appId}</div>
        <div className={styles.time}>
            <span className={`chip text-background font-bold ${getPlaytimeColor(game.playtime_forever)}`}>
                {formatPlaytime(game.playtime_forever)}
            </span>
        </div>
    </div>
);

export const GameCard = memo(Card);