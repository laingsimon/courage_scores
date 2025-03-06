param($CommentsUrl, [switch] $Force)

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

    Write-Message "Could not find $($Property) in comment body"
}

function Get-Logs($Url) 
{
    $ZipFile = "./logs.zip"
    $MaxAttempts = 5

    For ($Attempt = 1; $Attempt -lt $MaxAttempts; $Attempt++)
    {
        Try
        {
            Write-Message "[Attempt $($Attempt)] Getting logs $($Url)..."
            $Response = Invoke-WebRequest -Uri $Url -Method Get -Headers @{ Authorization="Bearer $($ReadLogsToken)" } -OutFile $ZipFile
            Write-Message "Retrieved logs from workflow run"
            Break
        }
        Catch
        {
            $Exception = $_.Exception
            if ($Attempt -eq $MaxAttempts)
            {
                ## rethrow the exception
                Throw $Exception
            }

            if ($Exception.Message -like "*not_found*" -or $Exception.Message -like "*404*")
            {
                Write-Message "Failed to get logs, waiting for a bit"
                ## maybe the run hasn't finished yet, give it some time
                Start-Sleep -Seconds 3
            }
        }
    }

    $ExtractPath = "./logs"
    $ZipFile | Expand-Archive -Destination $ExtractPath
    Write-Message "Extracted logs archive"

    Get-ChildItem -Path $ExtractPath -Filter "*.txt" | Write-Host

    $DotNetResults = Get-ChildItem -Path $ExtractPath -Filter "*build*with-dotnet.txt" | Get-DotNetFailures
    $JestResults = Get-ChildItem -Path $ExtractPath -Filter "*publish*with-dotnet.txt" | Get-JestFailures

    return $DotNetResults,$JestResults
}

function Get-DotNetFailures([Parameter(ValueFromPipeline)] $Path)
{
    return "## DotNet tests: $Path`n`n"
}

function Get-JestFailures([Parameter(ValueFromPipeline)] $Path)
{
    return "## React tests: $Path`n`n"
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
$AnalysisStatus = Get-CommentProperty -Comment $Comment -Property "AnalysisStatus"

if ($LogsUrl -eq "" -or $LogsUrl -eq $null)
{
    Write-Message "The created comment is not a trigger"
    return
}

if ($AnalysisStatus -ne "TODO" -and $Force -ne $true)
{
    Write-Message "Analysis already complete"
    return
}

$CommentsToAdd = Get-Logs -Url $LogsUrl

# replace the comment to show this is working...
$NewCommentText = "<!-- LogsUrl=$($LogsUrl) -->
<!-- PullRequestNumber=$($PullRequestNumber) -->
<!-- RefName=$($RefName) -->
<!-- GitHubJob=$($GitHubJob) -->
<!-- GitHubEvent=$($GitHubEvent) -->
<!-- GitHubRunId=$($GitHubRunId) -->
<!-- GitHubRunAttempt=$($GitHubRunAttempt) -->
<!-- AnalysisStatus=DONE -->

$($CommentsToAdd)"
$NewCommentContent = "#### $($TestsCommentHeading)`n$($NewCommentText)"
Update-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $Comments -Markdown $NewCommentContent
