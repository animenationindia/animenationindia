const sanitizeHtml = require('../frontend/node_modules/sanitize-html');

function sanitizeDescription(html) {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p'],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
  });
}

function sanitizeHTML(html) {
  if (!html || typeof html !== 'string') return '';
  return sanitizeHtml(html, {
    allowedTags: ['b', 'i', 'em', 'strong', 'br', 'p', 'span', 'ul', 'ol', 'li', 'a'],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      span: ['class'],
    },
    allowedSchemes: ['http', 'https'],
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', { target: '_blank', rel: 'noopener noreferrer' })
    },
    disallowedTagsMode: 'discard',
  });
}

async function testSanitizer() {
  console.log("==================================================");
  console.log("🚀 TESTING SANITIZATION SECURITY WITH SANITIZE-HTML");
  console.log("==================================================\n");

  const attackPayloads = [
    {
      name: "Script Tag Injection",
      input: "Hello<script>alert('XSS')</script> World",
    },
    {
      name: "Event Handler Injection (onerror / onclick)",
      input: "<img src='x' onerror='alert(1)' /> <b>Bold Text</b> <button onclick='doBad()'>Click</button>",
    },
    {
      name: "Iframe / Object Injection",
      input: "<iframe src='javascript:alert(1)'></iframe><p>Safe paragraph</p>",
    },
    {
      name: "Malicious javascript: URI Link",
      input: "<a href='javascript:alert(document.cookie)'>Click me</a>",
    },
    {
      name: "Valid HTTP Link",
      input: "<a href='https://example.com'>Valid Link</a>",
    },
    {
      name: "Null / Undefined Input",
      input: null,
    }
  ];

  let passedAll = true;

  for (const test of attackPayloads) {
    const descResult = sanitizeDescription(test.input);
    const htmlResult = sanitizeHTML(test.input);

    console.log(`[TEST] ${test.name}`);
    console.log(`   Input:    ${test.input}`);
    console.log(`   Desc Out: ${descResult}`);
    console.log(`   HTML Out: ${htmlResult}`);

    const hasScript = htmlResult.includes('script') || htmlResult.includes('onerror') || htmlResult.includes('javascript:');
    if (hasScript) {
      console.error(`   ❌ FAILED SECURITY CHECK: Malicious payload leaked!`);
      passedAll = false;
    } else {
      console.log(`   ✅ PASSED SECURITY CHECK: Payload stripped cleanly!`);
    }
    console.log("");
  }

  if (passedAll) {
    console.log("==================================================");
    console.log("✅ ALL SANITIZATION SECURITY TESTS PASSED 100%");
    console.log("==================================================");
  }
}

testSanitizer().catch(console.error);
