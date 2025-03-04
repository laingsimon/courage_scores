param($CommentsUrl)

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

Function Get-PullRequestComments($CommentHeading, [switch] $ExactMatch) 
{
    If ($env:GITHUB_EVENT_NAME -ne "issue_comment")
    {
        $EmptyList = @()
        Return ,$EmptyList
    }

    Write-Message "Get pull-request comments - $($CommentHeading)"

    $Response = Invoke-WebRequest `
        -Uri $CommentsUrl `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GithubToken)";
        }

    if ($Response.StatusCode -ne 200)
    {
        Write-Error "Error getting comment"
    }

    $Json = $Response | ConvertFrom-Json
    if ($ExactMatch)
    {
        Return $Json `
        | Where-Object { $_.body -eq $CommentHeading } `
    }

    Return $Json `
        | Where-Object { $_.body -like "*$($CommentHeading)*" } `
}

Function Remove-ExistingComment($Comment)
{
    $CommentId = $Comment.id
    $Url = $Comment.url

    if ($CommentId -eq "" -or $CommentId -eq $null)
    {
        Write-Error "Cannot delete comment, no id: $($Comment)"
        Return
    }

    Write-Message "Deleting comment '$($CommentId)'"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GithubToken)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204) 
    {
        Write-Error "Error deleting comment at url $($Url)"
    }
}

Function Remove-ExistingComments($Comments) 
{
    If ($env:GITHUB_EVENT_NAME -ne "issue_comment")
    {
        Return
    }

    If ($Comments.Count -gt 0)
    {
        Write-Message "Remove existing comments: $($Comments.Count)"
        $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ }
    }
}

Function Add-PullRequestComment($Markdown)
{
    If ($env:GITHUB_EVENT_NAME -ne "issue_comment")
    {
        [Console]::Error.WriteLine("Cannot add PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME) / $($PullRequestNumber)`n`n$($Markdown)")
        Return
    }

    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"

    # Write-Message "Sending POST request to $($Url) with body $($Body)"

    $Response = Invoke-WebRequest `
        -Uri $CommentsUrl `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($GithubToken)";
        } `
        -Method Post `
        -Body $Body

    if ($Response.StatusCode -ne 201) 
    {
        Write-Error "Error creating comment at url $($Url)"
    }
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
$GithubToken=$env:GITHUB_TOKEN
$ReadLogsToken=$env:READ_LOGS_TOKEN
$TestsCommentHeading = "Test results"

$Comments = [array] (Get-PullRequestComments $TestsCommentHeading)
$Comment = $Comments[0]
if ($Comment -eq $null)
{
    Write-Message "Unable to find comment via $($CommentsUrl)"
    return
}

Write-Message "Found comment: $($Comment.id)"
$GitHubJob = Get-CommentProperty -Comment $Comment -Property "GitHubJob"
$GitHubRunAttempt = Get-CommentProperty -Comment $Comment -Property "GitHubRunAttempt"
$GitHubRunId = Get-CommentProperty -Comment $Comment -Property "GitHubRunId"
# $GitHubRunNumber = Get-CommentProperty -Comment $Comment -Property "GitHubRunNumber"
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
Remove-ExistingComments $Comments
Add-PullRequestComment $NewCommentContent
