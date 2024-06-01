import BackupCard from "./BackupCard.tsx";

export default function Backups(){
    return (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(350px,1fr))] p-2 gap-2">
            <BackupCard name="Backup 1"/>
            <BackupCard/>
            <BackupCard name="Backup 131363546" date={new Date(2024, 4, 22, 23, 30, 0)}/>
        </div>
    );
}