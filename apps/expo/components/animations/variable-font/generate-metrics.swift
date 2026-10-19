import Foundation
import CoreText

let directory = URL(fileURLWithPath: #filePath).deletingLastPathComponent()
let arguments = Array(CommandLine.arguments.dropFirst())
let words = arguments.isEmpty ? ["EXPO", "VARIABLE FONTS"] : arguments
precondition(words.count == 2, "Pass two poster lines.")
let fontURL = directory.appendingPathComponent("assets/RobotoFlex.ttf")
let graphicsFont = CGFont(CGDataProvider(url: fontURL as CFURL)!)!
let font = CTFontCreateWithGraphicsFont(graphicsFont, 1000, nil, nil)
func tag(_ text: String) -> Int { text.utf8.reduce(0) { ($0 << 8) | Int($1) } }

let tables = words.map { word in
  let rows = [100, 400, 700, 1000].map { weight in
    let advances = [50, 100, 150].map { width in
      let variations = [tag("opsz"): 144, tag("wdth"): width, tag("wght"): weight]
      let descriptor = CTFontDescriptorCreateWithAttributes([kCTFontVariationAttribute: variations] as CFDictionary)
      let instance = CTFontCreateCopyWithAttributes(font, 1000, nil, descriptor)
      let text = NSAttributedString(string: word.replacingOccurrences(of: " ", with: "\u{00a0}") + "\u{00a0}", attributes: [
        NSAttributedString.Key(kCTFontAttributeName as String): instance,
        NSAttributedString.Key(kCTKernAttributeName as String): -45,
      ])
      let advance = CTLineGetTypographicBounds(CTLineCreateWithAttributedString(text), nil, nil, nil) / 1000
      return String(format: "%.6f", locale: Locale(identifier: "en_US_POSIX"), advance)
    }
    return "    [" + advances.joined(separator: ", ") + "]"
  }
  return "  [\n" + rows.joined(separator: ",\n") + ",\n  ]"
}
let wordsJSON = String(data: try JSONSerialization.data(withJSONObject: words), encoding: .utf8)!
let data = "export const WORDS = \(wordsJSON) as const;\n\n// Roboto Flex advances in em at opsz 144, including the space and letter spacing.\nconst ADVANCES = [\n" + tables.joined(separator: ",\n") + ",\n];\n\n"
let outputURL = directory.appendingPathComponent("word-metrics.ts")
let source = try String(contentsOf: outputURL, encoding: .utf8)
let start = source.range(of: "export const WORDS")!.lowerBound
let end = source.range(of: "export function getWordAdvance")!.lowerBound
try source.replacingCharacters(in: start..<end, with: data).write(to: outputURL, atomically: true, encoding: .utf8)
print("Updated word-metrics.ts for " + words.joined(separator: ", "))
