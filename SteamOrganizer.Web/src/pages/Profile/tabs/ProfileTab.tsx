import {FC} from "react";
import {MdBlock} from "react-icons/md";
import {FaChevronDown} from "react-icons/fa";
import { FaAward } from "react-icons/fa6";
import {Expander} from "@/components/primitives/Expander.tsx";

const ProfileTab: FC = () => (
    <div className="grid grid-cols-3 gap-5" style={{
        gridTemplateRows: "masonry"
    }}>
            <Expander className="backdrop-primary col-span-2"
                      icon={<FaAward size={24}/>} title="Community">
                <div className="p-4">
                    <p>Content</p>
                    <p>Content</p>
                    <p>Content</p>
                </div>
            </Expander>
        <Expander className="backdrop-primary max-w-96" icon={<MdBlock size={24}/>} title="Bans">
            <div className="p-4">
                <p>Content</p>
                <p>Content</p>
                <p>Content</p>
            </div>
        </Expander>
        <Expander className="backdrop-primary" icon={<MdBlock size={24}/>} title="Bans">
            <div className="p-4">
                <p>Content</p>
            </div>
        </Expander>
    </div>
)

export default ProfileTab;