param([int] $ErrorThreshold, [int] $WarningThreshold)

Function Get-Files($MinLines, $MaxLines)
{
    # Write-Host "Finding files with > $($MinLines) lines and <= $($MaxLines)..."
    return Get-ChildItem -Recurse `
        | Where-Object { $_.Name.EndsWith(".cs") } `
        | Select-Object @{ label='name'; expression={$_.name} }, @{ label='lines'; expression={(Get-Content $_.FullName | Measure-Object -Line).Lines} } `
        | Where-Object { $_.lines -gt $MinLines -and $_lines -le $MaxLines } `
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
    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"
    # Write-Host "Get pull-request comments $($Url)"

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
    Write-Host "Deleting comment $($CommentId)"

    $Response = Invoke-WebRequest `
        -Uri $Url `
        -Headers @{
            Accept="application/vnd.github+json";
            Authorization="Bearer $($Token)";
        } `
        -Method Delete

    if ($Response.StatusCode -ne 204) 
    {
        $Response
        Write-Error "Error creating comment"
    }
}

Function Remove-ExistingComments() 
{
    # Write-Host "Remove existing comments: $($Comments.Count)"
    $Comments | ForEach-Object { Remove-ExistingComment -Comment $_ }
}

Function Add-PullRequestComment($Markdown)
{
    If ($env:GITHUB_EVENT_NAME -ne "pull_request") 
    {
        [Console]::Error.WriteLine("Cannot add PR comment; workflow isn't running from a pull-request - $($env:GITHUB_EVENT_NAME)")
        Return
    }

    Remove-ExistingComments

    $Body = "{""body"": ""$($Markdown.Replace("`n", "\n"))""}"
    $Url="https://api.github.com/repos/$($Repo)/issues/$($PullRequestNumber)/comments"

    # [Console]::Out.WriteLine("Sending POST request to $($Url) with body $($Body)")

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
        $Response
        Write-Error "Error creating comment"
    }
}

$RefName=$env:GITHUB_REF_NAME # will be in the format <pr_number>/merge
$Token=$env:GITHUB_TOKEN
$PullRequestNumber=$RefName.Replace("/merge", "")
$Repo = $env:GITHUB_REPOSITORY
$Comments = Get-PullRequestComments

$FilesOverThreshold = Get-Files -MinLines $ErrorThreshold -MaxLines [int]::MaxValue
If ($ErrorThreshold -gt 0 -and $FilesOverThreshold.Length -gt 0)
{
    Print-Files -Heading "Files exceeding limit" -Files $FilesOverThreshold
    [Console]::Error.WriteLine("There are $($FilesOverThreshold.Length) file/s that have more than $($ErrorThreshold) lines")
}

If ($ErrorThreshold -le 0 -or $ErrorThreshold -eq $null) 
{
    $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines [int]::MaxValue
}
else
{
    $FilesNearingLimit = Get-Files -MinLines $WarningThreshold -MaxLines $ErrorThreshold
}

If ($WarningThreshold -gt 0 -and $FilesNearingLimit.Length -gt 0)
{
    Print-Files -Heading "$($FilesNearingLimit.Length) file/s approaching limit" -Files $FilesNearingLimit
}

Exit $FilesOverThreshold.Length
