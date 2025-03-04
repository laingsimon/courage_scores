param([int] $ErrorThreshold, [int] $WarningThreshold, [string] $Extension)

Import-Module -Name "$PSScriptRoot/GitHubFunctions.psm1"

Function Get-Files($MinLines, $MaxLines)
{
    Write-Message "Finding $($Extension) files with > $($MinLines) lines and <= $($MaxLines)..."
    return Get-ChildItem -Recurse `
        | Where-Object { $_.Name.EndsWith($Extension) } `
        | Where-Object { $_.FullName.Contains("node_modules") -eq $False } `
        | Select-Object @{ label='name'; expression={$_.name} }, @{ label='lines'; expression={(Get-Content $_.FullName | Measure-Object -Line).Lines} } `
        | Where-Object { $_.lines -gt $MinLines -and $_.lines -le $MaxLines } `
        | Sort-Object -descending -property 'lines' `
        | Select-Object @{ label='row'; expression = {"| $($_.name) | $($_.lines) |" } }
}

Function Print-Files($Heading, $Files, $Comments) 
{
    $Output=""
    $Output += "| File | Lines |`n"
    $Output += "| --- | --- |`n"

    $Files | ForEach-Object { $Output += "$($_.row)`n" }

    [Console]::Error.WriteLine($Heading)
    [Console]::Error.WriteLine($Output)

    if ($env:GITHUB_EVENT_NAME -eq "pull_request")
    {
        Upsert-PullRequestComment -GitHubEvent $Token -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $Comments -Markdown "### $($Heading)`n$($Output)"
    }
}

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

If ($Extension -eq $null -or $Extension -eq "" -or $Extension -eq ".")
{
    [Console]::Error.WriteLine("File extension must be supplied")
    Exit 1
}

$RefName=$env:GITHUB_REF_NAME # will be in the format <pr_number>/merge
$Token=$env:GITHUB_TOKEN
If ($RefName -ne $null)
{
    $PullRequestNumber=$RefName.Replace("/merge", "")
}
else
{
    $PullRequestNumber = ""
}
$Repo = $env:GITHUB_REPOSITORY
if ($env:GITHUB_EVENT_NAME -eq "pull_request")
{
    $CommentsUrl = "https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    $ApproachingComments = Get-PullRequestComments -GitHubToken $Token -CommentsUrl $CommentsUrl -CommentHeading "*$($Extension) file/s approaching*"
    $ExceedingComments = Get-PullRequestComments -GitHubToken $Token -CommentsUrl $CommentsUrl -CommentHeading "*$($Extension) file/s exceeding*"
}
$MaxLines = [int]::MaxValue

If ($ErrorThreshold -gt 0)
{
    $FilesOverThreshold = [array] (Get-Files -MinLines $ErrorThreshold -MaxLines $MaxLines)
    If ($FilesOverThreshold.Length -gt 0)
    {
        Print-Files -Heading "$($FilesOverThreshold.Length) file/s exceeding limit" -Files $FilesOverThreshold -Comments $ExceedingComments
        [Console]::Error.WriteLine("There are $($FilesOverThreshold.Length) $($Extension) file/s that have more than $($ErrorThreshold) lines")
    }
    elseif ($env:GITHUB_EVENT_NAME -eq "pull_request")
    {
        Remove-ExistingComments -GitHubToken $Token -Comments $ExceedingComments
    }
}

If ($WarningThreshold -gt 0)
{
    If ($ErrorThreshold -le 0)
    {
        $Warning = "over $($WarningThreshold) line warning threshold"
        $FilesNearingLimit = [array] (Get-Files -MinLines $WarningThreshold -MaxLines $MaxLines)
    }
    else
    {
        $Warning = "approaching $($ErrorThreshold) line limit"
        $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines $ErrorThreshold
    }

    If ($FilesNearingLimit.Length -gt 0)
    {
        Print-Files -Heading "$($FilesNearingLimit.Length) $($Extension) file/s $($Warning)" -Files $FilesNearingLimit -Comments $ApproachingComments
    }
    elseif ($env:GITHUB_EVENT_NAME -eq "pull_request")
    {
        Remove-ExistingComments -GitHubToken $Token -Comments $ApproachingComments
    }
}

if ($ErrorThreshold -le 0 -and $WarningThreshold -le 0)
{
    [Console]::Error.WriteLine("Neither -ErrorThreshold nor -WarningThreshold are supplied; no constraints to apply to files")
}

Exit $FilesOverThreshold.Length
