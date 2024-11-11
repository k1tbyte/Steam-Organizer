import { FC } from 'react'

const SignIn: FC = () => {
    return (
        <div className="block lg:flex h-screen">
            <div className="w-full bg-primary h-screen flex items-center justify-center lg:w-1/2">
                <div className="px-10">
                    <div className="relative mb-32 flex justify-center items-center">
                       {/* <img src={grid} alt="grid" className="absolute"/>*/}
                       {/* <Logo width={128} height={128}/>*/}
                    </div>
                    <h1 className="text-4xl lg:text-3xl text-foreground font-bold">Steam organizer</h1>
                    <p className="text-foreground-muted text-xl mt-2">Access to your steam accounts everywhere</p>
                    <button className="btn-primary flex items-center justify-center">
                        {/*  <FaGoogle className="mr-4"/>*/}
                        Login with Google
                    </button>
                </div>
            </div>
            <div className="flex items-center h-full w-full justify-center">
                Something
            </div>
        </div>
    )
}

export default SignIn;