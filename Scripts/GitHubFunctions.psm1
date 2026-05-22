Import-Module -Name "$PSScriptRoot/PrivateGitHubFunctions.psm1" -Force

Function Get-PullRequestComments($GitHubToken, $CommentsUrl, $CommentHeading, [switch] $ExactMatch) 
{
    Write-Host "Get pull-request comments - $($CommentHeading) via $($CommentsUrl)"

    $Response = Invoke-WebRequest `
        -Uri $CommentsUrl `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GitHubToken)";
        }

    if ($Response.StatusCode -ne 200)
    {
        Write-Error "Error getting comments"
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

Function Get-PullRequests($GitHubToken, $Repo, $Base)
{
    # find all pull requests that are targeting the $Base
    Write-Host "Getting pull requests into $($Base)..."

    $Response = $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/pulls?state=open&base=$($Base)" `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GitHubToken)";
        }

    return $Response | ConvertFrom-Json | Select-Object @{ label='url'; expression={$_.url}}, @{ label='title'; expression={$_.title}}, @{ label='number'; expression={$_.number}}
}

Function Clear-ExistingComments($GitHubToken, $Comments) 
{
    If ($Comments.Count -gt 0)
    {
        Write-Host "Remove existing comments: $($Comments.Count)"
        $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ -GitHubToken $GitHubToken }
    }
}

Function Get-PullRequestReviewComments($GitHubToken, $Repo, $PullRequestNumber, $CommitId, $Path, $Side, $SubjectType)
{
    # comments should be returned with an `id` and a `body`

    Write-Host "Get pull-request review comments for #$($PullRequestNumber)"

    $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/pulls/$($PullRequestNumber)/comments" `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GitHubToken)";
        }

    if ($Response.StatusCode -ne 200)
    {
        Write-Error "Error getting pull request review comments from #$($PullRequestNumber)"
    }

    $Json = $Response | ConvertFrom-Json
    return $Json
}

Function Clear-PullRequestReviewComments($GitHubToken, $Repo, $PullRequestNumber, $Comments)
{
    $Comments | ForEach-Object { Remove-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -CommentId $_.id }
}

Function Set-PullRequestReviewComment($GitHubToken, $Repo, $PullRequestNumber, $Body, $CommitId, $Path, $Side, $SubjectType)
{
    $Marker = "<!-- BuildChecksCommit -->"
    $AllExistingComments = Get-PullRequestReviewComments -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -CommitId $CommitId -Path $Path -Side $Side -SubjectType $SubjectType
    $ExistingComments = $AllExistingComments | Where-Object { $_.body -like "*$($Marker)*" }
    if ($ExistingComments.Length -eq 1) 
    {
        ## update the comment
        $ExistingComment = $ExistingComments[0]
        Update-PullRequestReviewComment -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -CommentId $ExistingComment.id -Body "$($Marker)$($Body)"
        return
    }

    if ($ExistingComments.Length -gt 1)
    {
        ## remove the comments
        Clear-PullRequestReviewComments -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -Comments $ExistingComments
    }

    ## add the comment (prepend the marker)
    Add-PullRequestReviewComment -GitHubToken $GitHubToken -Repo $Repo -PullRequestNumber $PullRequestNumber -CommitId $CommitId -Path $Path -Side $Side -SubjectType $SubjectType -Body "$($Marker)$($Body)"
}

Function Set-PullRequestComment($GitHubToken, $Repo, $PullRequestNumber, $Comments, $Markdown)
{
    if ($Comments -ne $null -and $Comments.Length -eq 1)
    {
        $Comment = $Comments[0]
        Set-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -Comment $Comment -Markdown $Markdown
        return
    }

    if ($Comments -ne $null)
    { 
        Clear-ExistingComments -GitHubToken $GitHubToken -Comments $Comments
    }
    Add-PullRequestComment -GitHubToken $GitHubToken -Repo $Repo -Markdown $Markdown -PullRequestNumber $PullRequestNumber
}

Function Get-JobId($GitHubToken, $Repo, $RunId, $Attempt, $Name)
{
    Write-Host "Get jobs for run $($RunId)/$($Attempt)..."

    $Response = Invoke-WebRequest `
        -Uri "https://api.github.com/repos/$($Repo)/actions/runs/$($RunId)/attempts/$($Attempt)/jobs" `
        -Method Get `
        -Headers @{
            Authorization="Bearer $($GitHubToken)";
        }

    $Jobs = ($Response | ConvertFrom-Json).jobs
    $Job = $Jobs | Where-Object { $_.name -eq $Name }

    if ($Job -ne $null)
    {
        return $Job.id
    }

    Write-Host -ForegroundColor Red "Unable to find jobid for workflow $($Name) in list of jobs, names are: '$($Jobs.name -join "', '")'"
    return $null
}