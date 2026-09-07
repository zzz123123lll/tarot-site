Add-Type -AssemblyName System.Drawing
New-Item -ItemType Directory -Force -Path "icons" | Out-Null

function New-ToolIcon($size, $padding, $path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.Clear([System.Drawing.Color]::Transparent)

  $r = New-Object System.Drawing.Rectangle(0, 0, $size, $size)
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush($r, [System.Drawing.Color]::FromArgb(255,79,149,234), [System.Drawing.Color]::FromArgb(255,14,63,125), 45)
  $path0 = New-Object System.Drawing.Drawing2D.GraphicsPath
  $rad = [int]($size * 0.225)
  $path0.AddArc(0, 0, $rad*2, $rad*2, 180, 90)
  $path0.AddArc($size-$rad*2, 0, $rad*2, $rad*2, 270, 90)
  $path0.AddArc($size-$rad*2, $size-$rad*2, $rad*2, $rad*2, 0, 90)
  $path0.AddArc(0, $size-$rad*2, $rad*2, $rad*2, 90, 90)
  $path0.CloseFigure()
  $g.FillPath($brush, $path0)

  $glow = New-Object System.Drawing.Drawing2D.LinearGradientBrush($r, [System.Drawing.Color]::FromArgb(46,255,255,255), [System.Drawing.Color]::FromArgb(0,255,255,255), 90)
  $g.SetClip($path0)
  $g.FillRectangle($glow, 0, 0, $size, [int]($size*0.55))
  $g.ResetClip()

  $w = [System.Drawing.Color]::FromArgb(255,255,255,255)
  $pen = New-Object System.Drawing.Pen($w, [int]($size * 0.055))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $u = $size - 2*$padding
  $cx = $size/2; $cy = [int]($padding + $u*0.30)
  $hr = [int]($u*0.20)
  $g.DrawArc($pen, $cx-$hr, $cy-$hr, $hr*2, $hr*2, 200, 140)
  $bx = [int]($padding + $u*0.14); $by = [int]($padding + $u*0.34)
  $bw = [int]($u*0.72); $bh = [int]($u*0.44)
  $body = New-Object System.Drawing.Drawing2D.GraphicsPath
  $brd = [int]($bw*0.12)
  $body.AddArc($bx, $by, $brd*2, $brd*2, 180, 90)
  $body.AddArc($bx+$bw-$brd*2, $by, $brd*2, $brd*2, 270, 90)
  $body.AddArc($bx+$bw-$brd*2, $by+$bh-$brd*2, $brd*2, $brd*2, 0, 90)
  $body.AddArc($bx, $by+$bh-$brd*2, $brd*2, $brd*2, 90, 90)
  $body.CloseFigure()
  $g.FillPath((New-Object System.Drawing.SolidBrush($w)), $body)
  $g.DrawLine($pen, $cx, [int]($by+$bh*0.08), $cx, [int]($by+$bh*0.92))

  $out = Join-Path (Get-Location).Path $path
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
  Write-Output ($path + " = " + (Get-Item $out).Length + " bytes")
}
New-ToolIcon 192 10 "icons\icon-192.png"
New-ToolIcon 512 26 "icons\icon-512.png"
New-ToolIcon 512 82 "icons\icon-maskable-512.png"
