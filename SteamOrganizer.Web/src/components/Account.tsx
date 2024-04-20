import { FaSignInAlt } from "react-icons/fa";
import { FaPenToSquare } from "react-icons/fa6";
import { BsPinAngleFill } from "react-icons/bs";
import { MdDelete} from "react-icons/md";

function Account() {
  return (
      <div className="flex min-h-[105px] bg-pr-2  p-4 pr-10 rounded-[3px] relative">
          <img
              src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true"
              alt=""
              className="w-[55px] h-[55px] rounded-lg primary-grad"
          />

          <div className="ml-3">
              <div className="flex">
                  <span className="text-[14px]">Why u bully me</span>
                  <button className="btn-rect ml-2">
                      <FaSignInAlt size={14}/>
                  </button>
                  <button className="btn-rect ml-[6px]">
                      <FaPenToSquare size={14}/>
                  </button>
              </div>
              <div className="text-xs mt-[7px] flex flex-wrap font-bold font-segoe text-pr-1 gap-[5px]">

                  <div className="flex text-nowrap gap-[5px] mr-2">
                      <div className="chip-rect">Level: 1000</div>
                      <div className="chip-rect">Years: 4</div>
                  </div>

                  <div className="flex flex-wrap gap-[5px] ">
                      <div className="chip-rect bg-success">VAC</div>
                      <div className="chip-rect bg-success">Game</div>
                      <div className="chip-rect bg-success">Trade</div>
                      <div className="chip-rect bg-success">Community</div>
                  </div>

                  <span className="text-fg-2 font-medium w-full"><b className="text-pr-4">ID:</b> 144156554</span>
              </div>
          </div>

          <BsPinAngleFill className="absolute text-fg-1 right-3 top-3 hover:text-yellow-300 btn" size={17}/>
          <MdDelete className="absolute text-fg-1 right-3 bottom-3 hover:text-failed btn" size={20}/>

      </div>

  )
}

export default Account
