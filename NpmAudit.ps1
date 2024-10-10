param([string] $NpmAuditBypassCveWarnings)
$AuditCommentHeading = "npm audit report"
$OutdatedCommentHeading = "npm outdated report"

Function Get-PullRequestComments($CommentHeading) 
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot add PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME)")
        $EmptyList = @()
        Return ,$EmptyList
    }

    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    Write-Message "Get pull-request comments"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Authorization="Bearer $($Token)";
        } `
        -Method Get `

    if ($Response.StatusCode -ne 200) 
    {
        $Response
        Write-Error "Error getting comment"
    }

    $Json = $Response | ConvertFrom-Json
    Return $Json `
        | Where-Object { $_.body -like "*$($CommentHeading)*" } `
}

Function Remove-ExistingComment($Comment)
{
    $CommentId = $Comment.id
    $Url = $Comment.url
    Write-Message "Deleting comment '$($CommentId)'"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($Token)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204) 
    {
        Write-Error "Error deleting comment at url $($Url)"
        $Response
    }
}

Function Remove-ExistingComments($Comments) 
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot remove existing PR comments; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME)")
        Return
    }

    Write-Message "Remove existing comments: $($Comments.Count)"
    $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ }
}

Function Write-Message($Message)
{
    [Console]::Out.WriteLine($Message)
}

Function Add-PullRequestComment($Markdown)
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot add PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME)")
        Return
    }

    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"
    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"

    Write-Message "Sending POST request to $($Url) with body $($Body)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($Token)";
        } `
        -Method Post `
        -Body $Body

    if ($Response.StatusCode -ne 201) 
    {
        Write-Error "Error creating comment at url $($Url)"
        $Response
    }
}

Function Run-NpmCommand([string] $Command)
{
    $processStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $processStartInfo.FileName = 'npm'
    $processStartInfo.Arguments = $Command
    $processStartInfo.RedirectStandardOutput = $true
    $processStartInfo.RedirectStandardError = $true
    $processStartInfo.UseShellExecute = $true
    $process = [System.Diagnostics.Process]::new()
    $process.StartInfo = $processStartInfo
    $success = $process.Start()
    $stdOut = $process.StandardOutput.ReadToEnd()
    $stdErr = $process.StandardError.ReadToEnd()
    $exitCode = $process.ExitCode

    return @{
        success = $success;
        output = $stdOut;
        error = $stdErr;
        exitCode = $exitCode;
    }
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
$AuditComments = Get-PullRequestComments $AuditCommentHeading
$OutdatedComments = Get-PullRequestComments $OutdatedCommentHeading
Remove-ExistingComments $AuditComments
Remove-ExistingComments $OutdatedComments

$NpmAuditResult = Run-NpmCommand -Command "audit"
Write-Output $NpmAuditResult.output
Write-Error $NpmAuditResult.error
If ($NpmAuditResult.ExitCode -ne 0)
{
    Add-PullRequestComment "#### $($AuditCommentHeading)`n`n$($NpmAuditResult.output)`n`n$($NpmAuditResult.error)"
}

$NpmOutdatedResult = Run-NpmCommand -Command "outdated"
Write-Output $NpmOutdatedResult.output
Write-Error $NpmOutdatedResult.error
If ($NpmOutdatedResult.ExitCode -ne 0)
{
    Add-PullRequestComment "#### $($OutdatedCommentHeading)`n`n$($NpmOutdatedResult.output)`n`n$($NpmOutdatedResult.error)"
}

If ($NpmAuditBypassCveWarnings -eq "true")
{
    Exit $NpmAuditResult.exitCode
}