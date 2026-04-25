#!/usr/bin/env swift

import AppKit
import Foundation

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath, isDirectory: true)
let publicDir = root.appendingPathComponent("public", isDirectory: true)
let catURL = publicDir.appendingPathComponent("stitch-cat.png")

guard let catImage = NSImage(contentsOf: catURL) else {
  fatalError("Missing source image at \(catURL.path)")
}

extension NSColor {
  convenience init(hex: UInt32, alpha: CGFloat = 1) {
    self.init(
      calibratedRed: CGFloat((hex >> 16) & 0xff) / 255,
      green: CGFloat((hex >> 8) & 0xff) / 255,
      blue: CGFloat(hex & 0xff) / 255,
      alpha: alpha
    )
  }
}

func topRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat, canvasHeight: CGFloat) -> NSRect {
  NSRect(x: x, y: canvasHeight - y - height, width: width, height: height)
}

func drawText(
  _ text: String,
  in rect: NSRect,
  font: NSFont,
  color: NSColor,
  alignment: NSTextAlignment = .left,
  lineHeight: CGFloat? = nil
) {
  let paragraph = NSMutableParagraphStyle()
  paragraph.alignment = alignment
  if let lineHeight {
    paragraph.minimumLineHeight = lineHeight
    paragraph.maximumLineHeight = lineHeight
  }

  text.draw(
    with: rect,
    options: [.usesLineFragmentOrigin, .usesFontLeading],
    attributes: [
      .font: font,
      .foregroundColor: color,
      .paragraphStyle: paragraph,
    ]
  )
}

func fillRounded(_ rect: NSRect, radius: CGFloat, color: NSColor) {
  color.setFill()
  NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius).fill()
}

func strokeRounded(_ rect: NSRect, radius: CGFloat, color: NSColor, width: CGFloat) {
  let path = NSBezierPath(roundedRect: rect, xRadius: radius, yRadius: radius)
  path.lineWidth = width
  color.setStroke()
  path.stroke()
}

func savePNG(width: Int, height: Int, to url: URL, draw: (_ width: CGFloat, _ height: CGFloat) -> Void) throws {
  guard
    let rep = NSBitmapImageRep(
      bitmapDataPlanes: nil,
      pixelsWide: width,
      pixelsHigh: height,
      bitsPerSample: 8,
      samplesPerPixel: 4,
      hasAlpha: true,
      isPlanar: false,
      colorSpaceName: .deviceRGB,
      bitmapFormat: [],
      bytesPerRow: 0,
      bitsPerPixel: 0
    )
  else {
    fatalError("Could not create bitmap \(width)x\(height)")
  }

  rep.size = NSSize(width: width, height: height)
  guard let context = NSGraphicsContext(bitmapImageRep: rep) else {
    fatalError("Could not create graphics context")
  }

  NSGraphicsContext.saveGraphicsState()
  NSGraphicsContext.current = context
  context.cgContext.setShouldAntialias(true)
  context.cgContext.setAllowsAntialiasing(true)
  draw(CGFloat(width), CGFloat(height))
  NSGraphicsContext.restoreGraphicsState()

  guard let png = rep.representation(using: .png, properties: [:]) else {
    fatalError("Could not encode PNG \(url.path)")
  }
  try png.write(to: url)
}

func drawCat(in dest: NSRect, cornerRadius: CGFloat) {
  NSGraphicsContext.saveGraphicsState()
  NSBezierPath(roundedRect: dest, xRadius: cornerRadius, yRadius: cornerRadius).addClip()
  catImage.draw(
    in: dest,
    from: NSRect(x: 256, y: 0, width: 1024, height: 1024),
    operation: .sourceOver,
    fraction: 1
  )
  NSGraphicsContext.restoreGraphicsState()
}

func drawDotPattern(width: CGFloat, height: CGFloat) {
  NSColor(hex: 0xe9c46a, alpha: 0.22).setFill()
  for x in stride(from: CGFloat(32), through: width - 32, by: 44) {
    for y in stride(from: CGFloat(34), through: height - 34, by: 44) {
      NSBezierPath(ovalIn: NSRect(x: x, y: y, width: 3, height: 3)).fill()
    }
  }
}

func drawSocialPreview() throws {
  try savePNG(width: 1200, height: 630, to: publicDir.appendingPathComponent("og-image.png")) {
    width,
    height in
    NSColor(hex: 0xfcfbf9).setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    drawDotPattern(width: width, height: height)

    fillRounded(
      topRect(x: 690, y: 62, width: 390, height: 468, canvasHeight: height),
      radius: 64,
      color: NSColor(hex: 0xffd4dd, alpha: 0.42)
    )
    fillRounded(
      topRect(x: 640, y: 92, width: 490, height: 452, canvasHeight: height),
      radius: 48,
      color: NSColor(hex: 0xffffff, alpha: 0.9)
    )
    drawCat(in: topRect(x: 666, y: 116, width: 438, height: 404, canvasHeight: height), cornerRadius: 40)
    strokeRounded(
      topRect(x: 640, y: 92, width: 490, height: 452, canvasHeight: height),
      radius: 48,
      color: NSColor(hex: 0xf4a261, alpha: 0.28),
      width: 2
    )

    fillRounded(
      topRect(x: 80, y: 82, width: 186, height: 44, canvasHeight: height),
      radius: 22,
      color: NSColor(hex: 0xfff1dd)
    )
    drawText(
      "meow.dee.moe",
      in: topRect(x: 102, y: 92, width: 160, height: 28, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 20, weight: .bold),
      color: NSColor(hex: 0x6f3800)
    )

    drawText(
      "喵在说啥",
      in: topRect(x: 78, y: 158, width: 520, height: 110, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 82, weight: .heavy),
      color: NSColor(hex: 0x264653),
      lineHeight: 92
    )
    drawText(
      "人话 ⇄ 猫语，可逆翻译器",
      in: topRect(x: 84, y: 282, width: 520, height: 48, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 34, weight: .semibold),
      color: NSColor(hex: 0x2a6f60),
      lineHeight: 42
    )

    let samplePanel = topRect(x: 82, y: 384, width: 510, height: 112, canvasHeight: height)
    fillRounded(samplePanel, radius: 28, color: NSColor(hex: 0xffffff, alpha: 0.92))
    strokeRounded(samplePanel, radius: 28, color: NSColor(hex: 0xe9c46a, alpha: 0.36), width: 2)
    drawText(
      "把一句话变成可复制、可分享、可还原的猫语。",
      in: topRect(x: 112, y: 410, width: 456, height: 34, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 24, weight: .semibold),
      color: NSColor(hex: 0x264653),
      lineHeight: 30
    )
    drawText(
      "喵 嗷 呜 叭 呼 咕...",
      in: topRect(x: 112, y: 456, width: 456, height: 30, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 22, weight: .bold),
      color: NSColor(hex: 0xf26d7d),
      lineHeight: 28
    )

    drawText(
      "nya128-zh9",
      in: topRect(x: 84, y: 546, width: 180, height: 26, canvasHeight: height),
      font: NSFont.monospacedSystemFont(ofSize: 18, weight: .semibold),
      color: NSColor(hex: 0x264653, alpha: 0.58)
    )
    drawText(
      "open the translator",
      in: topRect(x: 328, y: 546, width: 260, height: 26, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 18, weight: .semibold),
      color: NSColor(hex: 0x264653, alpha: 0.5),
      alignment: .right
    )
  }
}

func drawAppIcon(size: Int, filename: String) throws {
  try savePNG(width: size, height: size, to: publicDir.appendingPathComponent(filename)) { width, height in
    NSColor(hex: 0xfcfbf9).setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    drawCat(in: NSRect(x: width * 0.11, y: height * 0.14, width: width * 0.78, height: height * 0.72), cornerRadius: width * 0.18)
    strokeRounded(
      NSRect(x: width * 0.08, y: height * 0.08, width: width * 0.84, height: height * 0.84),
      radius: width * 0.22,
      color: NSColor(hex: 0xf4a261, alpha: 0.42),
      width: max(2, width * 0.012)
    )
  }
}

func writeTextAssets() throws {
  let favicon = """
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <rect width="64" height="64" rx="16" fill="#fcfbf9"/>
    <circle cx="20" cy="26" r="6" fill="#f4a261"/>
    <circle cx="32" cy="19" r="6" fill="#f4a261"/>
    <circle cx="44" cy="26" r="6" fill="#f4a261"/>
    <path d="M19 43c0-8 7-13 13-13s13 5 13 13c0 5-4 8-8 8-2 0-3-1-5-1s-3 1-5 1c-4 0-8-3-8-8Z" fill="#264653"/>
    <path d="M11 53h42" stroke="#e9c46a" stroke-width="4" stroke-linecap="round"/>
  </svg>
  """
  try favicon.write(to: publicDir.appendingPathComponent("favicon.svg"), atomically: true, encoding: .utf8)

  let manifest = """
  {
    "name": "喵在说啥",
    "short_name": "喵在说啥",
    "description": "把人话变成可复制、可还原的猫语，也能一键翻回来。",
    "start_url": "/",
    "display": "standalone",
    "background_color": "#fcfbf9",
    "theme_color": "#f4a261",
    "icons": [
      {
        "src": "/web-app-icon-192.png",
        "sizes": "192x192",
        "type": "image/png"
      },
      {
        "src": "/web-app-icon-512.png",
        "sizes": "512x512",
        "type": "image/png"
      }
    ]
  }
  """
  try manifest.write(to: publicDir.appendingPathComponent("site.webmanifest"), atomically: true, encoding: .utf8)
}

try drawSocialPreview()
try drawAppIcon(size: 180, filename: "apple-touch-icon.png")
try drawAppIcon(size: 192, filename: "web-app-icon-192.png")
try drawAppIcon(size: 512, filename: "web-app-icon-512.png")
try writeTextAssets()

print("Generated social preview assets in \(publicDir.path)")
