const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\6900e399-6aa3-4c63-a861-5d3d2de3a95b\\.system_generated\\logs\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let output = "";
  for await (const line of rl) {
    if (line.includes('"type":"TOOL_RESPONSE"') && line.includes('function DownloadPreview') && line.includes('replace_file_content')) {
        const obj = JSON.parse(line);
        output += "--- STEP " + obj.step_index + " ---\n";
        output += obj.content + "\n\n";
    }
  }
  fs.writeFileSync('C:\\Users\\asus\\Downloads\\enterprise-qr-rewards-platform (4)\\found_DownloadPreview.txt', output);
}

processLineByLine();
