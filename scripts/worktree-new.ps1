<#
.SYNOPSIS
    Creates a new git worktree with branch and links node_modules automatically.
.EXAMPLE
    .\scripts\worktree-new.ps1 -Branch "perf/my-feature" -Path "..\my-worktree"
#>
param(
    [Parameter(Mandatory=$true)]
    [string]$Branch,
    [Parameter(Mandatory=$false)]
    [string]$Path,
    [Parameter(Mandatory=$false)]
    [ValidateSet(1, 2, 3)]
    [int]$Slot,
    [string]$Base = "HEAD"
)

$ErrorActionPreference = "Stop"

# Pre-flight check: ensure at least 1.5 GB of free disk space before checkout
$drive = (Get-Item (Get-Location)).PSDrive
if ($drive -and $drive.Free -lt 1.5GB) {
    $freeMb = [math]::Round($drive.Free / 1MB, 2)
    throw "Pre-flight failed: Insufficient disk space on drive $($drive.Name): ($freeMb MB free). At least 1.5 GB required to create a new worktree safely."
}

if (-not $Path) {
    if ($Slot) {
        $Path = "..\icofr$Slot"
    } else {
        throw "Either -Path or -Slot (1, 2, or 3) must be provided."
    }
}

Write-Host "Creating git worktree at $Path on branch $Branch from $Base..." -ForegroundColor Cyan
git worktree add -b $Branch $Path $Base

$rootNodeModules = Join-Path (Get-Location) "node_modules"
$targetNodeModules = Join-Path $Path "node_modules"

if (Test-Path $rootNodeModules) {
    Write-Host "Linking node_modules junction to $targetNodeModules..." -ForegroundColor Cyan
    cmd /c mklink /J "$targetNodeModules" "$rootNodeModules"
}

Write-Host "Worktree ready at $Path" -ForegroundColor Green
