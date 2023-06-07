function getBuildDetail(name) {
    const meta = document.querySelector(`meta[name="build:${name}"]`);
    return meta
        ? meta.getAttribute('content')
        : null;
}

export function getBuild() {
    return {
        branch: getBuildDetail('branch'),
        version: getBuildDetail('sha'),
        date: getBuildDetail('date'),
    };
}
