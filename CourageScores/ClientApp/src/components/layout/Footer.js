import {Link} from "react-router-dom";

export function Footer() {
    return (<div className="text-center my-4">
        <Link to={'/about'} className="text-light no-underline">
            About
        </Link>
    </div>);
}