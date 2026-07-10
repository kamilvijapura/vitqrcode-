const fs = require('fs');
const readline = require('readline');

async function processLineByLine() {
  const fileStream = fs.createReadStream('C:\\Users\\asus\\.gemini\\antigravity-ide\\brain\\6900e399-6aa3-4c63-a861-5d3d2de3a95b\\.system_generated\\logs\\transcript_full.jsonl');

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let targetStep = 902;
  let foundTarget = false;

  for await (const line of rl) {
    if (line.includes(`"step_index":${targetStep}`)) {
      foundTarget = true;
    } else if (foundTarget && line.includes('"type":"TOOL_RESPONSE"')) {
      const obj = JSON.parse(line);
      fs.writeFileSync('C:\\Users\\asus\\Downloads\\enterprise-qr-rewards-platform (4)\\extracted_full_content.txt', obj.content);
      break;
    }
  }
}

processLineByLine();
