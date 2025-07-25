import { useApp } from '../common/AppContainer';
import { useBranding } from '../common/BrandingContainer';
import { renderDate } from '../../helpers/rendering';

export function Heading() {
    const { build } = useApp();
    const { email, facebook, twitter, name } = useBranding();

    const version =
        build &&
        build.branch &&
        build.version &&
        build.branch !== 'release' &&
        build.date;

    function showVersion() {
        window.alert(
            `Branch: ${build.branch}\nSHA: ${build.version!.substring(0, 8)}\nPR: ${build.prName}`,
        );
    }

    function padWith0(number: number): string {
        if (number < 10) {
            return `0${number}`;
        }

        return number.toString();
    }

    function renderTime(): string {
        const buildDate = new Date(build.date!);
        return `${padWith0(buildDate.getHours())}:${padWith0(buildDate.getMinutes())}`;
    }

    return (
        <div className="d-print-none">
            <div className="d-flex p-2 justify-content-between social-header">
                <div className="">
                    <a
                        href={`mailto:${email}`}
                        className="white-link no-underline">
                        ✉️ {email}
                    </a>
                </div>
                {version ? (
                    <span
                        className="text-black bg-warning px-3"
                        onClick={showVersion}>
                        {renderDate(version)}@{renderTime()}
                    </span>
                ) : null}
                <div className="">
                    <a
                        href={`https://www.facebook.com/${facebook}`}
                        className="white-link no-underline social-icon"
                        target="_blank"
                        rel="noreferrer">
                        <img
                            alt="Facebook"
                            src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNC4xLjAsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgeD0iMHB4IiB5PSIwcHgiDQoJIHZpZXdCb3g9IjAgMCA0MCA0MCIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgNDAgNDA7IiB4bWw6c3BhY2U9InByZXNlcnZlIj4NCjxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+DQoJLnN0MHtmaWxsOnVybCgjU1ZHSURfMV8pO30NCgkuc3Qxe2ZpbGw6I0ZGRkZGRjt9DQo8L3N0eWxlPg0KPGxpbmVhckdyYWRpZW50IGlkPSJTVkdJRF8xXyIgZ3JhZGllbnRVbml0cz0idXNlclNwYWNlT25Vc2UiIHgxPSItMjc3LjM3NSIgeTE9IjQwNi42MDE4IiB4Mj0iLTI3Ny4zNzUiIHkyPSI0MDcuNTcyNiIgZ3JhZGllbnRUcmFuc2Zvcm09Im1hdHJpeCg0MCAwIDAgLTM5Ljc3NzggMTExMTUuMDAxIDE2MjEyLjMzNCkiPg0KCTxzdG9wICBvZmZzZXQ9IjAiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDYyRTAiLz4NCgk8c3RvcCAgb2Zmc2V0PSIxIiBzdHlsZT0ic3RvcC1jb2xvcjojMTlBRkZGIi8+DQo8L2xpbmVhckdyYWRpZW50Pg0KPHBhdGggY2xhc3M9InN0MCIgZD0iTTE2LjcsMzkuOEM3LjIsMzguMSwwLDI5LjksMCwyMEMwLDksOSwwLDIwLDBzMjAsOSwyMCwyMGMwLDkuOS03LjIsMTguMS0xNi43LDE5LjhsLTEuMS0wLjloLTQuNEwxNi43LDM5Ljh6Ig0KCS8+DQo8cGF0aCBjbGFzcz0ic3QxIiBkPSJNMjcuOCwyNS42bDAuOS01LjZoLTUuM3YtMy45YzAtMS42LDAuNi0yLjgsMy0yLjhoMi42VjguMmMtMS40LTAuMi0zLTAuNC00LjQtMC40Yy00LjYsMC03LjgsMi44LTcuOCw3LjhWMjANCgloLTV2NS42aDV2MTQuMWMxLjEsMC4yLDIuMiwwLjMsMy4zLDAuM2MxLjEsMCwyLjItMC4xLDMuMy0wLjNWMjUuNkgyNy44eiIvPg0KPC9zdmc+DQo="
                        />
                    </a>
                    <a
                        href={`https://twitter.com/${twitter}`}
                        className="white-link no-underline social-icon"
                        target="_blank"
                        rel="noreferrer">
                        <img
                            alt="Twitter"
                            src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjwhLS0gQ3JlYXRlZCB3aXRoIElua3NjYXBlIChodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy8pIC0tPgoKPHN2ZwogICB4bWxuczpkYz0iaHR0cDovL3B1cmwub3JnL2RjL2VsZW1lbnRzLzEuMS8iCiAgIHhtbG5zOmNjPSJodHRwOi8vY3JlYXRpdmVjb21tb25zLm9yZy9ucyMiCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6c3ZnPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIKICAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogICB4bWxuczpzb2RpcG9kaT0iaHR0cDovL3NvZGlwb2RpLnNvdXJjZWZvcmdlLm5ldC9EVEQvc29kaXBvZGktMC5kdGQiCiAgIHhtbG5zOmlua3NjYXBlPSJodHRwOi8vd3d3Lmlua3NjYXBlLm9yZy9uYW1lc3BhY2VzL2lua3NjYXBlIgogICB3aWR0aD0iMTcxLjUwNTQiCiAgIGhlaWdodD0iMTM5LjM3ODM5IgogICBpZD0ic3ZnMiIKICAgdmVyc2lvbj0iMS4xIgogICBpbmtzY2FwZTp2ZXJzaW9uPSIwLjQ4LjQgcjk5MzkiCiAgIHNvZGlwb2RpOmRvY25hbWU9IlR3aXR0ZXJfYmlyZF9sb2dvXzIwMTIuc3ZnIj4KICA8ZGVmcwogICAgIGlkPSJkZWZzNCIgLz4KICA8c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9ImJhc2UiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjNjY2NjY2IgogICAgIGJvcmRlcm9wYWNpdHk9IjEuMCIKICAgICBpbmtzY2FwZTpwYWdlb3BhY2l0eT0iMC4wIgogICAgIGlua3NjYXBlOnBhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6em9vbT0iMy43MjAwNTcxIgogICAgIGlua3NjYXBlOmN4PSIxMDEuMjk0MTMiCiAgICAgaW5rc2NhcGU6Y3k9IjUwLjE4MTE0MiIKICAgICBpbmtzY2FwZTpkb2N1bWVudC11bml0cz0icHgiCiAgICAgaW5rc2NhcGU6Y3VycmVudC1sYXllcj0ibGF5ZXIxIgogICAgIHNob3dncmlkPSJmYWxzZSIKICAgICBpbmtzY2FwZTp3aW5kb3ctd2lkdGg9IjEyODAiCiAgICAgaW5rc2NhcGU6d2luZG93LWhlaWdodD0iOTYyIgogICAgIGlua3NjYXBlOndpbmRvdy14PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3cteT0iLTgiCiAgICAgaW5rc2NhcGU6d2luZG93LW1heGltaXplZD0iMSIKICAgICBmaXQtbWFyZ2luLXRvcD0iMCIKICAgICBmaXQtbWFyZ2luLWxlZnQ9IjAiCiAgICAgZml0LW1hcmdpbi1yaWdodD0iMCIKICAgICBmaXQtbWFyZ2luLWJvdHRvbT0iMCIgLz4KICA8bWV0YWRhdGEKICAgICBpZD0ibWV0YWRhdGE3Ij4KICAgIDxyZGY6UkRGPgogICAgICA8Y2M6V29yawogICAgICAgICByZGY6YWJvdXQ9IiI+CiAgICAgICAgPGRjOmZvcm1hdD5pbWFnZS9zdmcreG1sPC9kYzpmb3JtYXQ+CiAgICAgICAgPGRjOnR5cGUKICAgICAgICAgICByZGY6cmVzb3VyY2U9Imh0dHA6Ly9wdXJsLm9yZy9kYy9kY21pdHlwZS9TdGlsbEltYWdlIiAvPgogICAgICA8L2NjOldvcms+CiAgICA8L3JkZjpSREY+CiAgPC9tZXRhZGF0YT4KICA8ZwogICAgIGlua3NjYXBlOmxhYmVsPSJMYXllciAxIgogICAgIGlua3NjYXBlOmdyb3VwbW9kZT0ibGF5ZXIiCiAgICAgaWQ9ImxheWVyMSIKICAgICB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMjgyLjMyMDUzLC0zOTYuMzA3MzQpIj4KICAgIDxwYXRoCiAgICAgICBzdHlsZT0iZmlsbDojMmFhOWUwIgogICAgICAgaW5rc2NhcGU6Y29ubmVjdG9yLWN1cnZhdHVyZT0iMCIKICAgICAgIGlkPSJwYXRoNSIKICAgICAgIGQ9Im0gNDUzLjgyNTkzLDQxMi44MDYxOSBjIC02LjMwOTcsMi43OTg5NyAtMTMuMDkxODksNC42ODk4MiAtMjAuMjA4NTIsNS41NDA0OSA3LjI2NDEzLC00LjM1NDU0IDEyLjg0NDA2LC0xMS4yNDk5MiAxNS40NzA2NywtMTkuNDY2NzUgLTYuNzk5MzQsNC4wMzI5NSAtMTQuMzI5Myw2Ljk2MDU1IC0yMi4zNDQ2MSw4LjUzODQxIC02LjQxNzc1LC02LjgzODc5IC0xNS41NjI0MywtMTEuMTExIC0yNS42ODI5OCwtMTEuMTExIC0xOS40MzE1OSwwIC0zNS4xODY5NiwxNS43NTM2NSAtMzUuMTg2OTYsMzUuMTg1MjUgMCwyLjc1NzgxIDAuMzExMjgsNS40NDM1OSAwLjkxMTU1LDguMDE4NzUgLTI5LjI0MzQ0LC0xLjQ2NzIzIC01NS4xNjk5NSwtMTUuNDc1ODIgLTcyLjUyNDYxLC0zNi43NjM5NiAtMy4wMjg3OSw1LjE5NjYyIC00Ljc2NDQzLDExLjI0MDQ4IC00Ljc2NDQzLDE3LjY4OTEgMCwxMi4yMDc3NyA2LjIxMTk0LDIyLjk3NzQ3IDE1LjY1MzMyLDI5LjI4NzE2IC01Ljc2NzczLC0wLjE4MjY1IC0xMS4xOTMzMSwtMS43NjU2NSAtMTUuOTM3MTYsLTQuNDAwODMgLTAuMDA0LDAuMTQ2NjMgLTAuMDA0LDAuMjk0MTIgLTAuMDA0LDAuNDQyNDggMCwxNy4wNDc2NyAxMi4xMjg4OSwzMS4yNjgwNiAyOC4yMjU1NSwzNC41MDI2NiAtMi45NTI0NywwLjgwNDM2IC02LjA2MTAxLDEuMjMzOTggLTkuMjY5ODksMS4yMzM5OCAtMi4yNjczLDAgLTQuNDcxMTQsLTAuMjIxMjQgLTYuNjIwMTEsLTAuNjMxMTQgNC40NzgwMSwxMy45Nzg1NyAxNy40NzIxNCwyNC4xNTE0MyAzMi44Njk5MiwyNC40MzQ0MSAtMTIuMDQyMjcsOS40Mzc5NiAtMjcuMjEzNjYsMTUuMDYzMzUgLTQzLjY5OTY1LDE1LjA2MzM1IC0yLjg0MDE0LDAgLTUuNjQwODIsLTAuMTY3MjIgLTguMzkzNDksLTAuNDkyMjMgMTUuNTcxODYsOS45ODQyMSAzNC4wNjcwMywxNS44MDk0IDUzLjkzNzY4LDE1LjgwOTQgNjQuNzIwMjQsMCAxMDAuMTEzMDEsLTUzLjYxNTI0IDEwMC4xMTMwMSwtMTAwLjExMzg3IDAsLTEuNTI1NTQgLTAuMDM0MywtMy4wNDI1MSAtMC4xMDIwNCwtNC41NTI2MSA2Ljg3Mzk0LC00Ljk1OTk1IDEyLjgzODkxLC0xMS4xNTY0NiAxNy41NTYxOCwtMTguMjEzMDUgeiIgLz4KICA8L2c+Cjwvc3ZnPgo="
                        />
                    </a>
                </div>
            </div>
            <h1 className="heading">{name}</h1>
        </div>
    );
}
