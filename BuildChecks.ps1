param([int] $ErrorThreshold, [int] $WarningThreshold, [string] $Extension)

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

Function Print-Files($Heading, $Files) 
{
    $Output=""
    $Output += "| File | Lines |`n"
    $Output += "| --- | --- |`n"

    $Files | ForEach-Object { $Output += "$($_.row)`n" }

    [Console]::Error.WriteLine($Heading)
    [Console]::Error.WriteLine($Output)

    Add-PullRequestComment -Markdown "### $($Heading)`n$($Output)"
}

Function Get-PullRequestComments() 
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
        -Method Get `

    if ($Response.StatusCode -ne 200) 
    {
        $Response
        Write-Error "Error getting comment"
    }

    $Json = $Response | ConvertFrom-Json
    Return $Json `
        | Where-Object { $_.body -like "*file/s approaching limit*" -Or $_.body.Value -like "*Files exceeding limit*" } `
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

Function Remove-ExistingComments() 
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
$Comments = Get-PullRequestComments
$MaxLines = [int]::MaxValue
Remove-ExistingComments

If ($ErrorThreshold -gt 0)
{
    $FilesOverThreshold = Get-Files -MinLines $ErrorThreshold -MaxLines $MaxLines
    If ($FilesOverThreshold.Length -gt 0)
    {
        Print-Files -Heading "$($FilesOverThreshold.Length) file/s exceeding limit" -Files $FilesOverThreshold
        [Console]::Error.WriteLine("There are $($FilesOverThreshold.Length) file/s that have more than $($ErrorThreshold) lines")
    }
}

If ($WarningThreshold -gt 0)
{
    If ($ErrorThreshold -le 0)
    {
        $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines $MaxLines
    }
    else
    {
        $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines $ErrorThreshold
    }

    If ($FilesNearingLimit.Length -gt 0)
    {
        Print-Files -Heading "$($FilesNearingLimit.Length) file/s approaching line $($WarningThreshold) limit" -Files $FilesNearingLimit
    }
}

if ($ErrorThreshold -le 0 -and $WarningThreshold -le 0)
{
    [Console]::Error.WriteLine("Neither -ErrorThreshold nor -WarningThreshold are supplied; no constraints to apply to files")
}

Exit $FilesOverThreshold.Length
