# Resize-AppIcon.ps1
# This script resizes the Ummy logo into all required Android mipmap buckets.

param (
    [string]$SourcePath = "public/images/ummy-logon.png",
    [string]$ResPath = "android/app/src/main/res"
)

# Load GDI+
[Reflection.Assembly]::LoadWithPartialName("System.Drawing") | Out-Null

function Resize-Image {
    param (
        [System.Drawing.Image]$Image,
        [int]$Width,
        [int]$Height,
        [string]$OutputPath,
        [float]$ScaleFactor = 1.0  # Used to scale the logo inside the canvas for adaptive icons
    )

    $canvas = New-Object System.Drawing.Bitmap($Width, $Height)
    $graphics = [System.Drawing.Graphics]::FromImage($canvas)
    
    # High Quality settings
    $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality

    $drawWidth = $Width * $ScaleFactor
    $drawHeight = $Height * $ScaleFactor
    $posX = ($Width - $drawWidth) / 2
    $posY = ($Height - $drawHeight) / 2

    $graphics.Clear([System.Drawing.Color]::Transparent)
    $graphics.DrawImage($Image, $posX, $posY, $drawWidth, $drawHeight)
    
    $canvas.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $canvas.Dispose()
}

$img = New-Object System.Drawing.Bitmap($SourcePath)

# Densities and sizes (Launcher / Adaptive)
# mdpi=48/108, hdpi=72/162, xhdpi=96/216, xxhdpi=144/324, xxxhdpi=192/432
$buckets = @(
    @{ name="mdpi";    launcher=48;  adaptive=108 },
    @{ name="hdpi";    launcher=72;  adaptive=162 },
    @{ name="xhdpi";   launcher=96;  adaptive=216 },
    @{ name="xxhdpi";  launcher=144; adaptive=324 },
    @{ name="xxxhdpi"; launcher=192; adaptive=432 }
)

foreach ($b in $buckets) {
    $dir = Join-Path $ResPath ("mipmap-" + $b.name)
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

    Write-Host "Generating icons for $($b.name)..."

    # Legacy Score/Launcher (Full coverage)
    Resize-Image $img $b.launcher $b.launcher (Join-Path $dir "ic_launcher.png") 1.0
    Resize-Image $img $b.launcher $b.launcher (Join-Path $dir "ic_launcher_round.png") 1.0

    # Adaptive Foreground (Scaled to 66% to avoid clipping by masks)
    Resize-Image $img $b.adaptive $b.adaptive (Join-Path $dir "ic_launcher_foreground.png") 0.66
}

$img.Dispose()
Write-Host "Success! All icons generated from $SourcePath"
