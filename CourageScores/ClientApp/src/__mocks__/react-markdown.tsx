import { ReactNode } from "react";

// credit goes to: https://stackoverflow.com/a/78799042
// however, with this approach, the tests cannot prove that the input text is correctly transformed.

interface ChildrenProps {
    children: ReactNode;
}

function ReactMarkdownMock({ children }: ChildrenProps) {
    return <p>{children}</p>;
}

export default ReactMarkdownMock;