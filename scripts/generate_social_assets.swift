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
  try savePNG(width: 1200, height: 630, to: publicDir.appendingPathComponent("og-image-v2.png")) {
    width,
    height in
    NSColor(hex: 0xfcfbf9).setFill()
    NSRect(x: 0, y: 0, width: width, height: height).fill()
    drawDotPattern(width: width, height: height)

    fillRounded(
      topRect(x: 628, y: 44, width: 486, height: 522, canvasHeight: height),
      radius: 76,
      color: NSColor(hex: 0xffd4dd, alpha: 0.46)
    )
    fillRounded(
      topRect(x: 592, y: 70, width: 548, height: 488, canvasHeight: height),
      radius: 58,
      color: NSColor(hex: 0xffffff, alpha: 0.9)
    )
    drawCat(in: topRect(x: 614, y: 88, width: 508, height: 452, canvasHeight: height), cornerRadius: 50)
    strokeRounded(
      topRect(x: 592, y: 70, width: 548, height: 488, canvasHeight: height),
      radius: 58,
      color: NSColor(hex: 0xf4a261, alpha: 0.25),
      width: 3
    )

    drawText(
      "喵在说啥",
      in: topRect(x: 72, y: 132, width: 520, height: 142, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 116, weight: .heavy),
      color: NSColor(hex: 0x264653),
      lineHeight: 128
    )
    drawText(
      "可逆猫语翻译器",
      in: topRect(x: 82, y: 302, width: 500, height: 70, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 54, weight: .bold),
      color: NSColor(hex: 0x2a6f60),
      lineHeight: 62
    )

    let directionPill = topRect(x: 84, y: 428, width: 394, height: 78, canvasHeight: height)
    fillRounded(directionPill, radius: 39, color: NSColor(hex: 0xfff1dd))
    strokeRounded(directionPill, radius: 39, color: NSColor(hex: 0xe9c46a, alpha: 0.45), width: 2)
    drawText(
      "人话 ⇄ 猫语",
      in: topRect(x: 118, y: 445, width: 326, height: 44, canvasHeight: height),
      font: NSFont.systemFont(ofSize: 38, weight: .heavy),
      color: NSColor(hex: 0x6f3800),
      alignment: .center,
      lineHeight: 44
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
