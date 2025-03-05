param($CommentsUrl)

Import-Module -Name "$PSScriptRoot/GitHubFunctions.psm1"

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

function Get-CommentProperty($Comment, $Property)
{
    $body = $Comment.body

    $match = [System.Text.RegularExpressions.Regex]::Match($body, "\<!-- $($Property)=(.+?) --\>")
    if ($Match.Success)
    {
        return $match.Groups[1].Value
    }

    Write-Message "Could not find $($Property) in comment body $($body)"
}

function Get-Logs($Url) 
{
    Write-Message "Getting logs $($Url)..."
    $ZipFile = "./logs.zip"

    $Response = Invoke-WebRequest -Uri $Url -Method Get -Headers @{ Authorization="Bearer $($ReadLogsToken)" } -OutFile $ZipFile

    $ExtractPath = "./logs"
    $ZipFile | Expand-Archive -Destination $ExtractPath

    Write-Message "Retrieved logs from workflow run"
}

$Repo = $env:GITHUB_REPOSITORY
$GitHubToken=$env:GITHUB_TOKEN
$ReadLogsToken=$env:READ_LOGS_TOKEN
$TestsCommentHeading = "Test results"

$Comments = [array] (Get-PullRequestComments -GitHubToken $GitHubToken -CommentsUrl $CommentsUrl -CommentHeading $TestsCommentHeading)
if ($Comments -eq $null -or $Comments.Count -eq 0 -or $Comments[0] -eq $null)
{
    Write-Message "No matching comments via $($CommentsUrl)"
    return
}

$Comment = $Comments[0]
Write-Message "Found comment: $($Comment.id)"
$GitHubJob = Get-CommentProperty -Comment $Comment -Property "GitHubJob"
$GitHubRunAttempt = Get-CommentProperty -Comment $Comment -Property "GitHubRunAttempt"
$GitHubRunId = Get-CommentProperty -Comment $Comment -Property "GitHubRunId"
$GitHubEvent = Get-CommentProperty -Comment $Comment -Property "GitHubEvent"
$PullRequestNumber = Get-CommentProperty -Comment $Comment -Property "PullRequestNumber"
$RefName = Get-CommentProperty -Comment $Comment -Property "RefName"
$LogsUrl = Get-CommentProperty -Comment $Comment -Property "LogsUrl"

if ($LogsUrl -eq "" -or $LogsUrl -eq $null)
{
    Write-Message "The created comment is not a trigger"
    return
}

Get-Logs -Url $LogsUrl

# replace the comment to show this is working...
$NewCommentText = "🫤 Now to process the test results for $($PullRequestNumber) from $($LogsUrl)"
$NewCommentContent = "#### $($TestsCommentHeading)`n$($NewCommentText)"
Update-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $Comments -Markdown $NewCommentContent
