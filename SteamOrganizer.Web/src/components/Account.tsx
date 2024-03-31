import { IoEnterOutline } from "react-icons/io5";
import { TiPin } from "react-icons/ti";
import { FaPen } from "react-icons/fa6";
import { MdDelete} from "react-icons/md";
function Account() {
  return (
      <div className="">
        <div className="inline-flex rounded-[3px] bg-pr-2 text-sm h-[105px] min-w-[453px] text-nowrap">
          <div className="flex justify-center py-6 px-2">
            <img src="https://ui-avatars.com/api/?background=c7d2fe&color=3730a3&bold=true" alt="..." className="rounded-full border-indigo-600  border-2 w-[60px] h-[60px] "/>
          </div>
          <div className="flex py-4 flex-col">
            <div className="flex text-white">
              <h3 className="font-bold mr-2">Test nickname</h3>
              <div className="sm-button bg-pr-4">
                <IoEnterOutline className="h-full text-white"/>
              </div>
              <div className="sm-button bg-pr-4">
                <FaPen className="h-full text-white"></FaPen>
              </div>
            </div>
            <div className="flex">
              <div className="basis-1/2">
                <div className="flex">
                  <div className="sm-button bg-pr-4">Level :1</div>
                  <div className="sm-button bg-pr-4">Years :1</div>
                </div>
                <div className="text-pr-4 flex">ID: <div className="ml-2 text-white font-extralight">1337</div></div>
              </div>
              <div className="basis-1/2 flex-col">
                <div className="flex">
                  <div className="sm-button bg-green-500">VAC</div>
                  <div className="sm-button bg-green-500">Game</div>
                </div>
                <div className="flex">
                  <div className="sm-button bg-green-500">Trade</div>
                  <div className="sm-button bg-green-500">Community</div>
                </div>
              </div>
            </div>

          </div>
          <div className=" flex flex-col justify-between my-3 ml-5 mr-4 items-end">
            <div className="">
              <TiPin className="h-full text-lg text-fg-1"></TiPin>
            </div>
            <div className="">
              <MdDelete className="h-full text-lg text-fg-1"></MdDelete>
            </div>
          </div>
        </div>
      </div>

  )
}

export default Account
