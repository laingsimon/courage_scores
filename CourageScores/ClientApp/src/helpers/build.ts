import {IBuild} from "../components/common/IBuild";

function getBuildDetail(name: string): string | null {
    const meta = document.querySelector(`meta[name="build:${name}"]`);
    return meta
        ? meta.getAttribute('content')
        : null;
}

export function getBuild(): IBuild {
    const prNumber = getBuildDetail('pr_number');

    return {
        branch: getBuildDetail('branch'),
        version: getBuildDetail('sha'),
        date: getBuildDetail('date'),
        prName: getBuildDetail('pr_name'),
        prLink: prNumber
            ? `https://github.com/laingsimon/courage_scores/pull/${prNumber}/`
            : undefined,
    };
}
