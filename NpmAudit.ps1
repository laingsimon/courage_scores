param()
$AuditCommentHeading = "npm audit report"
$OutdatedCommentHeading = "npm outdated report"
$BypassNpmAuditViaCommentCommentContent = "bypass npm audit"
$GitHubMarkdownCodeBlock="``````"

Function Get-PullRequestComments($CommentHeading, [switch] $ExactMatch) 
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot add PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME)")
        $EmptyList = @()
        Return ,$EmptyList
    }

    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    Write-Message "Get pull-request comments - $($CommentHeading)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($Token)";
        }

    if ($Response.StatusCode -ne 200) 
    {
        $Response
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

    If ($Comments.Count -gt 0)
    {
        Write-Message "Remove existing comments: $($Comments.Count)"
        $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ }
    }
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
    $currentDirectory = (Get-Item .).FullName

    $processStartInfo = [System.Diagnostics.ProcessStartInfo]::new()
    $processStartInfo.WorkingDirectory = $currentDirectory
    $processStartInfo.CreateNoWindow = $true
    $processStartInfo.FileName = $PathToNpm
    $processStartInfo.Arguments = $Command
    $processStartInfo.RedirectStandardOutput = $true
    $processStartInfo.RedirectStandardError = $true
    $processStartInfo.UseShellExecute = $false
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
        workingDirectory = $processStartInfo.WorkingDirectory
        path = $processStartInfo.FileName
    }
}

Function Get-PathToNpm()
{
    $npm = Get-Command "npm"
    # Write-Message "Found npm command at $($npm.Path)"
    return $npm.Path
}

Function Format-NpmOutdatedContent($output, $error)
{
    $Formatted = "$($error)`n"
    $Formatted = "$($Formatted)|Package|Current|Wanted|Latest|Location|DependedBy|`n"
    $Formatted = "$($Formatted)|----|----|----|----|----|----|`n"

    $output -split "`n" | ForEach-Object {
        $line = $_
        if ($line -ne "")
        {
            # replace windows drive letter prefixes to allow a split on :
            $line = $line.Replace("C:\", "/c/")

            $parts = $line -split ":"
            $package=[System.IO.Path]::GetFileName($parts[0])
            $wanted=$parts[1].Split("@")[1]
            $current=$parts[2].Split("@")[1]
            $latest=$parts[3].Split("@")[1]
            $location=$parts[0].Substring([System.Math]::Max($parts[0].IndexOf("node_modules"), 0)).Replace("\", "/")
            $dependedBy=$parts[4]

            $FormattedLine = "|$($package)|$($current)|$($wanted)|$($latest)|$($location)|$($dependedBy)|"
            $Formatted = "$($Formatted)$($FormattedLine)`n"
        }
    }

    Return $Formatted
}

$PathToNpm = Get-PathToNpm
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
$AuditComments = [array] (Get-PullRequestComments $AuditCommentHeading)
$BypassNpmAuditViaCommentComments = [array] (Get-PullRequestComments $BypassNpmAuditViaCommentCommentContent -ExactMatch)
Remove-ExistingComments -Comments $AuditComments
$OutdatedComments = [array] (Get-PullRequestComments $OutdatedCommentHeading)
Remove-ExistingComments -Comments $OutdatedComments

$NpmAuditResult = Run-NpmCommand -Command "audit"
If ($NpmAuditResult.output -ne "")
{
    Write-Output $NpmAuditResult.output
}
If ($NpmAuditResult.error -ne "")
{
    Write-Error $NpmAuditResult.error
}
If ($NpmAuditResult.ExitCode -ne 0)
{
    $BypassInstruction="Add comment to this PR with the content **$($BypassNpmAuditViaCommentCommentContent)** to bypass these vulnerabilities when the workflow runs next"
    if ($BypassNpmAuditViaCommentComments.Length -gt 0)
    {
        $BypassInstruction="A comment exists with the wording **$($BypassNpmAuditViaCommentCommentContent)**; warnings are ignored for this PR"
    }

    Add-PullRequestComment "#### $($AuditCommentHeading)`n`n$($GitHubMarkdownCodeBlock)`n$($NpmAuditResult.output)`n$($NpmAuditResult.error)`n$($GitHubMarkdownCodeBlock)`n$($BypassInstruction)"
}

$NpmOutdatedResult = Run-NpmCommand -Command "outdated --parseable"
If ($NpmOutdatedResult.ExitCode -ne 0)
{
    Add-PullRequestComment "#### $($OutdatedCommentHeading)`n$(Format-NpmOutdatedContent -output $NpmOutdatedResult.output -error $NpmOutdatedResult.error)"
}

If ($NpmAuditResult.ExitCode -ne 0 -and $BypassNpmAuditViaCommentComments.Length -gt 0)
{
    Write-Message "npm audit warnings have been bypassed by request"
    Exit 0
}

Exit $NpmAuditResult.exitCode