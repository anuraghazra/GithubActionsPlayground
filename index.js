const Octokit = require('@octokit/rest');
const Parser = require('markdown-parser');
const { VM } = require('vm2');

require('dotenv').config();

// initialize VM
const vm = new VM({
  timeout: 1000,
  sandbox: {},
  eval: false
});

// DONT DO THIS
let consoleOverwriteScript = `
console.oldLog = console.log;
console.log = function (value) {
  console.oldLog(value);
  return value;
};
`
// default configs
let owner = 'anuraghazra';
let repo = 'GithubActionsPlayground';

// initialize contructors
const parser = new Parser();
const octokit = new Octokit({
  auth: process.env.OCTOCAT_KEY
});

async function createComment(msg, issueNumber) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issueNumber,
    body: `**Code executed [bot]:**\n\n\`\`\`bash\n${JSON.stringify(msg)}\n\`\`\``
  })
}

// get data
(async () => {
  const { data: issuesRes } = await octokit.issues.listForRepo({
    owner,
    repo
  })

  // loop thought all the issues NOTE: PR are also considered as issues
  issuesRes.forEach((issue, index) => {
    let issueNumber = issue.number
    let issueBody = issue.body


    // parse markdown
    parser.parse(issueBody, function (err, result) {
      if (err) throw new Error(err);
      // vm is acting weirdly when setting console log twice
      if (index > 0) consoleOverwriteScript = '';
      
      let code = result.codes[0].code.replace(/\n,/igm, '');
      let res = vm.run(`${consoleOverwriteScript}\n${code}`)

      createComment(res, issueNumber);
    })

  })
})()