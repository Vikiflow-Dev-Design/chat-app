/**
 * File optimization utility
 * Optimizes files to reduce size before storage
 */
const fs = require("fs");
const path = require("path");
const mammoth = require("mammoth");
const util = require("util");
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

/**
 * Main function to optimize any file type
 * @param {string} filePath - Path to the original file
 * @returns {Promise<{path: string, originalSize: number, optimizedSize: number, reductionPercent: number}>} - Optimization results
 */
async function optimizeFile(filePath) {
  try {
    const fileExt = path.extname(filePath).toLowerCase();
    const fileName = path.basename(filePath, fileExt);
    const dirName = path.dirname(filePath);
    const optimizedPath = path.join(dirName, `${fileName}-optimized${fileExt}`);

    // Get original file size
    const originalStats = fs.statSync(filePath);
    const originalSize = originalStats.size;

    // Optimize based on file type
    let extractedText = null;
    switch (fileExt) {
      case ".pdf":
        // For PDFs, we'll use a text-only approach for maximum optimization
        try {
          // Create a text file with the same name but .txt extension
          const textFilePath = path.join(dirName, `${fileName}-text.txt`);

          // Extract text from the original PDF
          const pdfBytes = await readFile(filePath);
          const pdfParse = require("pdf-parse");
          const data = await pdfParse(pdfBytes);
          extractedText = data.text || "";

          // Apply our aggressive text optimization
          const optimizedText = optimizeTextContent(extractedText);

          // Write the optimized text to the text file
          await writeFile(textFilePath, optimizedText);

          // Create a minimal text file with .pdf extension
          await writeFile(optimizedPath, optimizedText);

          console.log(
            `PDF converted to text file: ${filePath} -> ${optimizedPath}`
          );
        } catch (pdfError) {
          console.error("Error in PDF text extraction:", pdfError);
          // Fallback to copying the original file
          await fs.promises.copyFile(filePath, optimizedPath);
        }
        break;
      case ".doc":
      case ".docx":
        await optimizeWord(filePath, optimizedPath);
        break;
      case ".txt":
        await optimizeTxt(filePath, optimizedPath);
        break;
      default:
        // For unsupported file types, just copy the file
        await fs.promises.copyFile(filePath, optimizedPath);
    }

    // Get optimized file size
    const optimizedStats = fs.statSync(optimizedPath);
    const optimizedSize = optimizedStats.size;

    // Calculate reduction percentage
    const reductionPercent =
      originalSize > 0
        ? ((originalSize - optimizedSize) / originalSize) * 100
        : 0;

    return {
      path: optimizedPath,
      originalSize,
      optimizedSize,
      reductionPercent: Math.round(reductionPercent * 100) / 100, // Round to 2 decimal places
    };
  } catch (error) {
    console.error(`Error optimizing file ${filePath}:`, error);
    throw error;
  }
}

/**
 * Optimize Word documents
 * @param {string} filePath - Original Word document path
 * @param {string} outputPath - Output document path
 */
async function optimizeWord(filePath, outputPath) {
  try {
    // Extract text content from Word document
    const result = await mammoth.extractRawText({ path: filePath });
    const text = result.value;

    // Optimize text by removing redundant spaces
    const optimizedText = optimizeTextContent(text);

    // Create a simple document with the optimized text
    // Note: This will save as plain text - if you need to maintain Word format,
    // you'll need a library that can write Word files
    await writeFile(outputPath, optimizedText);
  } catch (error) {
    console.error("Error optimizing Word document:", error);
    throw error;
  }
}

/**
 * Optimize text files
 * @param {string} filePath - Original text file path
 * @param {string} outputPath - Output text file path
 */
async function optimizeTxt(filePath, outputPath) {
  try {
    // Read the text file
    const text = await readFile(filePath, "utf8");

    // Optimize the text content
    const optimizedText = optimizeTextContent(text);

    // Write the optimized text to the output path
    await writeFile(outputPath, optimizedText);
  } catch (error) {
    console.error("Error optimizing text file:", error);
    throw error;
  }
}

/**
 * Aggressively optimize text content to significantly reduce size
 * @param {string} text - Original text content
 * @returns {string} - Highly optimized text content with minimal formatting
 */
function optimizeTextContent(text) {
  if (!text) return "";

  return (
    text
      // Convert to lowercase to save space (optional - comment out if you want to preserve case)
      // .toLowerCase()

      // Remove all line breaks and replace with a single space
      .replace(/\r?\n|\r/g, " ")

      // Remove all tabs
      .replace(/\t/g, " ")

      // Remove multiple spaces (including non-breaking spaces)
      .replace(/[ \u00A0]+/g, " ")

      // Remove spaces around punctuation
      .replace(/ ([.,;:!?)])/g, "$1")
      .replace(/([({]) /g, "$1")

      // Remove spaces before and after hyphens
      .replace(/ - /g, "-")

      // Remove spaces around slashes
      .replace(/ \/ /g, "/")

      // Remove spaces around equals signs
      .replace(/ = /g, "=")

      // Remove spaces around plus signs
      .replace(/ \+ /g, "+")

      // Remove spaces around asterisks
      .replace(/ \* /g, "*")

      // Remove spaces around ampersands
      .replace(/ & /g, "&")

      // Remove spaces around dollar signs
      .replace(/\$ /g, "$")

      // Remove spaces around percentage signs
      .replace(/ %/g, "%")

      // Remove spaces around bullet points
      .replace(/● /g, "●")

      // Remove redundant punctuation (optional - comment out if you want to preserve all punctuation)
      // .replace(/\.{2,}/g, ".")
      // .replace(/\,{2,}/g, ",")

      // Trim the entire text
      .trim()
  );
}

module.exports = {
  optimizeFile,
  optimizeTextContent,
};
