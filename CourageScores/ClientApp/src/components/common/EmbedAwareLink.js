import {Link} from "react-router-dom";
import {useApp} from "../../AppContainer";

export function EmbedAwareLink({ children, to }) {
    const { embed } = useApp();
    const props = embed ? getEmbeddedLinkProps() : {};

    function getEmbeddedLinkProps() {
        return {
            target: "_blank",
            rel: "noopener noreferrer",
        };
    }

    return (<Link to={to} {...props}>{children}</Link>);
}