import {Link} from 'react-router-dom'
export default function NotFoundPage(){
    return (
        <div className="flex flex-col items-center pt-40">
            <h1 className="text-pr-6">404 Not found</h1>
            <Link to="/" >Go back home</Link>
        </div>
    )
}