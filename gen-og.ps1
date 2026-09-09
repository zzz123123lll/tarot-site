Add-Type -AssemblyName System.Drawing
$w = 1200; $h = 630
$bmp = New-Object System.Drawing.Bitmap($w, $h)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$rect = New-Object System.Drawing.Rectangle(0, 0, $w, $h)
$brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(255,79,149,234), [System.Drawing.Color]::FromArgb(255,14,63,125), 45)
$g.FillRectangle($brush, $rect)
$glow = New-Object System.Drawing.Drawing2D.LinearGradientBrush($rect, [System.Drawing.Color]::FromArgb(46,255,255,255), [System.Drawing.Color]::FromArgb(0,255,255,255), 90)
$g.FillRectangle($glow, 0, 0, $w, [int]($h*0.5))
$f1 = New-Object System.Drawing.Font("Microsoft YaHei", 104, [System.Drawing.FontStyle]::Bold)
$f2 = New-Object System.Drawing.Font("Microsoft YaHei", 32)
$f3 = New-Object System.Drawing.Font("Microsoft YaHei", 26)
$sf = New-Object System.Drawing.StringFormat
$sf.Alignment = [System.Drawing.StringAlignment]::Center
$g.DrawString("工具盒", $f1, [System.Drawing.Brushes]::White, (New-Object System.Drawing.RectangleF(0, 150, $w, 150)), $sf)
$g.DrawString("把好用的工具，收进一个盒子里", $f2, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(225,255,255,255))), (New-Object System.Drawing.RectangleF(0, 320, $w, 60)), $sf)
$g.DrawString("图片 · PDF · 开发小工具 · 塔罗占卜", $f3, (New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(180,255,255,255))), (New-Object System.Drawing.RectangleF(0, 400, $w, 50)), $sf)
$out = Join-Path (Get-Location).Path "og.png"
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output ("og.png = " + (Get-Item $out).Length + " bytes")
