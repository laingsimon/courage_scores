import {IBuild} from "../components/common/IBuild";

function getBuildDetail(name: string): string | null {
    const meta = document.querySelector(`meta[name="build:${name}"]`);
    return meta
        ? meta.getAttribute('content')
        : null;
}

export function getBuild(): IBuild {
    return {
        branch: getBuildDetail('branch'),
        version: getBuildDetail('sha'),
        date: getBuildDetail('date'),
        prName: getBuildDetail('pr_name'),
        prLink: getBuildDetail('pr_link'),
    };
}
