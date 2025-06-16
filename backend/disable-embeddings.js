/**
 * Embedding Control Script
 * Use this script to easily enable/disable embeddings in your Chat Agency Spark project
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

// Import embedding and docling configuration
const {
  areEmbeddingsEnabled,
  isVectorSearchEnabled,
  getFallbackSearchStrategy,
  EMBEDDING_CONFIG,
  isDoclingEnabled,
  shouldForceLLMFallback,
  getDoclingFallbackStrategy,
  DOCLING_CONFIG,
} = require("./config/embeddingConfig");

/**
 * Display current embedding status
 */
function displayEmbeddingStatus() {
  console.log("🔧 Current Embedding Configuration Status:");
  console.log("=".repeat(60));

  console.log(`📊 Main Settings:`);
  console.log(
    `   • Embeddings Enabled: ${areEmbeddingsEnabled() ? "✅ YES" : "❌ NO"}`
  );
  console.log(
    `   • Vector Search Enabled: ${
      isVectorSearchEnabled() ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Embedding Cache: ${
      EMBEDDING_CONFIG.ENABLE_EMBEDDING_CACHE ? "✅ YES" : "❌ NO"
    }`
  );

  console.log(`\n🎯 Individual Embedding Types:`);
  console.log(
    `   • Content Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_CONTENT_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Topic Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_TOPIC_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Keyword Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_KEYWORD_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Heading Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_HEADING_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Section Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_SECTION_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Audience Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_AUDIENCE_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Question Type Embeddings: ${
      EMBEDDING_CONFIG.ENABLE_QUESTION_TYPE_EMBEDDINGS ? "✅ YES" : "❌ NO"
    }`
  );

  const fallbackStrategy = getFallbackSearchStrategy();
  console.log(`\n🔄 Embedding Fallback Strategy (when embeddings disabled):`);
  console.log(
    `   • Use Metadata Search: ${
      fallbackStrategy.useMetadataSearch ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Use Text Search: ${
      fallbackStrategy.useTextSearch ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Log Skips: ${fallbackStrategy.logSkips ? "✅ YES" : "❌ NO"}`
  );

  console.log(`\n📄 Document Processing Settings:`);
  console.log(
    `   • Docling Enabled: ${isDoclingEnabled() ? "✅ YES" : "❌ NO"}`
  );
  console.log(
    `   • Force LLM Fallback: ${shouldForceLLMFallback() ? "✅ YES" : "❌ NO"}`
  );
  console.log(
    `   • Docling Service Check: ${
      DOCLING_CONFIG.ENABLE_DOCLING_SERVICE_CHECK ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Service Timeout: ${DOCLING_CONFIG.DOCLING_SERVICE_TIMEOUT}ms`
  );

  const doclingFallbackStrategy = getDoclingFallbackStrategy();
  console.log(`\n🔄 Docling Fallback Strategy (when Docling disabled):`);
  console.log(
    `   • Use LLM Processing: ${
      doclingFallbackStrategy.useLLMProcessing ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Preserve Metadata: ${
      doclingFallbackStrategy.preserveMetadata ? "✅ YES" : "❌ NO"
    }`
  );
  console.log(
    `   • Log Skips: ${doclingFallbackStrategy.logSkips ? "✅ YES" : "❌ NO"}`
  );
  console.log(
    `   • Force Fallback: ${
      doclingFallbackStrategy.forceFallback ? "✅ YES" : "❌ NO"
    }`
  );

  console.log("=".repeat(60));
}

/**
 * Update .env file to disable embeddings
 */
function disableEmbeddings() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found. Creating one...");
    fs.copyFileSync(path.join(__dirname, ".env.example"), envPath);
    console.log("✅ Created .env file from .env.example");
  }

  let envContent = fs.readFileSync(envPath, "utf8");

  // Update or add ENABLE_EMBEDDINGS=false
  if (envContent.includes("ENABLE_EMBEDDINGS=")) {
    envContent = envContent.replace(
      /ENABLE_EMBEDDINGS=.*/g,
      "ENABLE_EMBEDDINGS=false"
    );
  } else {
    envContent += "\n# Embedding Configuration\nENABLE_EMBEDDINGS=false\n";
  }

  // Add logging for debugging
  if (!envContent.includes("LOG_EMBEDDING_SKIPS=")) {
    envContent += "LOG_EMBEDDING_SKIPS=true\n";
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated .env file to disable embeddings");
  console.log("⚠️  Please restart your server for changes to take effect");
}

/**
 * Update .env file to enable embeddings
 */
function enableEmbeddings() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found. Creating one...");
    fs.copyFileSync(path.join(__dirname, ".env.example"), envPath);
    console.log("✅ Created .env file from .env.example");
  }

  let envContent = fs.readFileSync(envPath, "utf8");

  // Update or add ENABLE_EMBEDDINGS=true
  if (envContent.includes("ENABLE_EMBEDDINGS=")) {
    envContent = envContent.replace(
      /ENABLE_EMBEDDINGS=.*/g,
      "ENABLE_EMBEDDINGS=true"
    );
  } else {
    envContent += "\n# Embedding Configuration\nENABLE_EMBEDDINGS=true\n";
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated .env file to enable embeddings");
  console.log("⚠️  Please restart your server for changes to take effect");
}

/**
 * Update .env file to disable Docling processing
 */
function disableDocling() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found. Creating one...");
    fs.copyFileSync(path.join(__dirname, ".env.example"), envPath);
    console.log("✅ Created .env file from .env.example");
  }

  let envContent = fs.readFileSync(envPath, "utf8");

  // Update or add ENABLE_DOCLING=false
  if (envContent.includes("ENABLE_DOCLING=")) {
    envContent = envContent.replace(
      /ENABLE_DOCLING=.*/g,
      "ENABLE_DOCLING=false"
    );
  } else {
    envContent +=
      "\n# Document Processing Configuration\nENABLE_DOCLING=false\n";
  }

  // Add logging for debugging
  if (!envContent.includes("LOG_DOCLING_SKIPS=")) {
    envContent += "LOG_DOCLING_SKIPS=true\n";
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated .env file to disable Docling processing");
  console.log("⚠️  Please restart your server for changes to take effect");
}

/**
 * Update .env file to enable Docling processing
 */
function enableDocling() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    console.log("❌ .env file not found. Creating one...");
    fs.copyFileSync(path.join(__dirname, ".env.example"), envPath);
    console.log("✅ Created .env file from .env.example");
  }

  let envContent = fs.readFileSync(envPath, "utf8");

  // Update or add ENABLE_DOCLING=true
  if (envContent.includes("ENABLE_DOCLING=")) {
    envContent = envContent.replace(
      /ENABLE_DOCLING=.*/g,
      "ENABLE_DOCLING=true"
    );
  } else {
    envContent +=
      "\n# Document Processing Configuration\nENABLE_DOCLING=true\n";
  }

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Updated .env file to enable Docling processing");
  console.log("⚠️  Please restart your server for changes to take effect");
}

/**
 * Test embedding service wrapper
 */
async function testEmbeddingService() {
  try {
    console.log("🧪 Testing Embedding Service Wrapper...");

    const EmbeddingServiceWrapper = require("./services/embeddingServiceWrapper");
    const embeddingService = new EmbeddingServiceWrapper();

    const status = embeddingService.getStatus();
    console.log("📊 Service Status:", JSON.stringify(status, null, 2));

    // Test a simple embedding generation
    if (embeddingService.isEnabled()) {
      console.log("🔄 Testing embedding generation...");
      const testEmbedding = await embeddingService.generateEmbedding(
        "test text"
      );
      console.log(
        `✅ Embedding generated: ${testEmbedding ? "SUCCESS" : "FAILED"}`
      );
    } else {
      console.log("⏭️ Embeddings disabled - skipping generation test");
    }
  } catch (error) {
    console.error("❌ Error testing embedding service:", error.message);
  }
}

/**
 * Main CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  console.log("🚀 Chat Agency Spark - Processing Control Tool");
  console.log("");

  switch (command) {
    case "status":
      displayEmbeddingStatus();
      break;

    case "disable-embeddings":
      console.log("🔄 Disabling embeddings...");
      disableEmbeddings();
      console.log("");
      displayEmbeddingStatus();
      break;

    case "enable-embeddings":
      console.log("🔄 Enabling embeddings...");
      enableEmbeddings();
      console.log("");
      displayEmbeddingStatus();
      break;

    case "disable-docling":
      console.log("🔄 Disabling Docling processing...");
      disableDocling();
      console.log("");
      displayEmbeddingStatus();
      break;

    case "enable-docling":
      console.log("🔄 Enabling Docling processing...");
      enableDocling();
      console.log("");
      displayEmbeddingStatus();
      break;

    case "disable-all":
      console.log("🔄 Disabling both embeddings and Docling...");
      disableEmbeddings();
      disableDocling();
      console.log("");
      displayEmbeddingStatus();
      break;

    case "enable-all":
      console.log("🔄 Enabling both embeddings and Docling...");
      enableEmbeddings();
      enableDocling();
      console.log("");
      displayEmbeddingStatus();
      break;

    case "test":
      await testEmbeddingService();
      break;

    default:
      console.log("📖 Usage:");
      console.log(
        "   node disable-embeddings.js status              - Show current status"
      );
      console.log(
        "   node disable-embeddings.js disable-embeddings  - Disable embeddings only"
      );
      console.log(
        "   node disable-embeddings.js enable-embeddings   - Enable embeddings only"
      );
      console.log(
        "   node disable-embeddings.js disable-docling     - Disable Docling only"
      );
      console.log(
        "   node disable-embeddings.js enable-docling      - Enable Docling only"
      );
      console.log(
        "   node disable-embeddings.js disable-all         - Disable both"
      );
      console.log(
        "   node disable-embeddings.js enable-all          - Enable both"
      );
      console.log(
        "   node disable-embeddings.js test                - Test services"
      );
      console.log("");
      console.log(
        "💡 This tool allows you to easily control processing components"
      );
      console.log("   while preserving all your existing code for future use.");
      console.log("");
      displayEmbeddingStatus();
      break;
  }
}

// Run the CLI
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  displayEmbeddingStatus,
  disableEmbeddings,
  enableEmbeddings,
  disableDocling,
  enableDocling,
  testEmbeddingService,
};
